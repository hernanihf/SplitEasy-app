import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { ChevronIcon } from '@/components/chevron-icon';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants/currencies';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  value: string;
  onChange: (code: string) => void;
};

// Collapsed by default to just the current (suggested or already-picked)
// currency — the full list only appears once you tap it, mirroring
// CategoryPicker so both dropdowns in the new-group form behave the same.
export function CurrencyPicker({ value, onChange }: Props) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    const current =
      CURRENCIES.find((c) => c.code === value) ?? CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY)!;
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        style={[styles.chip, styles.chipActive, styles.chipCollapsed]}>
        <Text style={styles.flag}>{current.flag}</Text>
        <Text style={[styles.label, styles.labelActive]}>
          {current.code} · {t(`currencies.${current.code}`)}
        </Text>
        <ChevronIcon color={Palette.greenDark} style={styles.chevron} />
      </Pressable>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {CURRENCIES.map((c) => {
        const active = value === c.code;
        return (
          <Pressable
            key={c.code}
            onPress={() => {
              onChange(c.code);
              setExpanded(false);
            }}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={styles.flag}>{c.flag}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {c.code} · {t(`currencies.${c.code}`)}
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
    flag: { fontSize: 14 },
    label: { fontSize: 13.5, fontFamily: Font.sansMedium, color: Palette.ink },
    labelActive: { color: Palette.greenDark },
    chevron: { marginLeft: 1 },
  });
