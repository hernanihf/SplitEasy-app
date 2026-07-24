import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Font, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';
import { useUnreadActivity } from '@/lib/unread-activity';

const ORDER = ['index', 'activity', 'profile'] as const;
type TabName = (typeof ORDER)[number];

const TABS: Record<TabName, { icon: IconName; labelKey: string; href: string }> = {
  index: { icon: 'home', labelKey: 'nav.groups', href: '/' },
  activity: { icon: 'pulse', labelKey: 'nav.activity', href: '/activity' },
  profile: { icon: 'person', labelKey: 'nav.profile', href: '/profile' },
};

type TabBarProps = {
  // Provided by expo-router's Tabs when used as the navigator's tabBar.
  state?: { index: number; routes: { key: string; name: string }[] };
  navigation?: any;
  // Standalone usage (e.g. group detail): which tab to highlight.
  active?: TabName;
};

export function BottomNav({ state, navigation, active }: TabBarProps) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const { count: unreadCount } = useUnreadActivity();

  const activeName: TabName = state ? (state.routes[state.index]?.name as TabName) : (active ?? 'index');

  return (
    <View style={styles.bar}>
      {ORDER.map((name) => {
        const tab = TABS[name];
        const focused = activeName === name;
        const color = focused ? Palette.green : Palette.muted;

        const onPress = () => {
          if (focused) return;
          if (state && navigation) {
            const route = state.routes.find((r) => r.name === name);
            const event = navigation.emit({ type: 'tabPress', target: route?.key, canPreventDefault: true });
            if (!event.defaultPrevented) navigation.navigate(name);
          } else {
            router.navigate(tab.href as never);
          }
        };

        return (
          <Pressable key={name} onPress={onPress} style={styles.tab}>
            <View style={styles.glyphWrap}>
              <Icon name={tab.icon} size={21} color={color} />
              {name === 'activity' && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color }]}>{t(tab.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
  bar: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 11,
    paddingHorizontal: 20,
    backgroundColor: Palette.card,
    borderTopWidth: 1,
    borderTopColor: Palette.cardBorder,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  glyphWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: Palette.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9.5,
    lineHeight: 11,
    fontFamily: Font.sansBold,
    color: '#fff',
  },
  label: {
    fontSize: 10.5,
    fontFamily: Font.sansSemibold,
  },
});
