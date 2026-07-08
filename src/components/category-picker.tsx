import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronIcon } from '@/components/chevron-icon';
import { CATEGORIES } from '@/constants/categories';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  value: string;
  onChange: (slug: string) => void;
};

// Collapsed by default to just the current (suggested or already-picked)
// category — the full 20-category list only appears once you tap it, as a
// dropdown panel below the trigger instead of sitting on screen the whole
// time. Picking one collapses it back.
export function CategoryPicker({ value, onChange }: Props) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [expanded, setExpanded] = useState(false);

  const current = CATEGORIES.find((c) => c.slug === value) ?? CATEGORIES[CATEGORIES.length - 1];

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={[styles.chip, styles.chipActive, styles.chipCollapsed]}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={[styles.label, styles.labelActive]}>{t(`categories.${current.slug}`)}</Text>
        <ChevronIcon color={Palette.greenDark} style={expanded ? styles.chevronUp : undefined} />
      </Pressable>

      {expanded && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((c, i) => {
              const active = value === c.slug;
              return (
                <Pressable
                  key={c.slug}
                  onPress={() => {
                    onChange(c.slug);
                    setExpanded(false);
                  }}
                  style={[
                    styles.row,
                    active && styles.rowActive,
                    i < CATEGORIES.length - 1 && styles.rowDivider,
                  ]}>
                  <Text style={styles.emoji}>{c.emoji}</Text>
                  <Text style={[styles.rowLabel, active && styles.labelActive]}>
                    {t(`categories.${c.slug}`)}
                  </Text>
                  {active && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
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
    chevronUp: { transform: [{ rotate: '180deg' }] },
    dropdown: {
      marginTop: 8,
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.md,
      overflow: 'hidden',
    },
    dropdownScroll: { maxHeight: 260 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    rowActive: { backgroundColor: Palette.greenTint },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Palette.cardBorder },
    rowLabel: { flex: 1, fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
    check: { fontSize: 14, fontFamily: Font.sansBold, color: Palette.green },
  });
