import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { CommentsSection, type Comment } from '@/components/comments-section';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { ScreenMeta } from '@/components/screen-meta';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { Font, type ThemeColors } from '@/constants/design';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatAmount, i18n, t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';
import type { Group, Settlement } from '@/app/groups/[id]/index';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const locale = i18n.locale === 'es' ? 'es-AR' : 'en-US';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export default function SettlementDetailScreen() {
  const { id, settlement: settlementParam, myId: myIdParam } = useLocalSearchParams<{
    id: string;
    settlement?: string;
    myId?: string;
  }>();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const { api } = useAuth();

  const settlement = useMemo<Settlement | null>(() => {
    try {
      return JSON.parse(settlementParam ?? 'null');
    } catch {
      return null;
    }
  }, [settlementParam]);

  const myId = myIdParam ? Number(myIdParam) : null;

  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<Group>(`/api/v1/groups/${id}`)
      .then((g) => setCurrency(g.currency))
      .catch(() => {});
  }, [id, api]);

  useEffect(() => {
    if (!settlement) return;
    setCommentsLoading(true);
    setCommentsError(false);
    api
      .get<Comment[]>(`/api/v1/settlements/${settlement.id}/comments`)
      .then((data) => setComments(data ?? []))
      .catch(() => setCommentsError(true))
      .finally(() => setCommentsLoading(false));
  }, [settlement, api]);

  const handleAddComment = async (body: string) => {
    if (!settlement) return;
    const comment = await api.post<Comment>(`/api/v1/settlements/${settlement.id}/comments`, { body });
    setComments((prev) => [...prev, comment]);
  };

  const handleDeleteComment = async (commentId: number) => {
    await api.delete(`/api/v1/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  if (!settlement) {
    return <View style={styles.root} />;
  }

  // Mirrors the backend's own rule: only a party to the settlement may delete it.
  const canDelete = myId != null && (settlement.from_user_id === myId || settlement.to_user_id === myId);
  const fromName = settlement.from_user?.name ?? t('groupDetail.userN', { id: settlement.from_user_id });
  const toName = settlement.to_user?.name ?? t('groupDetail.userN', { id: settlement.to_user_id });

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/v1/settlements/${settlement.id}`);
      router.back();
    } catch (e) {
      setConfirmingDelete(false);
      setError(
        e instanceof ApiError && e.status === 403
          ? t('settlementDetail.notAllowed')
          : t('groupDetail.deleteSettlementError'),
      );
      setDeleting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenMeta title={t('settlementDetail.title')} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topbar}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.topTitle}>{t('settlementDetail.title')}</Text>
          {canDelete ? (
            <Pressable
              onPress={() => setConfirmingDelete(true)}
              hitSlop={8}
              accessibilityLabel={t('common.delete')}
              style={styles.topAction}>
              <Text style={styles.topActionIcon}>🗑️</Text>
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.heroTile, { backgroundColor: `${Palette.green}26` }]}>
              <Icon name="cash" size={28} color={Palette.green} />
            </View>
            <Text style={styles.heroDesc}>{t('groupDetail.paidFromTo', { from: fromName, to: toName })}</Text>
            <Text style={styles.heroAmount}>{formatAmount(settlement.amount, currency)}</Text>
            <Text style={styles.heroMeta}>{formatDate(settlement.created_at)}</Text>
          </View>

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
        title={t('groupDetail.deleteSettlementTitle')}
        message={t('groupDetail.deleteSettlementMessage')}
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
    heroDesc: { fontSize: 18, fontFamily: Font.sansSemibold, color: Palette.ink, marginBottom: 2, textAlign: 'center' },
    heroAmount: { fontSize: 30, fontFamily: Font.monoSemibold, color: Palette.green, marginVertical: 2 },
    heroMeta: { fontSize: 13, color: Palette.muted2, fontFamily: Font.sans, marginTop: 2 },
  });
