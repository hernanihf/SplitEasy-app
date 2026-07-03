import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BackButton } from '@/components/back-button';
import { CommentsSection, type Comment } from '@/components/comments-section';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ScreenMeta } from '@/components/screen-meta';
import { categoryEmoji } from '@/constants/categories';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { Font, Radius, avatarColor, tileBg, type ThemeColors } from '@/constants/design';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatAmount, i18n, t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';
import { distributeCents } from '@/lib/split-math';
import type { Expense, Group } from '@/app/groups/[id]/index';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const locale = i18n.locale === 'es' ? 'es-AR' : 'en-US';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export default function ExpenseDetailScreen() {
  const { id, expense: expenseParam, myId: myIdParam } = useLocalSearchParams<{
    id: string;
    expense?: string;
    myId?: string;
  }>();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const { api } = useAuth();

  const expense = useMemo<Expense | null>(() => {
    try {
      return JSON.parse(expenseParam ?? 'null');
    } catch {
      return null;
    }
  }, [expenseParam]);

  const myId = myIdParam ? Number(myIdParam) : null;

  const [members, setMembers] = useState<Group['members']>([]);
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState(false);
  // The list this screen was opened from never carries a receipt URL (the
  // backend only signs one on the single-expense fetch, and a stored URL
  // would go stale anyway) — fetched separately here.
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Group>(`/api/v1/groups/${id}`)
      .then((g) => {
        setMembers(g.members);
        setCurrency(g.currency);
      })
      .catch(() => {});
  }, [id, api]);

  useEffect(() => {
    if (!expense) return;
    setCommentsLoading(true);
    setCommentsError(false);
    api
      .get<Comment[]>(`/api/v1/expenses/${expense.id}/comments`)
      .then((data) => setComments(data ?? []))
      .catch(() => setCommentsError(true))
      .finally(() => setCommentsLoading(false));
  }, [expense, api]);

  useEffect(() => {
    if (!expense) return;
    api
      .get<Expense>(`/api/v1/expenses/${expense.id}`)
      .then((fresh) => setReceiptImageUrl(fresh.receipt_image_url ?? null))
      .catch(() => {});
  }, [expense, api]);

  const handleAddComment = async (body: string) => {
    if (!expense) return;
    const comment = await api.post<Comment>(`/api/v1/expenses/${expense.id}/comments`, { body });
    setComments((prev) => [...prev, comment]);
  };

  const handleDeleteComment = async (commentId: number) => {
    await api.delete(`/api/v1/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const memberName = (uid: number) =>
    members.find((m) => m.id === uid)?.name ?? t('groupDetail.userN', { id: uid });
  const memberAvatar = (uid: number) => members.find((m) => m.id === uid)?.avatar_url ?? '';

  if (!expense) {
    return <View style={styles.root} />;
  }

  // Mirrors the backend's own rule: only the payer or a split participant
  // may edit or delete. Hiding the buttons otherwise avoids a dead-end 403.
  const canModify =
    myId != null && (expense.paid_by.id === myId || (expense.splits ?? []).some((s) => s.user_id === myId));

  const handleEdit = () => {
    const hasItems = (expense.items ?? []).length > 0;
    router.push({
      pathname: hasItems ? '/groups/[id]/itemize' : '/groups/[id]/add-expense',
      params: { id: id as string, expense: JSON.stringify(expense) },
    });
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/v1/expenses/${expense.id}`);
      router.back();
    } catch (e) {
      setConfirmingDelete(false);
      setError(e instanceof ApiError && e.status === 403 ? t('expenseDetail.notAllowed') : t('expenseDetail.deleteError'));
      setDeleting(false);
    }
  };

  const emoji = categoryEmoji(expense.category, expense.description);
  const splits = (expense.splits ?? []).filter((s) => s.amount !== 0);

  return (
    <View style={styles.root}>
      <ScreenMeta title={t('expenseDetail.title')} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topbar}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.topTitle}>{t('expenseDetail.title')}</Text>
          {canModify ? (
            <View style={styles.topActions}>
              <Pressable
                onPress={handleEdit}
                hitSlop={8}
                accessibilityLabel={t('common.edit')}
                style={styles.topAction}>
                <Text style={styles.topActionIcon}>✏️</Text>
              </Pressable>
              <Pressable
                onPress={() => setConfirmingDelete(true)}
                hitSlop={8}
                accessibilityLabel={t('common.delete')}
                style={styles.topAction}>
                <Text style={styles.topActionIcon}>🗑️</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.heroTile, { backgroundColor: tileBg(expense.description) }]}>
              <Text style={styles.heroEmoji}>{emoji}</Text>
            </View>
            <Text style={styles.heroDesc}>{expense.description}</Text>
            <Text style={styles.heroAmount}>{formatAmount(expense.amount, currency)}</Text>
            <Text style={styles.heroMeta}>
              {t('groupDetail.paidBy', { name: expense.paid_by.name })} · {formatDate(expense.created_at)}
            </Text>
          </View>

          {receiptImageUrl && (
            <Pressable
              onPress={() => Linking.openURL(receiptImageUrl)}
              style={styles.receiptRow}>
              <Text style={styles.receiptRowIcon}>🧾</Text>
              <Text style={styles.receiptRowText}>{t('expenseDetail.viewReceipt')}</Text>
            </Pressable>
          )}

          <Text style={styles.sectionLabel}>{t('expenseDetail.split')}</Text>
          <View style={styles.card}>
            {splits.map((s) => (
              <View key={s.user_id} style={styles.row}>
                <Avatar
                  uri={memberAvatar(s.user_id)}
                  name={memberName(s.user_id)}
                  size={30}
                  color={avatarColor(s.user_id)}
                  fontSize={13}
                />
                <Text style={styles.rowName}>{memberName(s.user_id)}</Text>
                <Text style={styles.rowAmount}>{formatAmount(s.amount, currency)}</Text>
              </View>
            ))}
          </View>

          {expense.items && expense.items.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('expenseDetail.items')}</Text>
              <View style={styles.card}>
                {expense.items.map((item) => {
                  const shares = distributeCents(
                    item.amount,
                    item.users.map(() => 1),
                  );
                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemDesc} numberOfLines={1}>
                          {item.description}
                        </Text>
                        <Text style={styles.itemAmount}>{formatAmount(item.amount, currency)}</Text>
                      </View>
                      <View style={styles.itemUsers}>
                        {item.users.map((u, i) => (
                          <View key={u.id} style={styles.itemUserChip}>
                            <Avatar uri={u.avatar_url} name={u.name} size={20} color={avatarColor(u.id)} fontSize={9} />
                            <Text style={styles.itemUserName}>{u.name}</Text>
                            <Text style={styles.itemUserShare}>{formatAmount(shares[i], currency)}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <CommentsSection
            comments={comments}
            loading={commentsLoading}
            loadError={commentsError}
            myId={myId}
            onAdd={handleAddComment}
            onDelete={handleDeleteComment}
          />
        </ScrollView>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmingDelete}
        title={t('expenseDetail.deleteTitle')}
        message={t('expenseDetail.deleteMessage')}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
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
    topActions: { flexDirection: 'row', gap: 6 },
    topAction: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    topActionIcon: { fontSize: 16 },
    error: { color: Palette.red, fontSize: 13, marginTop: 4, marginBottom: 4, marginHorizontal: 20 },
    scroll: { paddingHorizontal: 20, paddingBottom: 28 },
    hero: { alignItems: 'center', paddingVertical: 18 },
    heroTile: {
      width: 64,
      height: 64,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    heroEmoji: { fontSize: 30 },
    heroDesc: { fontSize: 18, fontFamily: Font.sansSemibold, color: Palette.ink, marginBottom: 2 },
    heroAmount: { fontSize: 30, fontFamily: Font.monoSemibold, color: Palette.ink, marginVertical: 2 },
    heroMeta: { fontSize: 13, color: Palette.muted2, fontFamily: Font.sans, marginTop: 2 },
    receiptRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      alignSelf: 'center',
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: Radius.pill,
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      marginBottom: 6,
    },
    receiptRowIcon: { fontSize: 15 },
    receiptRowText: { fontSize: 13.5, fontFamily: Font.sansSemibold, color: Palette.ink },
    sectionLabel: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.ink, marginTop: 16, marginBottom: 8 },
    card: {
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Palette.divider,
    },
    rowName: { flex: 1, fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
    rowAmount: { fontSize: 14, fontFamily: Font.monoSemibold, color: Palette.ink },
    itemRow: { paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Palette.divider },
    itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    itemDesc: { flex: 1, fontSize: 14.5, fontFamily: Font.sansMedium, color: Palette.ink },
    itemAmount: { fontSize: 14, fontFamily: Font.monoSemibold, color: Palette.ink, marginLeft: 8 },
    itemUsers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
    itemUserChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: Radius.pill,
      backgroundColor: Palette.inputBg,
    },
    itemUserName: { fontSize: 12.5, fontFamily: Font.sansMedium, color: Palette.ink },
    itemUserShare: { fontSize: 12, fontFamily: Font.monoMedium, color: Palette.muted2 },
  });
