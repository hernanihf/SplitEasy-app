import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FilterIcon } from '@/components/filter-icon';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { useColors } from '@/lib/settings';

// Shared building blocks for a "Filters" bottom sheet — a header pill that
// opens a Modal sliding up from the bottom, with sections of either a
// segmented control (mutually exclusive, few options) or a horizontal chip
// row (one "All ___" entry plus whatever's actually filterable). Used by the
// Activity feed and a group's History tab, which need the same UI over
// different data.

type BadgeButtonProps = { label: string; count: number; onPress: () => void };

// Icon-only, matching the edit/delete buttons elsewhere (a plain glyph in a
// small tappable square) rather than a labeled pill — label becomes the
// accessible name instead of visible text.
export function FilterBadgeButton({ label, count, onPress }: BadgeButtonProps) {
  const Palette = useColors();
  const styles = makeStyles(Palette);
  return (
    <Pressable onPress={onPress} style={styles.filtersBtn} accessibilityLabel={label}>
      <FilterIcon color={Palette.ink} size={18} />
      {count > 0 && (
        <View style={styles.filtersBadge}>
          <Text style={styles.filtersBadgeText}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  showClear: boolean;
  clearLabel: string;
  onClear: () => void;
  doneLabel: string;
  children: ReactNode;
};

export function FilterSheet({ visible, onClose, title, showClear, clearLabel, onClear, doneLabel, children }: SheetProps) {
  const Palette = useColors();
  const styles = makeStyles(Palette);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {showClear && (
                <Pressable onPress={onClear}>
                  <Text style={styles.clearText}>{clearLabel}</Text>
                </Pressable>
              )}
            </View>
            {children}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>{doneLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function FilterSection({ label, children }: { label: string; children: ReactNode }) {
  const Palette = useColors();
  const styles = makeStyles(Palette);
  return (
    <>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </>
  );
}

export function FilterSegment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const Palette = useColors();
  const styles = makeStyles(Palette);
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type FilterChipOption = { key: string; label: string; emoji?: string; active: boolean; onPress: () => void };

export function FilterChipRow({ options }: { options: FilterChipOption[] }) {
  const Palette = useColors();
  const styles = makeStyles(Palette);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={opt.onPress}
          style={[styles.chip, opt.active && styles.chipActive]}>
          {opt.emoji && <Text style={styles.chipEmoji}>{opt.emoji}</Text>}
          <Text style={[styles.chipText, opt.active && styles.chipTextActive]} numberOfLines={1}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    filtersBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filtersBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: Palette.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filtersBadgeText: { color: '#fff', fontSize: 10, fontFamily: Font.sansBold },
    dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,16,12,0.42)' },
    // On web, Modal portals to the document body — outside the app shell's
    // centred, width-capped column — so without this the sheet would stretch
    // to the full browser width instead of just the phone-sized layout.
    sheetWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    sheet: {
      width: '100%',
      maxWidth: 480,
      maxHeight: '80%',
      backgroundColor: Palette.bg,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      paddingTop: 18,
    },
    sheetScroll: { paddingHorizontal: 22, paddingBottom: 8 },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sheetTitle: { fontSize: 17, fontFamily: Font.sansBold, color: Palette.ink },
    clearText: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.red },
    sectionLabel: {
      fontSize: 12.5,
      fontFamily: Font.sansSemibold,
      color: Palette.muted,
      marginBottom: 8,
      marginTop: 14,
    },
    segment: { flexDirection: 'row', gap: 8 },
    segmentBtn: {
      flex: 1,
      height: 38,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      backgroundColor: Palette.card,
    },
    segmentBtnActive: { backgroundColor: Palette.ink, borderColor: Palette.ink },
    segmentText: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.muted3 },
    segmentTextActive: { color: Palette.bg },
    chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: Radius.pill,
      borderWidth: 1.5,
      borderColor: Palette.cardBorder,
      maxWidth: 180,
    },
    chipActive: { backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
    chipEmoji: { fontSize: 14 },
    chipText: { fontSize: 13, fontFamily: Font.sansMedium, color: Palette.ink },
    chipTextActive: { color: Palette.greenDark },
    doneBtn: {
      margin: 20,
      height: 50,
      borderRadius: 15,
      backgroundColor: Palette.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneBtnText: { color: '#fff', fontSize: 15, fontFamily: Font.sansSemibold },
  });
