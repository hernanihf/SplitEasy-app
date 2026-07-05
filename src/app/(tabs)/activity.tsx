import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenMeta } from '@/components/screen-meta';
import { CATEGORIES, categoryEmoji } from '@/constants/categories';
import { Font, Radius, tileBg, type ThemeColors } from '@/constants/design';
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

type TypeFilter = 'all' | 'expense' | 'settlement';
type PeriodFilter = 'all' | '7d' | '30d' | '90d';

const PERIOD_DAYS: Record<Exclude<PeriodFilter, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

function periodCutoff(period: PeriodFilter): Date | null {
  if (period === 'all') return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period]);
  return cutoff;
}

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterType, setFilterType] = useState<TypeFilter>('all');
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('all');
  const [filterGroupId, setFilterGroupId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<number | null>(null);
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

  // Filter option lists are derived from whatever's actually in the feed —
  // no point offering a group/category/person nobody has activity for.
  const groupOptions = useMemo(() => {
    const map = new Map<number, { id: number; name: string; emoji: string }>();
    events.forEach((e) => {
      if (!map.has(e.group_id)) map.set(e.group_id, { id: e.group_id, name: e.group_name, emoji: e.group_emoji });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [events]);

  const categoryOptions = useMemo(() => {
    const present = new Set(events.map((e) => e.category).filter(Boolean));
    return CATEGORIES.filter((c) => present.has(c.slug));
  }, [events]);

  const userOptions = useMemo(() => {
    const map = new Map<number, string>();
    events.forEach((e) => {
      if (!map.has(e.actor_id)) map.set(e.actor_id, e.actor_name);
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const cutoff = periodCutoff(filterPeriod);
    return events.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterGroupId != null && e.group_id !== filterGroupId) return false;
      if (filterCategory != null && e.category !== filterCategory) return false;
      if (filterUserId != null && e.actor_id !== filterUserId) return false;
      if (cutoff && new Date(e.date) < cutoff) return false;
      return true;
    });
  }, [events, filterType, filterPeriod, filterGroupId, filterCategory, filterUserId]);

  const activeFilterCount = [
    filterType !== 'all',
    filterPeriod !== 'all',
    filterGroupId != null,
    filterCategory != null,
    filterUserId != null,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterType('all');
    setFilterPeriod('all');
    setFilterGroupId(null);
    setFilterCategory(null);
    setFilterUserId(null);
  };

  return (
    <View style={styles.root}>
      <ScreenMeta title={t('nav.activity')} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('activity.title')}</Text>
              <Text style={styles.subtitle}>{t('activity.subtitle')}</Text>
            </View>
            <Pressable
              onPress={() => setFiltersOpen(true)}
              style={[styles.filtersBtn, activeFilterCount > 0 && styles.filtersBtnActive]}>
              <Text style={[styles.filtersBtnText, activeFilterCount > 0 && styles.filtersBtnTextActive]}>
                {t('activity.filters')}
              </Text>
              {activeFilterCount > 0 && (
                <View style={styles.filtersBadge}>
                  <Text style={styles.filtersBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {isLoading && events.length === 0 && (
            <View style={styles.loading}>
              <ActivityIndicator color={Palette.green} />
            </View>
          )}

          {!isLoading && events.length === 0 && (
            <Text style={styles.empty}>{t('activity.empty')}</Text>
          )}

          {!isLoading && events.length > 0 && filteredEvents.length === 0 && (
            <Text style={styles.empty}>{t('activity.noMatches')}</Text>
          )}

          <View style={styles.list}>
            {filteredEvents.map((ev, i) => {
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

      <Modal
        visible={filtersOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersOpen(false)}>
        <Pressable style={styles.dim} onPress={() => setFiltersOpen(false)} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('activity.filters')}</Text>
              {activeFilterCount > 0 && (
                <Pressable onPress={clearFilters}>
                  <Text style={styles.clearText}>{t('activity.clearFilters')}</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.sectionLabel}>{t('activity.filterType')}</Text>
            <View style={styles.segment}>
              {(['all', 'expense', 'settlement'] as TypeFilter[]).map((v) => {
                const active = filterType === v;
                const label =
                  v === 'all' ? t('activity.typeAll') : v === 'expense' ? t('activity.typeExpenses') : t('activity.typePayments');
                return (
                  <Pressable
                    key={v}
                    onPress={() => setFilterType(v)}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{t('activity.filterPeriod')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {(['all', '7d', '30d', '90d'] as PeriodFilter[]).map((v) => {
                const active = filterPeriod === v;
                const label =
                  v === 'all'
                    ? t('activity.periodAll')
                    : v === '7d'
                      ? t('activity.period7d')
                      : v === '30d'
                        ? t('activity.period30d')
                        : t('activity.period90d');
                return (
                  <Pressable
                    key={v}
                    onPress={() => setFilterPeriod(v)}
                    style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {groupOptions.length > 1 && (
              <>
                <Text style={styles.sectionLabel}>{t('activity.filterGroup')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <Pressable
                    onPress={() => setFilterGroupId(null)}
                    style={[styles.chip, filterGroupId == null && styles.chipActive]}>
                    <Text style={[styles.chipText, filterGroupId == null && styles.chipTextActive]}>
                      {t('activity.allGroups')}
                    </Text>
                  </Pressable>
                  {groupOptions.map((g) => {
                    const active = filterGroupId === g.id;
                    return (
                      <Pressable
                        key={g.id}
                        onPress={() => setFilterGroupId(g.id)}
                        style={[styles.chip, active && styles.chipActive]}>
                        <Text style={styles.chipEmoji}>{g.emoji}</Text>
                        <Text
                          style={[styles.chipText, active && styles.chipTextActive]}
                          numberOfLines={1}>
                          {g.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {categoryOptions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>{t('activity.filterCategory')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <Pressable
                    onPress={() => setFilterCategory(null)}
                    style={[styles.chip, filterCategory == null && styles.chipActive]}>
                    <Text style={[styles.chipText, filterCategory == null && styles.chipTextActive]}>
                      {t('activity.allCategories')}
                    </Text>
                  </Pressable>
                  {categoryOptions.map((c) => {
                    const active = filterCategory === c.slug;
                    return (
                      <Pressable
                        key={c.slug}
                        onPress={() => setFilterCategory(c.slug)}
                        style={[styles.chip, active && styles.chipActive]}>
                        <Text style={styles.chipEmoji}>{c.emoji}</Text>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {t(`categories.${c.slug}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {userOptions.length > 1 && (
              <>
                <Text style={styles.sectionLabel}>{t('activity.filterPerson')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <Pressable
                    onPress={() => setFilterUserId(null)}
                    style={[styles.chip, filterUserId == null && styles.chipActive]}>
                    <Text style={[styles.chipText, filterUserId == null && styles.chipTextActive]}>
                      {t('activity.allPeople')}
                    </Text>
                  </Pressable>
                  {userOptions.map((u) => {
                    const active = filterUserId === u.id;
                    return (
                      <Pressable
                        key={u.id}
                        onPress={() => setFilterUserId(u.id)}
                        style={[styles.chip, active && styles.chipActive]}>
                        <Text
                          style={[styles.chipText, active && styles.chipTextActive]}
                          numberOfLines={1}>
                          {u.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </ScrollView>

          <Pressable onPress={() => setFiltersOpen(false)} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>{t('common.done')}</Text>
          </Pressable>
        </View>
      </Modal>
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
    alignItems: 'flex-start',
    gap: 12,
  },
  title: { fontSize: 24, fontFamily: Font.sansBold, letterSpacing: -0.6, color: Palette.ink },
  subtitle: { marginTop: 3, fontSize: 13.5, color: Palette.muted },
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    backgroundColor: Palette.card,
  },
  filtersBtnActive: { backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
  filtersBtnText: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.ink },
  filtersBtnTextActive: { color: Palette.greenDark },
  filtersBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersBadgeText: { color: '#fff', fontSize: 11, fontFamily: Font.sansBold },
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
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,16,12,0.42)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    backgroundColor: Palette.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingTop: 18,
  },
  sheetScroll: { paddingHorizontal: 22, paddingBottom: 8 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontFamily: Font.sansBold, color: Palette.ink },
  clearText: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.red },
  sectionLabel: {
    fontSize: 12.5,
    fontFamily: Font.sansSemibold,
    color: Palette.muted,
    marginBottom: 8,
    marginTop: 14,
  },
  segment: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    backgroundColor: Palette.card,
  },
  segmentBtnActive: { backgroundColor: Palette.ink, borderColor: Palette.ink },
  segmentText: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.muted3 },
  segmentTextActive: { color: Palette.bg },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Palette.cardBorder,
    maxWidth: 180,
  },
  chipActive: { backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontFamily: Font.sansMedium, color: Palette.ink },
  chipTextActive: { color: Palette.greenDark },
  doneBtn: {
    margin: 20,
    height: 50,
    borderRadius: 15,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontFamily: Font.sansSemibold },
});
