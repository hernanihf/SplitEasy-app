import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BackButton } from '@/components/back-button';
import { Font, Radius, avatarColor, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { formatAmount, t } from '@/lib/i18n';
import type { ScannedItem } from '@/lib/receipt-scan';
import { useColors } from '@/lib/settings';
import { distributeCents } from '@/lib/split-math';
import type { Group } from '@/app/groups/[id]/index';

type TaxMode = 'proportional' | 'equal';

export default function ItemizeScreen() {
  const { id, description, total: totalParam, items: itemsParam } = useLocalSearchParams<{
    id: string;
    description?: string;
    total?: string;
    items?: string;
  }>();
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  const total = useMemo(() => parseInt(totalParam ?? '0', 10) || 0, [totalParam]);
  const items = useMemo<ScannedItem[]>(() => {
    try {
      return JSON.parse(itemsParam ?? '[]');
    } catch {
      return [];
    }
  }, [itemsParam]);

  const [group, setGroup] = useState<Group | null>(null);
  const [desc, setDesc] = useState(description ?? '');
  const [paidBy, setPaidBy] = useState<number | null>(null);
  // assignments[i] = user ids the item is shared among.
  const [assignments, setAssignments] = useState<number[][]>([]);
  const [taxMode, setTaxMode] = useState<TaxMode>('proportional');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<Group>(`/api/v1/groups/${id}`),
      api.get<{ id: number }>('/api/v1/users/me'),
    ]).then(([g, me]) => {
      setGroup(g);
      setPaidBy(g.members.some((m) => m.id === me.id) ? me.id : (g.members[0]?.id ?? null));
      // Default: every item shared by everyone, the user then narrows it down.
      const everyone = g.members.map((m) => m.id);
      setAssignments(items.map(() => [...everyone]));
    });
  }, [id, api, items]);

  const memberIds = group?.members.map((m) => m.id) ?? [];

  const { perPerson, extra } = useMemo(() => {
    const itemSub: Record<number, number> = {};
    memberIds.forEach((uid) => (itemSub[uid] = 0));

    items.forEach((it, i) => {
      const assigned = assignments[i] ?? [];
      if (assigned.length === 0) return;
      const shares = distributeCents(it.amount, assigned.map(() => 1));
      assigned.forEach((uid, k) => (itemSub[uid] = (itemSub[uid] ?? 0) + shares[k]));
    });

    const sumItems = items.reduce((s, it) => s + it.amount, 0);
    const extra = total - sumItems;

    const useProportional = taxMode === 'proportional' && memberIds.some((uid) => itemSub[uid] > 0);
    const weights = useProportional ? memberIds.map((uid) => itemSub[uid]) : memberIds.map(() => 1);
    const extraShares = distributeCents(extra, weights);

    const perPerson: Record<number, number> = {};
    memberIds.forEach((uid, i) => (perPerson[uid] = (itemSub[uid] ?? 0) + extraShares[i]));
    return { perPerson, extra };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, assignments, taxMode, group, total]);

  const toggle = (itemIndex: number, userId: number) => {
    setAssignments((prev) =>
      prev.map((a, i) => {
        if (i !== itemIndex) return a;
        return a.includes(userId) ? a.filter((u) => u !== userId) : [...a, userId];
      }),
    );
  };

  const confirm = async () => {
    if (!group || !paidBy) return;
    if (assignments.some((a) => a.length === 0)) return setError(t('itemize.assignAll'));

    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/v1/expenses', {
        group_id: group.id,
        paid_by_id: paidBy,
        description: desc.trim() || t('scanReceipt.defaultMerchant'),
        amount: total,
        split_method: 'fixed',
        splits: group.members.map((m) => ({ user_id: m.id, value: perPerson[m.id] ?? 0 })),
        items: items.map((it, i) => ({
          description: it.description,
          amount: it.amount,
          user_ids: assignments[i] ?? [],
        })),
      });
      router.replace(`/groups/${id}`);
    } catch {
      setError(t('addExpense.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!group) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topbar}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.topTitle}>{t('itemize.title')}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>{t('itemize.total')}</Text>
            <Text style={styles.totalValue}>{formatAmount(total)}</Text>
          </View>

          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder={t('addExpense.descriptionPlaceholder')}
            placeholderTextColor={Palette.muted}
            style={styles.descInput}
          />

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
                  <Text style={styles.itemDesc} numberOfLines={1}>
                    {it.description}
                  </Text>
                  <Text style={styles.itemAmount}>{formatAmount(it.amount)}</Text>
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
                <Text style={styles.taxAmount}>{formatAmount(extra)}</Text>
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
                <Text style={styles.previewName}>{m.name}</Text>
                <Text style={styles.previewAmount}>{formatAmount(perPerson[m.id] ?? 0)}</Text>
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
            <Text style={styles.ctaText}>{t('itemize.confirm')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
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
    itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    itemDesc: { flex: 1, fontSize: 14.5, fontFamily: Font.sansMedium, color: Palette.ink },
    itemAmount: { fontSize: 14, fontFamily: Font.monoSemibold, color: Palette.ink, marginLeft: 8 },
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
    previewName: { flex: 1, fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
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
