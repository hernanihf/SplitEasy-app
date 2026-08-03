import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BackButton } from '@/components/back-button';
import { CategoryPicker } from '@/components/category-picker';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { ScreenMeta } from '@/components/screen-meta';
import { DEFAULT_CATEGORY } from '@/constants/categories';
import { Font, Radius, avatarColor, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { currencySymbol, formatAmount, fromCents, t, toCents } from '@/lib/i18n';
import type { ScannedItem } from '@/lib/receipt-scan';
import { useColors } from '@/lib/settings';
import { distributeCents } from '@/lib/split-math';
import type { Expense, Group } from '@/app/groups/[id]/index';

// Item amounts are edited as raw text (like every other amount field in this
// app) and only parsed to cents where needed, so the input never fights the
// user mid-keystroke re-formatting what they just typed.
type EditableItem = { description: string; amountText: string };
// Discounts, tips, and other adjustments to the items total — same free-text
// amount, but signed via an explicit toggle rather than a leading '-'.
type EditableAdjustment = { description: string; amountText: string; negative: boolean };

export default function ItemizeScreen() {
  const {
    id,
    description,
    category: categoryParam,
    items: itemsParam,
    receiptImagePath,
    expense: expenseParam,
  } = useLocalSearchParams<{
    id: string;
    description?: string;
    total?: string;
    category?: string;
    items?: string;
    receiptImagePath?: string;
    expense?: string;
  }>();
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  // Editing an existing itemized expense: prefilled from the snapshot passed
  // in by expense-detail, not re-fetched.
  const existing = useMemo<Expense | null>(() => {
    if (!expenseParam) return null;
    try {
      return JSON.parse(expenseParam);
    } catch {
      return null;
    }
  }, [expenseParam]);
  const isEditMode = existing != null;

  const scannedItems = useMemo<ScannedItem[]>(() => {
    try {
      return JSON.parse(itemsParam ?? '[]');
    } catch {
      return [];
    }
  }, [itemsParam]);

  const [group, setGroup] = useState<Group | null>(null);
  const [desc, setDesc] = useState(existing?.description ?? description ?? '');
  const [category, setCategory] = useState<string>(
    existing?.category ?? categoryParam ?? DEFAULT_CATEGORY,
  );
  const [paidBy, setPaidBy] = useState<number | null>(existing?.paid_by.id ?? null);
  // A previously-saved adjustment (discount, tip, fee) is just an item with a
  // negative amount — split back into the two lists by sign so editing an
  // existing itemized expense reopens with the same Items/Adjustments layout
  // it was created with. Scanned receipts never carry a negative line, so
  // they all land in items.
  const [items, setItems] = useState<EditableItem[]>(() => {
    const source = existing?.items ?? scannedItems;
    return source
      .filter((it) => it.amount >= 0)
      .map((it) => ({ description: it.description, amountText: fromCents(it.amount) }));
  });
  // assignments[i] = user ids the item is shared among.
  const [assignments, setAssignments] = useState<number[][]>(() =>
    existing?.items
      ? existing.items.filter((it) => it.amount >= 0).map((it) => it.users.map((u) => u.id))
      : [],
  );
  const [adjustments, setAdjustments] = useState<EditableAdjustment[]>(() => {
    const source = existing?.items ?? [];
    return source
      .filter((it) => it.amount < 0)
      .map((it) => ({ description: it.description, amountText: fromCents(-it.amount), negative: true }));
  });
  const [adjustmentAssignments, setAdjustmentAssignments] = useState<number[][]>(() =>
    (existing?.items ?? []).filter((it) => it.amount < 0).map((it) => it.users.map((u) => u.id)),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<Group>(`/api/v1/groups/${id}`),
      api.get<{ id: number }>('/api/v1/users/me'),
    ]).then(([g, me]) => {
      setGroup(g);
      // Editing already has a real payer and per-item assignments from the
      // existing expense — only default them for a brand new one.
      if (!isEditMode) {
        setPaidBy(g.members.some((m) => m.id === me.id) ? me.id : (g.members[0]?.id ?? null));
        const everyone = g.members.map((m) => m.id);
        setAssignments(Array.from({ length: scannedItems.length }, () => [...everyone]));
      }
    });
  }, [id, api, isEditMode, scannedItems.length]);

  const memberIds = group?.members.map((m) => m.id) ?? [];
  const itemCents = useMemo(() => items.map((it) => toCents(it.amountText)), [items]);
  const adjustmentCents = useMemo(
    () => adjustments.map((a) => (a.negative ? -1 : 1) * toCents(a.amountText)),
    [adjustments],
  );
  const totalToSplit = useMemo(
    () => itemCents.reduce((s, c) => s + c, 0) + adjustmentCents.reduce((s, c) => s + c, 0),
    [itemCents, adjustmentCents],
  );

  // Items and adjustments are just two lists of signed lines sharing the
  // same per-line distribution — each line's cents get split across whoever
  // it's assigned to, and every member's shares across every line add up to
  // what they owe.
  const perPerson = useMemo(() => {
    const sub: Record<number, number> = {};
    memberIds.forEach((uid) => (sub[uid] = 0));

    const applyLine = (cents: number, assigned: number[]) => {
      if (assigned.length === 0) return;
      const shares = distributeCents(cents, assigned.map(() => 1));
      assigned.forEach((uid, k) => (sub[uid] = (sub[uid] ?? 0) + shares[k]));
    };

    itemCents.forEach((cents, i) => applyLine(cents, assignments[i] ?? []));
    adjustmentCents.forEach((cents, i) => applyLine(cents, adjustmentAssignments[i] ?? []));

    return sub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCents, assignments, adjustmentCents, adjustmentAssignments, group]);

  const toggle = (itemIndex: number, userId: number) => {
    setAssignments((prev) =>
      prev.map((a, i) => {
        if (i !== itemIndex) return a;
        return a.includes(userId) ? a.filter((u) => u !== userId) : [...a, userId];
      }),
    );
  };

  const updateItemDescription = (itemIndex: number, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === itemIndex ? { ...it, description: value } : it)));
  };

  const updateItemAmount = (itemIndex: number, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === itemIndex ? { ...it, amountText: value } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', amountText: '' }]);
    setAssignments((prev) => [...prev, [...memberIds]]);
  };

  const removeItem = (itemIndex: number) => {
    setItems((prev) => prev.filter((_, i) => i !== itemIndex));
    setAssignments((prev) => prev.filter((_, i) => i !== itemIndex));
  };

  const toggleAdjustment = (adjIndex: number, userId: number) => {
    setAdjustmentAssignments((prev) =>
      prev.map((a, i) => {
        if (i !== adjIndex) return a;
        return a.includes(userId) ? a.filter((u) => u !== userId) : [...a, userId];
      }),
    );
  };

  const updateAdjustmentDescription = (adjIndex: number, value: string) => {
    setAdjustments((prev) => prev.map((a, i) => (i === adjIndex ? { ...a, description: value } : a)));
  };

  const updateAdjustmentAmount = (adjIndex: number, value: string) => {
    setAdjustments((prev) => prev.map((a, i) => (i === adjIndex ? { ...a, amountText: value } : a)));
  };

  const toggleAdjustmentSign = (adjIndex: number, negative: boolean) => {
    setAdjustments((prev) => prev.map((a, i) => (i === adjIndex ? { ...a, negative } : a)));
  };

  const addAdjustment = () => {
    setAdjustments((prev) => [...prev, { description: '', amountText: '', negative: true }]);
    setAdjustmentAssignments((prev) => [...prev, [...memberIds]]);
  };

  const removeAdjustment = (adjIndex: number) => {
    setAdjustments((prev) => prev.filter((_, i) => i !== adjIndex));
    setAdjustmentAssignments((prev) => prev.filter((_, i) => i !== adjIndex));
  };

  const confirm = async () => {
    if (!group || !paidBy) return;

    // Blank rows (never touched after being added) are dropped silently
    // instead of forcing the user to explicitly delete every one they
    // didn't end up using.
    const cleanItems = items
      .map((it, i) => ({ it, assigned: assignments[i] ?? [] }))
      .filter(({ it }) => it.description.trim() || toCents(it.amountText) !== 0);
    const cleanAdjustments = adjustments
      .map((a, i) => ({ a, assigned: adjustmentAssignments[i] ?? [] }))
      .filter(({ a }) => a.description.trim() || toCents(a.amountText) !== 0);

    if (cleanItems.some(({ it }) => !it.description.trim() || toCents(it.amountText) <= 0)) {
      return setError(t('itemize.itemsInvalid'));
    }
    if (cleanAdjustments.some(({ a }) => !a.description.trim() || toCents(a.amountText) === 0)) {
      return setError(t('itemize.adjustmentsInvalid'));
    }
    if (
      cleanItems.some(({ assigned }) => assigned.length === 0) ||
      cleanAdjustments.some(({ assigned }) => assigned.length === 0)
    ) {
      return setError(t('itemize.assignAll'));
    }

    setSubmitting(true);
    setError(null);
    const payload = {
      group_id: group.id,
      paid_by_id: paidBy,
      description: desc.trim() || t('scanReceipt.defaultMerchant'),
      category,
      amount: totalToSplit,
      split_method: 'fixed',
      splits: group.members.map((m) => ({ user_id: m.id, value: perPerson[m.id] ?? 0 })),
      items: [
        ...cleanItems.map(({ it, assigned }) => ({
          description: it.description.trim(),
          amount: toCents(it.amountText),
          user_ids: assigned,
        })),
        ...cleanAdjustments.map(({ a, assigned }) => ({
          description: a.description.trim(),
          amount: (a.negative ? -1 : 1) * toCents(a.amountText),
          user_ids: assigned,
        })),
      ],
      // Only ever present for a brand-new itemized expense created from a
      // scan — editing doesn't re-scan, and the backend never sends the raw
      // storage path back to the client, so there's nothing to preserve
      // here (omitting it just leaves the existing image untouched).
      ...(!isEditMode && receiptImagePath ? { receipt_image_path: receiptImagePath } : {}),
    };
    try {
      if (isEditMode && existing) {
        await api.put(`/api/v1/expenses/${existing.id}`, payload);
      } else {
        await api.post('/api/v1/expenses', payload);
      }
      router.replace(`/groups/${id}`);
    } catch {
      setError(t(isEditMode ? 'addExpense.updateError' : 'addExpense.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!group) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <ScreenMeta title={t(isEditMode ? 'addExpense.editTitle' : 'itemize.title')} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topbar}>
          {/* Getting here always means real work is on the line — a scan
              result (costly to redo) or an in-progress edit — so back
              always confirms, unlike add-expense's blank-form fast path. */}
          <BackButton onPress={() => setConfirmingDiscard(true)} />
          <Text style={styles.topTitle}>{t(isEditMode ? 'addExpense.editTitle' : 'itemize.title')}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>{t('itemize.total')}</Text>
            <Text style={styles.totalValue}>{formatAmount(totalToSplit, group.currency)}</Text>
          </View>

          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder={t('addExpense.descriptionPlaceholder')}
            placeholderTextColor={Palette.muted}
            style={styles.descInput}
          />

          {/* category */}
          <Text style={styles.sectionLabel}>{t('categories.label')}</Text>
          <CategoryPicker value={category} onChange={setCategory} />

          {/* who paid */}
          <Text style={styles.sectionLabel}>{t('addExpense.whoPaid')}</Text>
          <View style={styles.chips}>
            {group.members.map((m) => {
              const active = paidBy === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setPaidBy(m.id)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Avatar uri={m.avatar_url} name={m.name} size={24} color={avatarColor(m.id)} fontSize={11} />
                  <Text style={styles.chipText}>{m.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* items */}
          <Text style={styles.sectionLabel}>{t('itemize.assignItems')}</Text>
          <View style={styles.card}>
            {items.map((it, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemHeader}>
                  <TextInput
                    value={it.description}
                    onChangeText={(v) => updateItemDescription(i, v)}
                    placeholder={t('addExpense.descriptionPlaceholder')}
                    placeholderTextColor={Palette.muted}
                    style={styles.itemDescInput}
                  />
                  <View style={styles.itemAmountRow}>
                    <Text style={styles.itemAmountDollar}>{currencySymbol(group.currency)}</Text>
                    <TextInput
                      value={it.amountText}
                      onChangeText={(v) => updateItemAmount(i, v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Palette.muted}
                      style={styles.itemAmountInput}
                    />
                    <Pressable onPress={() => removeItem(i)} hitSlop={8} style={styles.rowDeleteBtn}>
                      <Icon name="x" size={13} color={Palette.muted} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.assignRow}>
                  {group.members.map((m) => {
                    const on = (assignments[i] ?? []).includes(m.id);
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => toggle(i, m.id)}
                        style={[styles.assignChip, on && styles.assignChipOn]}>
                        <Avatar uri={m.avatar_url} name={m.name} size={22} color={avatarColor(m.id)} fontSize={10} />
                        <Text style={[styles.assignName, on && styles.assignNameOn]}>{m.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
          <Pressable onPress={addItem} style={styles.addRowBtn}>
            <Text style={styles.addRowBtnText}>{t('itemize.addItem')}</Text>
          </Pressable>

          {/* discounts, tips, fees — anything that changes the items total */}
          <Text style={styles.sectionLabel}>{t('itemize.adjustments')}</Text>
          <View style={styles.card}>
            {adjustments.length === 0 && (
              <Text style={styles.adjustmentsEmpty}>{t('itemize.adjustmentsEmpty')}</Text>
            )}
            {adjustments.map((a, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemHeader}>
                  <TextInput
                    value={a.description}
                    onChangeText={(v) => updateAdjustmentDescription(i, v)}
                    placeholder={t('addExpense.descriptionPlaceholder')}
                    placeholderTextColor={Palette.muted}
                    style={[styles.itemDescInput, a.negative ? styles.adjustmentTextNegative : styles.adjustmentTextPositive]}
                  />
                  <View style={[styles.itemAmountRow, styles.adjustmentAmountRow]}>
                    <View style={styles.signToggle}>
                      <Pressable
                        onPress={() => toggleAdjustmentSign(i, true)}
                        style={[styles.signBtn, a.negative && styles.signBtnActiveNegative]}>
                        <Text style={[styles.signBtnText, a.negative && styles.signBtnTextActive]}>−</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => toggleAdjustmentSign(i, false)}
                        style={[styles.signBtn, !a.negative && styles.signBtnActivePositive]}>
                        <Text style={[styles.signBtnText, !a.negative && styles.signBtnTextActive]}>+</Text>
                      </Pressable>
                    </View>
                    <Text
                      style={[
                        styles.itemAmountDollar,
                        a.negative ? styles.adjustmentTextNegative : styles.adjustmentTextPositive,
                      ]}>
                      {currencySymbol(group.currency)}
                    </Text>
                    <TextInput
                      value={a.amountText}
                      onChangeText={(v) => updateAdjustmentAmount(i, v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Palette.muted}
                      style={[
                        styles.itemAmountInput,
                        a.negative ? styles.adjustmentTextNegative : styles.adjustmentTextPositive,
                      ]}
                    />
                    <Pressable onPress={() => removeAdjustment(i)} hitSlop={8} style={styles.rowDeleteBtn}>
                      <Icon name="x" size={13} color={Palette.muted} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.assignRow}>
                  {group.members.map((m) => {
                    const on = (adjustmentAssignments[i] ?? []).includes(m.id);
                    const onStyle = a.negative ? styles.assignChipOnAdjustment : styles.assignChipOn;
                    const nameOnStyle = a.negative ? styles.assignNameOnAdjustment : styles.assignNameOn;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => toggleAdjustment(i, m.id)}
                        style={[styles.assignChip, on && onStyle]}>
                        <Avatar uri={m.avatar_url} name={m.name} size={22} color={avatarColor(m.id)} fontSize={10} />
                        <Text style={[styles.assignName, on && nameOnStyle]}>{m.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
          <Pressable onPress={addAdjustment} style={styles.addRowBtn}>
            <Text style={styles.addRowBtnText}>{t('itemize.addAdjustment')}</Text>
          </Pressable>

          {/* per-person preview */}
          <Text style={styles.sectionLabel}>{t('itemize.perPerson')}</Text>
          <View style={styles.card}>
            {group.members.map((m) => (
              <View key={m.id} style={styles.previewRow}>
                <Avatar uri={m.avatar_url} name={m.name} size={28} color={avatarColor(m.id)} fontSize={12} />
                <Text style={styles.previewName} numberOfLines={1}>{m.name}</Text>
                <Text style={styles.previewAmount}>{formatAmount(perPerson[m.id] ?? 0, group.currency)}</Text>
              </View>
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={confirm}
            disabled={submitting}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <Text style={styles.ctaText}>{t(isEditMode ? 'addExpense.save' : 'itemize.confirm')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <ConfirmDialog
        visible={confirmingDiscard}
        title={t('addExpense.discardTitle')}
        message={t('addExpense.discardMessage')}
        confirmLabel={t('addExpense.discard')}
        onCancel={() => setConfirmingDiscard(false)}
        onConfirm={() => router.back()}
      />
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: Palette.bg },
    safe: { flex: 1 },
    topbar: {
      paddingHorizontal: 18,
      paddingTop: 2,
      paddingBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    topTitle: { fontSize: 15, fontFamily: Font.sansSemibold, color: Palette.ink },
    scroll: { paddingHorizontal: 20, paddingBottom: 24 },
    totalCard: {
      alignItems: 'center',
      paddingVertical: 16,
      marginTop: 4,
      marginBottom: 12,
      backgroundColor: Palette.inputBg,
      borderRadius: Radius.lg,
    },
    totalLabel: { fontSize: 12.5, color: Palette.muted, fontFamily: Font.sansMedium, marginBottom: 4 },
    totalValue: { fontSize: 30, fontFamily: Font.monoSemibold, color: Palette.ink },
    descInput: {
      height: 48,
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.md,
      paddingHorizontal: 14,
      fontSize: 15,
      fontFamily: Font.sans,
      color: Palette.ink,
      marginBottom: 6,
    },
    sectionLabel: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.ink, marginTop: 14, marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingVertical: 7,
      paddingHorizontal: 11,
      borderRadius: Radius.pill,
      borderWidth: 1.5,
      borderColor: Palette.cardBorder,
    },
    chipActive: { backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
    chipText: { fontSize: 13.5, fontFamily: Font.sansMedium, color: Palette.ink },
    card: {
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    itemRow: { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Palette.divider },
    itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    // minWidth: 0 overrides the flex item default of min-width: auto, which
    // sizes to content and ignores flex: 1 — without it, a long item name
    // refuses to shrink and pushes the amount off the right edge on a
    // narrow phone instead of wrapping the row.
    itemDescInput: {
      flex: 1,
      minWidth: 0,
      fontSize: 14.5,
      fontFamily: Font.sansMedium,
      color: Palette.ink,
      paddingVertical: 4,
    },
    // Fixed width + flex-end so every row's amount ends at the same right
    // edge (a column), regardless of how long the item name or the currency
    // code (e.g. "ARS" vs "$") is — the symbol and digits stay glued
    // together as a group, just anchored to the box's right edge.
    itemAmountRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 0, width: 108, justifyContent: 'flex-end' },
    // Adjustments carry a sign toggle too, so their row needs more room than
    // a plain item row.
    adjustmentAmountRow: { width: 168 },
    itemAmountDollar: { fontSize: 14, fontFamily: Font.monoSemibold, color: Palette.muted, marginRight: 3 },
    // Without maxWidth, react-native-web resolves this <input>'s width against
    // the viewport rather than its actual container, which — inside a
    // fixed-width flex-end row — makes it shrink back down and clip the
    // digits instead of overflowing.
    itemAmountInput: {
      fontSize: 14,
      fontFamily: Font.monoSemibold,
      color: Palette.ink,
      minWidth: 34,
      maxWidth: 64,
      paddingVertical: 4,
    },
    rowDeleteBtn: { marginLeft: 7, padding: 2 },
    addRowBtn: {
      marginTop: 10,
      marginBottom: 2,
      paddingVertical: 11,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: Palette.cardBorder,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addRowBtnText: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.muted },
    adjustmentTextNegative: { color: Palette.red },
    adjustmentTextPositive: { color: Palette.greenDark },
    adjustmentsEmpty: {
      fontSize: 12.5,
      fontFamily: Font.sans,
      color: Palette.muted,
      textAlign: 'center',
      paddingVertical: 14,
    },
    signToggle: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: 8,
      overflow: 'hidden',
      marginRight: 6,
    },
    signBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    signBtnActiveNegative: { backgroundColor: Palette.red },
    signBtnActivePositive: { backgroundColor: Palette.green },
    signBtnText: { fontSize: 14, fontFamily: Font.sansBold, color: Palette.muted },
    signBtnTextActive: { color: '#fff' },
    assignRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
    assignChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderRadius: Radius.pill,
      borderWidth: 1.5,
      borderColor: Palette.cardBorder,
      opacity: 0.45,
    },
    assignChipOn: { opacity: 1, backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
    assignChipOnAdjustment: { opacity: 1, backgroundColor: `${Palette.red}26`, borderColor: `${Palette.red}55` },
    assignName: { fontSize: 12.5, fontFamily: Font.sansMedium, color: Palette.ink },
    assignNameOn: { color: Palette.greenDark },
    assignNameOnAdjustment: { color: Palette.red },
    previewRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
    previewName: { flex: 1, minWidth: 0, fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
    previewAmount: { fontSize: 14, fontFamily: Font.monoSemibold, color: Palette.ink },
    error: { color: Palette.red, fontSize: 13, marginTop: 12, textAlign: 'center' },
    footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
    cta: {
      height: 54,
      borderRadius: 16,
      backgroundColor: Palette.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.85 },
    ctaText: { color: '#fff', fontSize: 15, fontFamily: Font.sansSemibold },
  });
