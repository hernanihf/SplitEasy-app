import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { CATEGORIES } from '@/constants/categories';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  value: string;
  onChange: (slug: string) => void;
};

// Single-row horizontal scroller — 20 categories as wrapping chips would
// push the rest of the form below the fold.
export function CategoryPicker({ value, onChange }: Props) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CATEGORIES.map((c) => {
        const active = value === c.slug;
        return (
          <Pressable
            key={c.slug}
            onPress={() => onChange(c.slug)}
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
    emoji: { fontSize: 14 },
    label: { fontSize: 13.5, fontFamily: Font.sansMedium, color: Palette.ink },
    labelActive: { color: Palette.greenDark },
  });
