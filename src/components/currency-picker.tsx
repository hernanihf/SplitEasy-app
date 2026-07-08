import { useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronIcon } from '@/components/chevron-icon';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants/currencies';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  value: string;
  onChange: (code: string) => void;
};

type Anchor = { x: number; y: number; width: number; height: number };

const GAP = 6;
const MARGIN = 16;
const MIN_WIDTH = 220;

// RN's Dimensions.get('window') can lag the browser's real viewport size on
// the very first read on web (it settles after the first resize/layout
// event) — which was placing the dropdown as if the screen were much
// shorter than it actually is on that first open. window.innerWidth/Height
// are always current, so prefer those on web.
function getViewportSize() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return Dimensions.get('window');
}

// Positions the dropdown against its trigger's measured screen coordinates —
// opens downward by default, flips above the trigger if there isn't enough
// room below, and stays clear of the screen edges horizontally.
function placeDropdown(anchor: Anchor) {
  const win = getViewportSize();
  const width = Math.min(Math.max(anchor.width, MIN_WIDTH), win.width - MARGIN * 2);

  let left = anchor.x;
  if (left + width > win.width - MARGIN) left = win.width - width - MARGIN;
  if (left < MARGIN) left = MARGIN;

  const spaceBelow = win.height - (anchor.y + anchor.height) - MARGIN;
  const spaceAbove = anchor.y - MARGIN;
  const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
  const maxHeight = Math.min(320, Math.max(openUp ? spaceAbove : spaceBelow, 120));

  return openUp
    ? { left, width, maxHeight, bottom: win.height - anchor.y + GAP }
    : { left, width, maxHeight, top: anchor.y + anchor.height + GAP };
}

// Collapsed by default to just the current (suggested or already-picked)
// currency — the full list only appears once you tap it, as a dropdown
// anchored to the trigger (like a native <select>) rather than a sheet
// sliding up from the bottom of the screen.
export function CurrencyPicker({ value, onChange }: Props) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [placement, setPlacement] = useState<ReturnType<typeof placeDropdown> | null>(null);
  const triggerRef = useRef<View>(null);

  const current =
    CURRENCIES.find((c) => c.code === value) ?? CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY)!;

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setPlacement(placeDropdown({ x, y, width, height }));
    });
  };
  const close = () => setPlacement(null);

  return (
    <View ref={triggerRef} collapsable={false}>
      <Pressable onPress={open} style={[styles.chip, styles.chipActive, styles.chipCollapsed]}>
        <Text style={styles.flag}>{current.flag}</Text>
        <Text style={[styles.label, styles.labelActive]}>
          {current.code} · {t(`currencies.${current.code}`)}
        </Text>
        <ChevronIcon color={Palette.greenDark} />
      </Pressable>

      <Modal visible={!!placement} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.dim} onPress={close} />
        {placement && (
          <View style={[styles.dropdown, placement]}>
            <ScrollView style={{ maxHeight: placement.maxHeight }} showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((c, i) => {
                const active = value === c.code;
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => {
                      onChange(c.code);
                      close();
                    }}
                    style={[styles.row, i < CURRENCIES.length - 1 && styles.rowDivider]}>
                    <Text style={styles.flag}>{c.flag}</Text>
                    <Text style={[styles.rowLabel, active && styles.labelActive]}>
                      {c.code} · {t(`currencies.${c.code}`)}
                    </Text>
                    {active && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Modal>
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
    flag: { fontSize: 14 },
    label: { fontSize: 13.5, fontFamily: Font.sansMedium, color: Palette.ink },
    labelActive: { color: Palette.greenDark },
    dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    dropdown: {
      position: 'absolute',
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.md,
      paddingHorizontal: 14,
      boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
    } as object,
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
    },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Palette.cardBorder },
    rowLabel: { flex: 1, fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
    check: { fontSize: 14, fontFamily: Font.sansBold, color: Palette.green },
  });
