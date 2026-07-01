import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Radius, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// React Native Web's Alert.alert is a no-op — it renders nothing on the PWA,
// which is this app's primary target. A real Modal (fully implemented on
// web, unlike Alert) is the only way to get a confirmation dialog that
// actually shows up before a destructive action.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  const Palette = useColors();
  const styles = makeStyles(Palette);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.dim} onPress={onCancel} />
      <View style={styles.center}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.row}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive]}>
              <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>
                {confirmLabel ?? t('common.delete')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,16,12,0.42)' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    sheet: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: Palette.card,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      padding: 22,
    },
    title: { fontSize: 16.5, fontFamily: Font.sansBold, color: Palette.ink, marginBottom: 6 },
    message: { fontSize: 13.5, color: Palette.muted, lineHeight: 19 },
    row: { flexDirection: 'row', gap: 10, marginTop: 20 },
    cancelBtn: {
      flex: 1,
      height: 46,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Palette.bg,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
    },
    cancelText: { fontSize: 14, fontFamily: Font.sansSemibold, color: Palette.ink },
    confirmBtn: {
      flex: 1,
      height: 46,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Palette.green,
    },
    confirmBtnDestructive: { backgroundColor: Palette.red },
    confirmText: { fontSize: 14, fontFamily: Font.sansSemibold, color: '#fff' },
    confirmTextDestructive: { color: '#fff' },
  });
