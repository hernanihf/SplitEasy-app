import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

const TABS: Record<string, { glyph: string; labelKey: string }> = {
  index: { glyph: '◎', labelKey: 'nav.groups' },
  activity: { glyph: '≋', labelKey: 'nav.activity' },
  profile: { glyph: '◉', labelKey: 'nav.profile' },
};

type Route = { key: string; name: string };
type NavProps = {
  state: { index: number; routes: Route[] };
  // expo-router supplies the full navigation helper; we only use emit/navigate.
  navigation: {
    emit: (...args: never[]) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

export function BottomNav({ state, navigation }: { state: NavProps['state']; navigation: any }) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? Palette.green : Palette.muted;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={styles.tab}>
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
