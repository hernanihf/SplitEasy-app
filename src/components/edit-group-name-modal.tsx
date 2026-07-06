import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Font, Radius, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  visible: boolean;
  initialName: string;
  saving: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
};

export function EditGroupNameModal({ visible, initialName, saving, onSave, onCancel }: Props) {
  const Palette = useColors();
  const styles = makeStyles(Palette);
  const [name, setName] = useState(initialName);
  const [wasVisible, setWasVisible] = useState(visible);

  // Reset to the current group name each time the modal (re)opens, so a
  // previously cancelled edit doesn't linger into the next open. Adjusted
  // during render (not an effect) per React's derived-state pattern, since
  // the component stays mounted across opens/closes.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setName(initialName);
  }

  const trimmed = name.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.dim} onPress={onCancel} />
      <View style={styles.center}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('groupDetail.editNameTitle')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('groupDetail.editNamePlaceholder')}
            placeholderTextColor={Palette.muted}
            style={styles.input}
            autoFocus
          />
          <View style={styles.row}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(trimmed)}
              disabled={saving || trimmed === ''}
              style={[styles.saveBtn, (saving || trimmed === '') && styles.disabled]}>
              <Text style={styles.saveText}>{t('common.done')}</Text>
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
    title: { fontSize: 16.5, fontFamily: Font.sansBold, color: Palette.ink, marginBottom: 14 },
    input: {
      height: 50,
      fontSize: 15,
      color: Palette.ink,
      fontFamily: Font.sans,
      backgroundColor: Palette.bg,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.md,
      paddingHorizontal: 14,
    },
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
    saveBtn: {
      flex: 1,
      height: 46,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Palette.green,
    },
    disabled: { opacity: 0.6 },
    saveText: { fontSize: 14, fontFamily: Font.sansSemibold, color: '#fff' },
  });
