import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FilterBadgeButton,
  FilterChipRow,
  FilterSection,
  FilterSegment,
  FilterSheet,
  type FilterChipOption,
} from '@/components/filter-sheet';
import { ScreenMeta } from '@/components/screen-meta';
import { CATEGORIES, categoryEmoji } from '@/constants/categories';
import { Font, tileBg, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { periodCutoff, type PeriodFilter } from '@/lib/date-filter';
import { formatAmount, i18n, t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';
import { useUnreadActivity } from '@/lib/unread-activity';
import type { Expense, Settlement } from '@/app/groups/[id]/index';

type ActivityEvent = {
  id: number;
  type: 'expense' | 'settlement' | 'comment';
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
  // Expenses only — a settlement can't be soft-deleted. Still included in
  // the feed (struck through, non-openable) instead of vanishing.
  deleted?: boolean;
  deleted_by_name?: string;
  // Comments only: which kind of thing (and its title) the comment is on —
  // id above is that parent's id, not the comment's own, so opening a
  // comment event lands on the same detail view its parent would.
  parent_type?: 'expense' | 'settlement';
  parent_title?: string;
  // True when this event happened after the user last viewed the feed and
  // they didn't cause it themselves — drives the unread dot below.
  is_unread: boolean;
};

type TypeFilter = 'all' | 'expense' | 'settlement' | 'comment';

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
  const { markSeen } = useUnreadActivity();

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      api
        .get<ActivityEvent[]>('/api/v1/activity')
        .then((data) => setEvents(data ?? []))
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
          // Marking seen after the fetch (not in parallel) matters: it
          // bumps activity_last_seen_at server-side, which is exactly what
          // is_unread on the events above is computed against. Firing it
          // first would make everything look already-read on this load.
          markSeen();
        });
    }, [api, markSeen]),
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
      // A deleted expense still opens — read-only — so the group can check
      // what it was for; only an in-flight open blocks a second tap.
      if (openingKey) return;
      setOpeningKey(key);
      try {
        // A comment event's id is its parent's id (see the ActivityEvent
        // type comment) — open the same detail view the parent itself
        // would, keyed off what kind of thing that parent is.
        const isSettlement = ev.type === 'settlement' || ev.parent_type === 'settlement';
        if (isSettlement) {
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
    const present = new Set(events.filter((e) => !e.deleted).map((e) => e.category).filter(Boolean));
    return CATEGORIES.filter((c) => present.has(c.slug));
  }, [events]);

  const userOptions = useMemo(() => {
    const map = new Map<number, string>();
    events.filter((e) => !e.deleted).forEach((e) => {
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
            <FilterBadgeButton
              label={t('activity.filters')}
              count={activeFilterCount}
              onPress={() => setFiltersOpen(true)}
            />
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
              const comment = ev.type === 'comment';
              const emoji = settlement ? '💸' : comment ? '💬' : categoryEmoji(ev.category, ev.title);
              // Payments and comments each share a fixed tile colour so they
              // match the group history / read consistently across rows.
              const tileKey = settlement ? 'payment' : comment ? 'comment' : ev.title;
              const key = `${ev.type}-${ev.id}-${i}`;
              return (
                <Pressable
                  key={key}
                  onPress={() => openEvent(ev, key)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                  <View style={[styles.tile, { backgroundColor: tileBg(tileKey) }, ev.deleted && styles.deletedTile]}>
                    <Text style={styles.tileEmoji}>{emoji}</Text>
                  </View>
                  <View style={styles.info}>
                    <View style={styles.titleRow}>
                      {ev.is_unread && <View style={styles.unreadDot} />}
                      <Text
                        style={[styles.rowTitle, ev.is_unread && styles.rowTitleUnread, ev.deleted && styles.deletedText]}
                        numberOfLines={1}>
                        {ev.title}
                      </Text>
                    </View>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {ev.deleted
                        ? ev.deleted_by_name
                          ? t('activity.deletedBy', { name: ev.deleted_by_name, group: ev.group_name })
                          : t('activity.deletedIn', { group: ev.group_name })
                        : comment
                          ? t('activity.commentedOn', { name: ev.actor_name, title: ev.parent_title ?? '', group: ev.group_name })
                          : settlement
                            ? t('activity.settledIn', { group: ev.group_name })
                            : t('activity.paidBy', { name: ev.actor_name, group: ev.group_name })}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    {openingKey === key ? (
                      <ActivityIndicator color={Palette.muted} size="small" />
                    ) : comment ? (
                      <Text style={styles.date}>{shortDate(ev.date)}</Text>
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.amount,
                            { color: settlement ? Palette.green : Palette.ink },
                            ev.deleted && styles.deletedText,
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

      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('activity.filters')}
        showClear={activeFilterCount > 0}
        clearLabel={t('activity.clearFilters')}
        onClear={clearFilters}
        doneLabel={t('common.done')}>
        <FilterSection label={t('activity.filterType')}>
          <FilterSegment
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'all', label: t('activity.typeAll') },
              { value: 'expense', label: t('activity.typeExpenses') },
              { value: 'settlement', label: t('activity.typePayments') },
              { value: 'comment', label: t('activity.typeComments') },
            ]}
          />
        </FilterSection>

        <FilterSection label={t('activity.filterPeriod')}>
          <FilterChipRow
            options={(['all', '7d', '30d', '90d'] as PeriodFilter[]).map((v) => ({
              key: v,
              label:
                v === 'all'
                  ? t('activity.periodAll')
                  : v === '7d'
                    ? t('activity.period7d')
                    : v === '30d'
                      ? t('activity.period30d')
                      : t('activity.period90d'),
              active: filterPeriod === v,
              onPress: () => setFilterPeriod(v),
            }))}
          />
        </FilterSection>

        {groupOptions.length > 1 && (
          <FilterSection label={t('activity.filterGroup')}>
            <FilterChipRow
              options={[
                { key: 'all', label: t('activity.allGroups'), active: filterGroupId == null, onPress: () => setFilterGroupId(null) },
                ...groupOptions.map(
                  (g): FilterChipOption => ({
                    key: String(g.id),
                    label: g.name,
                    emoji: g.emoji,
                    active: filterGroupId === g.id,
                    onPress: () => setFilterGroupId(g.id),
                  }),
                ),
              ]}
            />
          </FilterSection>
        )}

        {categoryOptions.length > 0 && (
          <FilterSection label={t('activity.filterCategory')}>
            <FilterChipRow
              options={[
                {
                  key: 'all',
                  label: t('activity.allCategories'),
                  active: filterCategory == null,
                  onPress: () => setFilterCategory(null),
                },
                ...categoryOptions.map(
                  (c): FilterChipOption => ({
                    key: c.slug,
                    label: t(`categories.${c.slug}`),
                    emoji: c.emoji,
                    active: filterCategory === c.slug,
                    onPress: () => setFilterCategory(c.slug),
                  }),
                ),
              ]}
            />
          </FilterSection>
        )}

        {userOptions.length > 1 && (
          <FilterSection label={t('activity.filterPerson')}>
            <FilterChipRow
              options={[
                { key: 'all', label: t('activity.allPeople'), active: filterUserId == null, onPress: () => setFilterUserId(null) },
                ...userOptions.map(
                  (u): FilterChipOption => ({
                    key: String(u.id),
                    label: u.name,
                    active: filterUserId === u.id,
                    onPress: () => setFilterUserId(u.id),
                  }),
                ),
              ]}
            />
          </FilterSection>
        )}
      </FilterSheet>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Palette.red },
  rowTitle: { fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
  rowTitleUnread: { fontFamily: Font.sansSemibold },
  rowSub: { marginTop: 2, fontSize: 12, color: Palette.muted },
  amountCol: { alignItems: 'flex-end', minWidth: 30 },
  amount: { fontSize: 13.5, fontFamily: Font.monoSemibold },
  date: { marginTop: 2, fontSize: 11, color: Palette.faint },
  deletedTile: { opacity: 0.5 },
  deletedText: { color: Palette.muted, textDecorationLine: 'line-through' },
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
