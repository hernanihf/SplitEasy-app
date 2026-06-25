import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BackButton } from '@/components/back-button';
import { BottomNav } from '@/components/bottom-nav';
import { Font, Radius, avatarColor, expenseEmoji, initial, tileBg, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { formatAmount, t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

export type Group = {
  id: number;
  name: string;
  emoji: string;
  members: { id: number; name: string; avatar_url?: string | null }[];
};

type Expense = {
  id: number;
  description: string;
  amount: number;
  paid_by: { id: number; name: string };
  splits: { user_id: number; amount: number }[];
};

type Debt = { from_user_id: number; to_user_id: number; amount: number };

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [myId, setMyId] = useState<number | null>(null);
  const [tab, setTab] = useState<'expenses' | 'balances'>('expenses');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<Group>(`/api/v1/groups/${id}`),
      api.get<Expense[]>(`/api/v1/groups/${id}/expenses`),
      api.get<Debt[]>(`/api/v1/groups/${id}/balances`),
      api.get<{ id: number }>('/api/v1/users/me'),
    ])
      .then(([g, ex, d, me]) => {
        setGroup(g);
        setExpenses(ex ?? []);
        setDebts(d ?? []);
        setMyId(me.id);
      })
      .catch(() => setError(t('groupDetail.loadError')))
      .finally(() => setLoading(false));
  }, [id, api]);

  useFocusEffect(load);

  // Preload the invite link so the copy button can write to the clipboard
  // synchronously on click — Safari rejects clipboard writes that happen after
  // an awaited fetch, since the user gesture is considered consumed.
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      api
        .get<{ url: string }>(`/api/v1/groups/${id}/invite`)
        .then(({ url }) => setInviteUrl(url))
        .catch(() => {});
    }, [id, api]),
  );

  // Auto-dismiss the error toast.
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 2600);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  // Briefly show the copied tick on the share button.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const memberName = useCallback(
    (uid: number) =>
      group?.members.find((m) => m.id === uid)?.name ?? t('groupDetail.userN', { id: uid }),
    [group],
  );

  const memberAvatar = useCallback(
    (uid: number) => group?.members.find((m) => m.id === uid)?.avatar_url ?? '',
    [group],
  );

  const handleShare = useCallback(async () => {
    let url = inviteUrl;
    if (!url) {
      try {
        url = (await api.get<{ url: string }>(`/api/v1/groups/${id}/invite`)).url;
      } catch {
        setErrorMsg(t('groupDetail.shareError'));
        return;
      }
    }
    if (Platform.OS === 'web') {
      // Copy straight to the clipboard instead of opening the OS share sheet.
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setErrorMsg(t('groupDetail.copyError'));
      }
    } else {
      Share.share({ message: url }).catch(() => {});
    }
  }, [api, id, inviteUrl]);

  if (loading && !group) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.center}>
          <Text style={styles.muted}>{t('groupDetail.loading')}</Text>
        </SafeAreaView>
      </View>
    );
  }
  if (error || !group) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.center}>
          <Text style={styles.muted}>{error ?? t('groupDetail.notFound')}</Text>
        </SafeAreaView>
      </View>
    );
  }

  // My net in this group, derived from simplified debts.
  let myNet = 0;
  for (const d of debts) {
    if (d.to_user_id === myId) myNet += d.amount;
    if (d.from_user_id === myId) myNet -= d.amount;
  }
  const owed = myNet > 0.01;
  const owe = myNet < -0.01;
  const summaryColor = owed ? Palette.green : owe ? Palette.red : Palette.muted;
  const summaryWord = owed
    ? t('groupDetail.wordOwed')
    : owe
      ? t('groupDetail.wordOwe')
      : t('groupDetail.wordSettled');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* top bar */}
        <View style={styles.topbar}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.topActions}>
            <Pressable
              onPress={handleShare}
              style={styles.iconBtn}
              accessibilityLabel={t('groupDetail.copyLink')}>
              {copied ? (
                <Text style={styles.copiedTick}>✓</Text>
              ) : (
                <Text style={styles.shareGlyph}>🔗</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setTab('balances')} style={styles.settlePill}>
              <Text style={styles.settlePillText}>{t('groupDetail.settleUp')}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* group header */}
          <View style={styles.groupHead}>
            <View style={[styles.tile, { backgroundColor: tileBg(group.id) }]}>
              <Text style={styles.tileEmoji}>{group.emoji || '💸'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {t('groupDetail.memberCount', { count: group.members.length })}
              </Text>
            </View>
          </View>

          {/* balance summary */}
          <View
            style={[
              styles.summary,
              {
                backgroundColor: owe ? '#FBEEEC' : owed ? Palette.greenTint : Palette.card,
                borderColor: owe ? '#F0D6D2' : owed ? Palette.greenTintBorder : Palette.cardBorder,
              },
            ]}>
            <Text style={styles.summaryLabel}>{t('groupDetail.yourBalance')}</Text>
            <Text style={[styles.summaryAmount, { color: summaryColor }]}>
              {formatAmount(Math.abs(myNet))}
            </Text>
            <Text style={[styles.summaryWord, { color: summaryColor }]}>{summaryWord}</Text>
          </View>

          {/* tabs */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setTab('expenses')}
              style={[styles.tab, tab === 'expenses' && styles.tabActive]}>
              <Text style={[styles.tabText, tab === 'expenses' && styles.tabTextActive]}>
                {t('groupDetail.expenses')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('balances')}
              style={[styles.tab, tab === 'balances' && styles.tabActive]}>
              <Text style={[styles.tabText, tab === 'balances' && styles.tabTextActive]}>
                {t('groupDetail.balances')}
              </Text>
            </Pressable>
          </View>

          {tab === 'expenses' && (
            <View style={styles.list}>
              {expenses.length === 0 && <Text style={styles.muted}>{t('groupDetail.allSettledHint')}</Text>}
              {expenses.map((ex) => {
                const myShare = ex.splits?.find((s) => s.user_id === myId)?.amount;
                const emoji = expenseEmoji(ex.description);
                return (
                  <View key={ex.id} style={styles.expenseCard}>
                    <View style={[styles.smallAvatar, { backgroundColor: tileBg(ex.description) }]}>
                      <Text style={emoji ? styles.expenseEmoji : styles.expenseInitial}>
                        {emoji ?? initial(ex.description)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.expenseDesc} numberOfLines={1}>
                        {ex.description}
                      </Text>
                      <Text style={styles.expenseMeta}>
                        {t('groupDetail.paidBy', { name: ex.paid_by.name })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.expenseAmount}>{formatAmount(ex.amount)}</Text>
                      {myShare != null && (
                        <Text style={styles.expenseShare}>
                          {t('groupDetail.yourShare', { amount: formatAmount(myShare) })}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {tab === 'balances' && (
            <View style={styles.list}>
              {debts.length === 0 ? (
                <View style={styles.settledCard}>
                  <View style={styles.settledCheck}>
                    <Text style={styles.settledCheckText}>✓</Text>
                  </View>
                  <Text style={styles.settledTitle}>{t('groupDetail.allSettled')}</Text>
                  <Text style={styles.settledHint}>{t('groupDetail.allSettledHint')}</Text>
                </View>
              ) : (
                debts.map((d, i) => {
                  // Show the other person's photo — the counterparty relative to me.
                  const otherId =
                    myId != null && d.from_user_id === myId ? d.to_user_id : d.from_user_id;
                  return (
                  <View key={i} style={styles.balanceCard}>
                    <Avatar
                      uri={memberAvatar(otherId)}
                      name={memberName(otherId)}
                      size={40}
                      color={avatarColor(otherId)}
                      fontSize={15}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.balanceText}>
                        {t('groupDetail.owes', {
                          from: memberName(d.from_user_id),
                          to: memberName(d.to_user_id),
                        })}
                      </Text>
                      <Text style={styles.balanceAmount}>{formatAmount(d.amount)}</Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/groups/[id]/settle',
                          params: {
                            id: id as string,
                            from: String(d.from_user_id),
                            to: String(d.to_user_id),
                            amount: String(d.amount),
                            fromName: memberName(d.from_user_id),
                            toName: memberName(d.to_user_id),
                            fromAvatar: memberAvatar(d.from_user_id),
                            toAvatar: memberAvatar(d.to_user_id),
                          },
                        })
                      }
                      style={styles.settleBtn}>
                      <Text style={styles.settleBtnText}>{t('groupDetail.settle')}</Text>
                    </Pressable>
                  </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* FAB */}
        <View style={styles.fabWrap}>
          <Pressable
            onPress={() => router.push(`/groups/${id}/add-expense`)}
            style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
            <Text style={styles.fabPlus}>+</Text>
            <Text style={styles.fabText}>{t('groupDetail.addExpense')}</Text>
          </Pressable>
        </View>

        {errorMsg && (
          <View style={styles.toast}>
            <Text style={styles.toastDot}>!</Text>
            <Text style={styles.toastText}>{errorMsg}</Text>
          </View>
        )}
      </SafeAreaView>
      <BottomNav active="index" />
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Palette.muted, fontSize: 14, fontFamily: Font.sans },
  topbar: {
    paddingHorizontal: 18,
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareGlyph: { fontSize: 15 },
  copiedTick: { color: Palette.green, fontSize: 18, fontFamily: Font.sansBold, lineHeight: 20 },
  settlePill: { backgroundColor: Palette.greenTint, borderRadius: 11, paddingVertical: 9, paddingHorizontal: 14 },
  settlePillText: { fontSize: 13.5, fontFamily: Font.sansSemibold, color: Palette.green },
  scroll: { paddingTop: 14, paddingBottom: 110 },
  groupHead: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 13 },
  tile: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tileEmoji: { fontSize: 24 },
  groupName: { fontSize: 22, fontFamily: Font.sansBold, letterSpacing: -0.5, color: Palette.ink },
  groupMeta: { marginTop: 3, fontSize: 12.5, color: Palette.muted },
  summary: { marginHorizontal: 24, marginTop: 18, borderRadius: Radius.lg, borderWidth: 1, padding: 16 },
  summaryLabel: { fontSize: 12.5, color: Palette.muted3, fontFamily: Font.sansMedium },
  summaryAmount: { marginTop: 5, fontSize: 24, fontFamily: Font.monoSemibold, letterSpacing: -0.5 },
  summaryWord: { marginTop: 4, fontSize: 12.5, opacity: 0.9 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingTop: 18 },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    backgroundColor: Palette.card,
  },
  tabActive: { backgroundColor: Palette.ink, borderColor: Palette.ink },
  tabText: { fontSize: 13.5, fontFamily: Font.sansSemibold, color: Palette.muted3 },
  tabTextActive: { color: Palette.bg },
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 9 },
  expenseCard: {
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  smallAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  expenseEmoji: { fontSize: 19 },
  expenseInitial: { color: Palette.ink, fontFamily: Font.sansSemibold, fontSize: 16 },
  expenseDesc: { fontSize: 14.5, fontFamily: Font.sansSemibold, color: Palette.ink },
  expenseMeta: { marginTop: 3, fontSize: 12, color: Palette.muted },
  expenseAmount: { fontSize: 14, fontFamily: Font.monoSemibold, color: Palette.ink },
  expenseShare: { marginTop: 3, fontSize: 11, color: Palette.muted },
  balanceCard: {
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  balanceText: { fontSize: 13.5, color: Palette.ink, fontFamily: Font.sans },
  balanceAmount: { marginTop: 3, fontSize: 13.5, fontFamily: Font.monoSemibold, color: Palette.ink },
  settleBtn: { backgroundColor: Palette.greenTint, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 13 },
  settleBtnText: { fontSize: 12.5, fontFamily: Font.sansSemibold, color: Palette.green },
  settledCard: {
    backgroundColor: Palette.greenTint,
    borderWidth: 1,
    borderColor: Palette.greenTintBorder,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  settledCheck: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  settledCheckText: { color: '#fff', fontSize: 22 },
  settledTitle: { fontSize: 15, fontFamily: Font.sansSemibold, color: Palette.greenDark },
  settledHint: { marginTop: 4, fontSize: 12.5, color: '#4f7c69' },
  fabWrap: { position: 'absolute', bottom: 26, left: 0, right: 0, alignItems: 'center' },
  fab: {
    height: 54,
    paddingHorizontal: 26,
    borderRadius: Radius.lg,
    backgroundColor: Palette.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  pressed: { opacity: 0.85 },
  fabPlus: { color: Palette.bg, fontSize: 20, lineHeight: 22 },
  fabText: { color: Palette.bg, fontSize: 15, fontFamily: Font.sansSemibold },
  toast: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Palette.red,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  toastDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    color: Palette.red,
    fontSize: 12,
    fontFamily: Font.sansBold,
    textAlign: 'center',
    lineHeight: 18,
  },
  toastText: { color: '#FFFFFF', fontSize: 13.5, fontFamily: Font.sansMedium },
});
