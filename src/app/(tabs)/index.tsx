import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { GroupListSkeleton, HeroSkeleton } from '@/components/home-skeleton';
import { InstallPrompt } from '@/components/install-prompt';
import { ScreenMeta } from '@/components/screen-meta';
import { Font, Radius, tileBg, type ThemeColors } from '@/constants/design';
import { PENDING_INVITE_KEY, useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { formatAmount, t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';
import { getItem, removeItem } from '@/lib/storage';

type GroupSummary = {
  id: number;
  name: string;
  emoji: string;
  currency: string;
  members_count: number;
  your_balance: number;
  created_by: number;
};

// One entry per currency actually in play across the user's groups — groups
// in different currencies can't be summed into a single number without an
// exchange rate.
type OverallBalance = { currency: string; net: number; owed: number; owe: number };

type HomeData = {
  overall_by_currency: OverallBalance[];
  groups: GroupSummary[];
};

export default function HomeScreen() {
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [home, setHome] = useState<HomeData | null>(null);
  const [name, setName] = useState<string>(t('profile.anonymous'));
  const [avatar, setAvatar] = useState<string | null>(null);
  const [myId, setMyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showSlowHint, setShowSlowHint] = useState(false);

  const isFirstLoad = isLoading && !home;

  // Render/Supabase free tier can take several seconds to wake from a cold
  // start — the skeleton alone reads as frozen past ~1s, so a hint kicks in
  // to explain the wait instead of leaving it a mystery.
  useEffect(() => {
    if (!isFirstLoad) return;
    const timer = setTimeout(() => setShowSlowHint(true), 1200);
    return () => clearTimeout(timer);
  }, [isFirstLoad]);

  const load = useCallback(() => {
    setError(null);
    setIsLoading(true);
    api
      .get<HomeData>('/api/v1/home')
      .then(setHome)
      .catch(() => setError(t('home.loadError')))
      .finally(() => setIsLoading(false));
    api
      .get<{ id: number; name: string; avatar_url: string }>('/api/v1/users/me')
      .then((u) => {
        setMyId(u.id);
        setName(u.name?.split(' ')[0] || t('profile.anonymous'));
        setAvatar(u.avatar_url || null);
      })
      .catch(() => {});
  }, [api]);

  const handleDeleteGroup = async () => {
    if (deletingGroupId == null) return;
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/groups/${deletingGroupId}`);
      setDeletingGroupId(null);
      load();
    } catch (e) {
      setDeletingGroupId(null);
      setDeleteError(e instanceof ApiError && e.status === 403 ? t('home.deleteGroupNotAllowed') : t('home.deleteGroupError'));
    }
  };

  useFocusEffect(load);

  useFocusEffect(
    useCallback(() => {
      getItem(PENDING_INVITE_KEY).then((pending) => {
        if (pending) removeItem(PENDING_INVITE_KEY).then(() => router.replace(`/join/${pending}`));
      });
    }, []),
  );

  const groups = home?.groups ?? [];
  const overalls = home?.overall_by_currency ?? [];

  return (
    <View style={styles.root}>
      <ScreenMeta title={t('nav.groups')} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{t('home.greeting', { name })}</Text>
              <Text style={styles.title}>{t('home.title')}</Text>
            </View>
            <Pressable onPress={() => router.navigate('/profile')} hitSlop={8}>
              <Avatar uri={avatar} name={name} size={42} color={Palette.green} fontSize={16} />
            </Pressable>
          </View>

          {/* balance hero */}
          <View style={styles.hero}>
            <View style={styles.heroCircle} />
            <Text style={styles.heroLabel}>{t('home.overall')}</Text>
            {isFirstLoad ? (
              <HeroSkeleton />
            ) : overalls.length > 1 ? (
              // Groups span more than one currency — no single number would
              // mean anything, so list a net per currency instead.
              <View style={styles.heroMulti}>
                {overalls.map((o) => (
                  <View key={o.currency} style={styles.heroMultiRow}>
                    <Text style={styles.heroMultiCurrency}>{o.currency}</Text>
                    <Text style={styles.heroMultiAmount}>{formatAmount(o.net, o.currency)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <>
                <Text style={styles.heroAmount}>
                  {formatAmount(overalls[0]?.net ?? 0, overalls[0]?.currency)}
                </Text>
                <View style={styles.heroRow}>
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillLabel}>{t('home.youreOwed')}</Text>
                    <Text style={styles.heroPillValue}>
                      {formatAmount(overalls[0]?.owed ?? 0, overalls[0]?.currency)}
                    </Text>
                  </View>
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillLabel}>{t('home.youOwe')}</Text>
                    <Text style={styles.heroPillValue}>
                      {formatAmount(overalls[0]?.owe ?? 0, overalls[0]?.currency)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* groups header */}
          <View style={styles.groupsHeader}>
            <Text style={styles.groupsTitle}>{t('home.groups')}</Text>
            <Pressable onPress={() => router.push('/groups/new')}>
              <Text style={styles.newGroup}>{t('home.newGroup')}</Text>
            </Pressable>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          {isFirstLoad && (
            <>
              <GroupListSkeleton />
              {showSlowHint && <Text style={styles.slowHint}>{t('home.slowLoadHint')}</Text>}
            </>
          )}

          {!isLoading && !error && groups.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t('home.empty')}</Text>
              <Text style={styles.emptyHint}>{t('home.emptyHint')}</Text>
            </View>
          )}

          {deleteError && <Text style={styles.error}>{deleteError}</Text>}

          <View style={styles.groupList}>
            {groups.map((g) => {
              const owed = g.your_balance > 0;
              const owe = g.your_balance < 0;
              const color = owed ? Palette.green : owe ? Palette.red : Palette.muted;
              const word = owed
                ? t('home.wordOwed')
                : owe
                  ? t('home.wordOwe')
                  : t('home.wordSettled');
              const card = (
                <Pressable
                  onPress={() => router.push(`/groups/${g.id}`)}
                  style={({ pressed }) => [styles.groupCard, pressed && styles.pressed]}>
                  <View style={[styles.tile, { backgroundColor: tileBg(g.id) }]}>
                    <Text style={styles.tileEmoji}>{g.emoji || '💸'}</Text>
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text style={styles.groupMeta}>
                      {t('groupDetail.memberCount', { count: g.members_count })}
                    </Text>
                  </View>
                  <View style={styles.groupBalance}>
                    <Text style={[styles.groupAmount, { color }]}>
                      {formatAmount(Math.abs(g.your_balance), g.currency)}
                    </Text>
                    <Text style={[styles.groupWord, { color }]}>{word}</Text>
                  </View>
                </Pressable>
              );

              // Only the creator can delete a group — everyone else's row
              // isn't even wrapped in a Swipeable, so there's nothing to
              // swipe.
              if (myId == null || g.created_by !== myId) {
                return <View key={g.id}>{card}</View>;
              }

              return (
                <Swipeable
                  key={g.id}
                  overshootRight={false}
                  renderRightActions={(_progress, _translation, swipeableMethods) => (
                    <Pressable
                      onPress={() => {
                        swipeableMethods.close();
                        setDeletingGroupId(g.id);
                      }}
                      style={styles.deleteAction}>
                      <Text style={styles.deleteActionText}>{t('common.delete')}</Text>
                    </Pressable>
                  )}>
                  {card}
                </Swipeable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
      <InstallPrompt />
      <ConfirmDialog
        visible={deletingGroupId != null}
        title={t('home.deleteGroupTitle')}
        message={t('home.deleteGroupMessage')}
        onCancel={() => setDeletingGroupId(null)}
        onConfirm={handleDeleteGroup}
      />
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  safe: { flex: 1 },
  scroll: { paddingBottom: 24 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: 14, color: Palette.muted3, fontFamily: Font.sansMedium },
  title: { marginTop: 2, fontSize: 24, fontFamily: Font.sansBold, letterSpacing: -0.6, color: Palette.ink },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: Font.sansSemibold, fontSize: 16 },
  hero: {
    margin: 20,
    marginTop: 18,
    borderRadius: 24,
    padding: 22,
    backgroundColor: Palette.green,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -90,
    right: -50,
  },
  heroLabel: { color: '#fff', opacity: 0.82, fontSize: 13, fontFamily: Font.sansMedium },
  heroAmount: { color: '#fff', marginTop: 6, fontSize: 34, fontFamily: Font.monoSemibold, letterSpacing: -1 },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  heroPill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 12 },
  heroPillLabel: { color: '#fff', opacity: 0.8, fontSize: 11.5 },
  heroPillValue: { color: '#fff', marginTop: 3, fontSize: 15, fontFamily: Font.monoSemibold },
  heroMulti: { marginTop: 10, gap: 10 },
  heroMultiRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  heroMultiCurrency: { color: '#fff', opacity: 0.82, fontSize: 13, fontFamily: Font.sansMedium },
  heroMultiAmount: { color: '#fff', fontSize: 20, fontFamily: Font.monoSemibold, letterSpacing: -0.5 },
  groupsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 10,
  },
  groupsTitle: { fontSize: 15, fontFamily: Font.sansSemibold, color: Palette.ink },
  newGroup: { fontSize: 13.5, fontFamily: Font.sansSemibold, color: Palette.green },
  error: { paddingHorizontal: 24, color: Palette.red, fontSize: 13 },
  slowHint: {
    marginTop: 14,
    paddingHorizontal: 24,
    textAlign: 'center',
    fontSize: 12.5,
    color: Palette.muted,
  },
  empty: {
    marginHorizontal: 20,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: Radius.xl,
    padding: 24,
  },
  emptyTitle: { fontSize: 15, fontFamily: Font.sansSemibold, color: Palette.ink },
  emptyHint: { marginTop: 4, fontSize: 13, color: Palette.muted },
  groupList: { paddingHorizontal: 20, gap: 12 },
  groupCard: {
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pressed: { opacity: 0.7 },
  tile: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  tileEmoji: { fontSize: 21 },
  groupInfo: { flex: 1, minWidth: 0 },
  groupName: { fontSize: 15.5, fontFamily: Font.sansSemibold, color: Palette.ink },
  groupMeta: { marginTop: 3, fontSize: 12.5, color: Palette.muted },
  groupBalance: { alignItems: 'flex-end' },
  groupAmount: { fontSize: 14, fontFamily: Font.monoSemibold },
  groupWord: { marginTop: 3, fontSize: 11, opacity: 0.9 },
  deleteAction: {
    width: 84,
    height: '100%',
    borderRadius: 20,
    backgroundColor: Palette.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionText: { color: '#fff', fontSize: 13.5, fontFamily: Font.sansSemibold },
});
