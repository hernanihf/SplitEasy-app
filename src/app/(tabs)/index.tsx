import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Font, Palette, Radius, avatarColor, initial, tileBg } from '@/constants/design';
import { PENDING_INVITE_KEY, useAuth } from '@/lib/auth';
import { formatAmount, t } from '@/lib/i18n';
import { getItem, removeItem } from '@/lib/storage';

type GroupSummary = {
  id: number;
  name: string;
  emoji: string;
  members_count: number;
  your_balance: number;
};

type HomeData = {
  overall: { net: number; owed: number; owe: number };
  groups: GroupSummary[];
};

export default function HomeScreen() {
  const { api } = useAuth();
  const [home, setHome] = useState<HomeData | null>(null);
  const [name, setName] = useState<string>(t('profile.anonymous'));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .get<HomeData>('/api/v1/home')
      .then(setHome)
      .catch(() => setError(t('home.loadError')));
    api
      .get<{ name: string }>('/api/v1/users/me')
      .then((u) => setName(u.name?.split(' ')[0] || t('profile.anonymous')))
      .catch(() => {});
  }, [api]);

  useFocusEffect(load);

  useFocusEffect(
    useCallback(() => {
      getItem(PENDING_INVITE_KEY).then((pending) => {
        if (pending) removeItem(PENDING_INVITE_KEY).then(() => router.replace(`/join/${pending}`));
      });
    }, []),
  );

  const groups = home?.groups ?? [];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{t('home.greeting', { name })}</Text>
              <Text style={styles.title}>{t('home.title')}</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: Palette.green }]}>
              <Text style={styles.avatarText}>{initial(name)}</Text>
            </View>
          </View>

          {/* balance hero */}
          <View style={styles.hero}>
            <View style={styles.heroCircle} />
            <Text style={styles.heroLabel}>{t('home.overall')}</Text>
            <Text style={styles.heroAmount}>{formatAmount(home?.overall.net ?? 0)}</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillLabel}>{t('home.youreOwed')}</Text>
                <Text style={styles.heroPillValue}>{formatAmount(home?.overall.owed ?? 0)}</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillLabel}>{t('home.youOwe')}</Text>
                <Text style={styles.heroPillValue}>{formatAmount(home?.overall.owe ?? 0)}</Text>
              </View>
            </View>
          </View>

          {/* groups header */}
          <View style={styles.groupsHeader}>
            <Text style={styles.groupsTitle}>{t('home.groups')}</Text>
            <Pressable onPress={() => router.push('/groups/new')}>
              <Text style={styles.newGroup}>{t('home.newGroup')}</Text>
            </Pressable>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          {!error && groups.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t('home.empty')}</Text>
              <Text style={styles.emptyHint}>{t('home.emptyHint')}</Text>
            </View>
          )}

          <View style={styles.groupList}>
            {groups.map((g) => {
              const owed = g.your_balance > 0.01;
              const owe = g.your_balance < -0.01;
              const color = owed ? Palette.green : owe ? Palette.red : Palette.muted;
              const word = owed
                ? t('home.wordOwed')
                : owe
                  ? t('home.wordOwe')
                  : t('home.wordSettled');
              return (
                <Pressable
                  key={g.id}
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
                      {formatAmount(Math.abs(g.your_balance))}
                    </Text>
                    <Text style={[styles.groupWord, { color }]}>{word}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
