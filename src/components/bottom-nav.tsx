import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

const ORDER = ['index', 'activity', 'profile'] as const;
type TabName = (typeof ORDER)[number];

const TABS: Record<TabName, { glyph: string; labelKey: string; href: string }> = {
  index: { glyph: '◎', labelKey: 'nav.groups', href: '/' },
  activity: { glyph: '≋', labelKey: 'nav.activity', href: '/activity' },
  profile: { glyph: '◉', labelKey: 'nav.profile', href: '/profile' },
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
            <Text style={[styles.glyph, { color }]}>{tab.glyph}</Text>
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
  glyph: {
    fontSize: 19,
  },
  label: {
    fontSize: 10.5,
    fontFamily: Font.sansSemibold,
  },
});
