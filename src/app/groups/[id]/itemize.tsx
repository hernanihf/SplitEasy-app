import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BackButton } from '@/components/back-button';
import { CategoryPicker } from '@/components/category-picker';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ScreenMeta } from '@/components/screen-meta';
import { DEFAULT_CATEGORY } from '@/constants/categories';
import { Font, Radius, avatarColor, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { currencySymbol, formatAmount, fromCents, t, toCents } from '@/lib/i18n';
import type { ScannedItem } from '@/lib/receipt-scan';
import { useColors } from '@/lib/settings';
import { distributeCents } from '@/lib/split-math';
import type { Expense, Group } from '@/app/groups/[id]/index';

type TaxMode = 'proportional' | 'equal';

// Item amounts are edited as raw text (like every other amount field in this
// app) and only parsed to cents where needed, so the input never fights the
// user mid-keystroke re-formatting what they just typed.
type EditableItem = { description: string; amountText: string };

export default function ItemizeScreen() {
  const {
    id,
    description,
    total: totalParam,
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

  const total = useMemo(
    () => (existing ? existing.amount : parseInt(totalParam ?? '0', 10) || 0),
    [existing, totalParam],
  );

  const [group, setGroup] = useState<Group | null>(null);
  const [desc, setDesc] = useState(existing?.description ?? description ?? '');
  const [category, setCategory] = useState<string>(
    existing?.category ?? categoryParam ?? DEFAULT_CATEGORY,
  );
  const [paidBy, setPaidBy] = useState<number | null>(existing?.paid_by.id ?? null);
  const [items, setItems] = useState<EditableItem[]>(() => {
    const source = existing?.items ?? scannedItems;
    return source.map((it) => ({ description: it.description, amountText: fromCents(it.amount) }));
  });
  // assignments[i] = user ids the item is shared among.
  const [assignments, setAssignments] = useState<number[][]>(() =>
    existing?.items ? existing.items.map((it) => it.users.map((u) => u.id)) : [],
  );
  const [taxMode, setTaxMode] = useState<TaxMode>('proportional');
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
        setAssignments(Array.from({ length: items.length }, () => [...everyone]));
      }
    });
    // items.length only varies at mount (items are editable in place, not
    // added/removed), so it's safe here without re-running on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, api, isEditMode, items.length]);

  const memberIds = group?.members.map((m) => m.id) ?? [];
  const itemCents = useMemo(() => items.map((it) => toCents(it.amountText)), [items]);

  const { perPerson, extra } = useMemo(() => {
    const itemSub: Record<number, number> = {};
    memberIds.forEach((uid) => (itemSub[uid] = 0));

    itemCents.forEach((cents, i) => {
      const assigned = assignments[i] ?? [];
      if (assigned.length === 0) return;
      const shares = distributeCents(cents, assigned.map(() => 1));
      assigned.forEach((uid, k) => (itemSub[uid] = (itemSub[uid] ?? 0) + shares[k]));
    });

    const sumItems = itemCents.reduce((s, c) => s + c, 0);
    const extra = total - sumItems;

    const useProportional = taxMode === 'proportional' && memberIds.some((uid) => itemSub[uid] > 0);
    const weights = useProportional ? memberIds.map((uid) => itemSub[uid]) : memberIds.map(() => 1);
    const extraShares = distributeCents(extra, weights);

    const perPerson: Record<number, number> = {};
    memberIds.forEach((uid, i) => (perPerson[uid] = (itemSub[uid] ?? 0) + extraShares[i]));
    return { perPerson, extra };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCents, assignments, taxMode, group, total]);

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

  const confirm = async () => {
    if (!group || !paidBy) return;
    if (items.some((it) => !it.description.trim() || toCents(it.amountText) <= 0)) {
      return setError(t('itemize.itemsInvalid'));
    }
    if (assignments.some((a) => a.length === 0)) return setError(t('itemize.assignAll'));

    setSubmitting(true);
    setError(null);
    const payload = {
      group_id: group.id,
      paid_by_id: paidBy,
      description: desc.trim() || t('scanReceipt.defaultMerchant'),
      category,
      amount: total,
      split_method: 'fixed',
      splits: group.members.map((m) => ({ user_id: m.id, value: perPerson[m.id] ?? 0 })),
      items: items.map((it, i) => ({
        description: it.description.trim(),
        amount: itemCents[i],
        user_ids: assignments[i] ?? [],
      })),
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
            <Text style={styles.totalValue}>{formatAmount(total, group.currency)}</Text>
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

          {/* tax / tip */}
          {extra !== 0 && (
            <>
              <View style={styles.taxHeader}>
                <Text style={styles.sectionLabel}>{t('itemize.taxTip')}</Text>
                <Text style={styles.taxAmount}>{formatAmount(extra, group.currency)}</Text>
              </View>
              <View style={styles.segment}>
                {(['proportional', 'equal'] as TaxMode[]).map((mode) => {
                  const active = taxMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => setTaxMode(mode)}
                      style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                        {t(mode === 'proportional' ? 'itemize.proportional' : 'itemize.equal')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

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
    itemAmountRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
    itemAmountDollar: { fontSize: 14, fontFamily: Font.monoSemibold, color: Palette.muted, marginRight: 1 },
    // Left-aligned and just wide enough for a typical amount — a right-aligned
    // fixed-width box left a gap between the currency symbol and a short
    // value (e.g. "US$" ... "31.4"), stealing width the item name could use.
    itemAmountInput: {
      fontSize: 14,
      fontFamily: Font.monoSemibold,
      color: Palette.ink,
      minWidth: 34,
      paddingVertical: 4,
    },
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
    assignName: { fontSize: 12.5, fontFamily: Font.sansMedium, color: Palette.ink },
    assignNameOn: { color: Palette.greenDark },
    taxHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    taxAmount: { fontSize: 14, fontFamily: Font.monoSemibold, color: Palette.ink, marginTop: 14 },
    segment: { flexDirection: 'row', backgroundColor: Palette.inputBg, borderRadius: 13, padding: 4 },
    segmentBtn: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    segmentBtnActive: { backgroundColor: Palette.card, borderWidth: StyleSheet.hairlineWidth, borderColor: Palette.cardBorder },
    segmentText: { fontSize: 13.5, fontFamily: Font.sansMedium, color: Palette.muted2 },
    segmentTextActive: { color: Palette.ink, fontFamily: Font.sansSemibold },
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
