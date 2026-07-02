import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CURRENCIES } from '@/constants/currencies';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  value: string;
  onChange: (code: string) => void;
};

// Only 8 currencies, so wrapping chips fit without needing a scroller.
export function CurrencyPicker({ value, onChange }: Props) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  return (
    <View style={styles.row}>
      {CURRENCIES.map((c) => {
        const active = value === c.code;
        return (
          <Pressable
            key={c.code}
            onPress={() => onChange(c.code)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={styles.flag}>{c.flag}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {c.code} · {t(`currencies.${c.code}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    flag: { fontSize: 14 },
    label: { fontSize: 13.5, fontFamily: Font.sansMedium, color: Palette.ink },
    labelActive: { color: Palette.greenDark },
  });
