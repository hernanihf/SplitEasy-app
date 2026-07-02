import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { categoryEmoji } from '@/constants/categories';
import { Font, tileBg, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { formatAmount, i18n, t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';
import type { Expense, Settlement } from '@/app/groups/[id]/index';

type ActivityEvent = {
  id: number;
  type: 'expense' | 'settlement';
  group_id: number;
  group_name: string;
  group_emoji: string;
  currency: string;
  title: string;
  category?: string;
  actor_id: number;
  actor_name: string;
  amount: number;
  your_share: number;
  date: string;
};

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const locale = i18n.locale === 'es' ? 'es-AR' : 'en-US';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d);
}

export default function ActivityScreen() {
  const { api } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myId, setMyId] = useState<number | null>(null);
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      api
        .get<ActivityEvent[]>('/api/v1/activity')
        .then((data) => setEvents(data ?? []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }, [api]),
  );

  useEffect(() => {
    api
      .get<{ id: number }>('/api/v1/users/me')
      .then((me) => setMyId(me.id))
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 2600);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  const openEvent = useCallback(
    async (ev: ActivityEvent, key: string) => {
      if (openingKey) return;
      setOpeningKey(key);
      try {
        if (ev.type === 'settlement') {
          const settlement = await api.get<Settlement>(`/api/v1/settlements/${ev.id}`);
          router.push({
            pathname: '/groups/[id]/settlement-detail',
            params: {
              id: String(ev.group_id),
              settlement: JSON.stringify(settlement),
              myId: String(myId ?? ''),
            },
          });
        } else {
          const expense = await api.get<Expense>(`/api/v1/expenses/${ev.id}`);
          router.push({
            pathname: '/groups/[id]/expense-detail',
            params: {
              id: String(ev.group_id),
              expense: JSON.stringify(expense),
              myId: String(myId ?? ''),
            },
          });
        }
      } catch {
        setErrorMsg(t('activity.openError'));
      } finally {
        setOpeningKey(null);
      }
    },
    [api, myId, openingKey],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('activity.title')}</Text>
            <Text style={styles.subtitle}>{t('activity.subtitle')}</Text>
          </View>

          {isLoading && events.length === 0 && (
            <View style={styles.loading}>
              <ActivityIndicator color={Palette.green} />
            </View>
          )}

          {!isLoading && events.length === 0 && (
            <Text style={styles.empty}>{t('activity.empty')}</Text>
          )}

          <View style={styles.list}>
            {events.map((ev, i) => {
              const settlement = ev.type === 'settlement';
              const emoji = settlement ? '💸' : categoryEmoji(ev.category, ev.title);
              // Payments share a fixed tile colour so they match the group history.
              const tileKey = settlement ? 'payment' : ev.title;
              const key = `${ev.type}-${ev.id}-${i}`;
              return (
                <Pressable
                  key={key}
                  onPress={() => openEvent(ev, key)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                  <View style={[styles.tile, { backgroundColor: tileBg(tileKey) }]}>
                    <Text style={styles.tileEmoji}>{emoji}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {ev.title}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {settlement
                        ? t('activity.settledIn', { group: ev.group_name })
                        : t('activity.paidBy', { name: ev.actor_name, group: ev.group_name })}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    {openingKey === key ? (
                      <ActivityIndicator color={Palette.muted} size="small" />
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.amount,
                            { color: settlement ? Palette.green : Palette.ink },
                          ]}>
                          {formatAmount(ev.amount, ev.currency)}
                        </Text>
                        <Text style={styles.date}>{shortDate(ev.date)}</Text>
                      </>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {errorMsg && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{errorMsg}</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  safe: { flex: 1 },
  scroll: { paddingBottom: 24 },
  header: { paddingHorizontal: 24, paddingTop: 6 },
  title: { fontSize: 24, fontFamily: Font.sansBold, letterSpacing: -0.6, color: Palette.ink },
  subtitle: { marginTop: 3, fontSize: 13.5, color: Palette.muted },
  empty: { paddingHorizontal: 24, paddingTop: 24, color: Palette.muted, fontSize: 14 },
  loading: { paddingTop: 32, alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingTop: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  rowPressed: { opacity: 0.6 },
  tile: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tileEmoji: { fontSize: 18 },
  info: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
  rowSub: { marginTop: 2, fontSize: 12, color: Palette.muted },
  amountCol: { alignItems: 'flex-end', minWidth: 30 },
  amount: { fontSize: 13.5, fontFamily: Font.monoSemibold },
  date: { marginTop: 2, fontSize: 11, color: Palette.faint },
  toast: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    maxWidth: '90%',
    backgroundColor: Palette.red,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  toastText: { color: '#FFFFFF', fontSize: 13.5, fontFamily: Font.sansMedium },
});
