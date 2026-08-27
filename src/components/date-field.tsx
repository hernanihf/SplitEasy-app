import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Radius, type ThemeColors } from '@/constants/design';
import { i18n, t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder: string;
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(i18n.locale === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

// Android's date picker is a self-contained system dialog — rendering it at
// all is enough to show it, and it dismisses itself. iOS's has no dialog
// chrome of its own, so it needs a sheet (matching FilterSheet's look) with
// an explicit Done button.
export function DateField({ value, onChange, placeholder }: Props) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.field}>
        <Text style={[styles.fieldText, !value && styles.placeholder]} numberOfLines={1}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </Pressable>

      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setOpen(false);
            if (event.type === 'set' && selectedDate) onChange(selectedDate);
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.dim} onPress={() => setOpen(false)} />
          <View style={styles.sheetWrap} pointerEvents="box-none">
            <View style={styles.sheet}>
              <DateTimePicker
                value={value ?? new Date()}
                mode="date"
                display="inline"
                onChange={(_event, selectedDate) => {
                  if (selectedDate) onChange(selectedDate);
                }}
              />
              <Pressable onPress={() => setOpen(false)} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>{t('common.done')}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    field: {
      height: 44,
      justifyContent: 'center',
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.md,
      paddingHorizontal: 14,
    },
    fieldText: { fontSize: 14.5, fontFamily: Font.sans, color: Palette.ink },
    placeholder: { color: Palette.muted },
    dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,16,12,0.42)' },
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
      backgroundColor: Palette.bg,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      paddingTop: 8,
      alignItems: 'center',
    },
    doneBtn: {
      alignSelf: 'stretch',
      margin: 20,
      height: 50,
      borderRadius: 15,
      backgroundColor: Palette.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneBtnText: { color: '#fff', fontSize: 15, fontFamily: Font.sansSemibold },
  });
