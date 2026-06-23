import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Font, Palette, avatarColor, initial } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { formatAmount, i18n, t } from '@/lib/i18n';

type ActivityEvent = {
  type: 'expense' | 'settlement';
  group_id: number;
  group_name: string;
  group_emoji: string;
  title: string;
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

  useFocusEffect(
    useCallback(() => {
      api
        .get<ActivityEvent[]>('/api/v1/activity')
        .then((data) => setEvents(data ?? []))
        .catch(() => {});
    }, [api]),
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('activity.title')}</Text>
            <Text style={styles.subtitle}>{t('activity.subtitle')}</Text>
          </View>

          {events.length === 0 && <Text style={styles.empty}>{t('activity.empty')}</Text>}

          <View style={styles.list}>
            {events.map((ev, i) => {
              const settlement = ev.type === 'settlement';
              return (
                <View key={i} style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor(ev.actor_id) }]}>
                    <Text style={styles.avatarText}>{initial(ev.actor_name)}</Text>
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
                    <Text
                      style={[
                        styles.amount,
                        { color: settlement ? Palette.green : Palette.ink },
                      ]}>
                      {formatAmount(ev.amount)}
                    </Text>
                    <Text style={styles.date}>{shortDate(ev.date)}</Text>
                  </View>
                </View>
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
  header: { paddingHorizontal: 24, paddingTop: 6 },
  title: { fontSize: 24, fontFamily: Font.sansBold, letterSpacing: -0.6, color: Palette.ink },
  subtitle: { marginTop: 3, fontSize: 13.5, color: Palette.muted },
  empty: { paddingHorizontal: 24, paddingTop: 24, color: Palette.muted, fontSize: 14 },
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
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: Font.sansSemibold, fontSize: 14 },
  info: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
  rowSub: { marginTop: 2, fontSize: 12, color: Palette.muted },
  amountCol: { alignItems: 'flex-end' },
  amount: { fontSize: 13.5, fontFamily: Font.monoSemibold },
  date: { marginTop: 2, fontSize: 11, color: Palette.faint },
});
