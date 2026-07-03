import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { CATEGORIES } from '@/constants/categories';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  value: string;
  onChange: (slug: string) => void;
};

// Collapsed by default to just the current (suggested or already-picked)
// category — the full 20-category list only appears once you tap it, so it
// doesn't sit on screen the whole time. Picking one collapses it back.
export function CategoryPicker({ value, onChange }: Props) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    const current = CATEGORIES.find((c) => c.slug === value) ?? CATEGORIES[CATEGORIES.length - 1];
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        style={[styles.chip, styles.chipActive, styles.chipCollapsed]}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={[styles.label, styles.labelActive]}>{t(`categories.${current.slug}`)}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CATEGORIES.map((c) => {
        const active = value === c.slug;
        return (
          <Pressable
            key={c.slug}
            onPress={() => {
              onChange(c.slug);
              setExpanded(false);
            }}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={styles.emoji}>{c.emoji}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {t(`categories.${c.slug}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 11,
      borderRadius: Radius.pill,
      borderWidth: 1.5,
      borderColor: Palette.cardBorder,
    },
    chipActive: { backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
    chipCollapsed: { alignSelf: 'flex-start' },
    emoji: { fontSize: 14 },
    label: { fontSize: 13.5, fontFamily: Font.sansMedium, color: Palette.ink },
    labelActive: { color: Palette.greenDark },
    chevron: { fontSize: 13, color: Palette.greenDark, marginLeft: -1 },
  });
