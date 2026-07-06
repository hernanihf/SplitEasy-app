import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, GROUP_EMOJIS, Radius, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Props = {
  visible: boolean;
  currentEmoji: string;
  onSelect: (emoji: string) => void;
  onCancel: () => void;
};

export function EditGroupIconModal({ visible, currentEmoji, onSelect, onCancel }: Props) {
  const Palette = useColors();
  const styles = makeStyles(Palette);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.dim} onPress={onCancel} />
      <View style={styles.center}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('groupDetail.editIconTitle')}</Text>
          <View style={styles.grid}>
            {GROUP_EMOJIS.map((em) => (
              <Pressable
                key={em}
                onPress={() => onSelect(em)}
                style={[styles.option, em === currentEmoji && styles.optionActive]}>
                <Text style={styles.optionChar}>{em}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
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
    title: { fontSize: 16.5, fontFamily: Font.sansBold, color: Palette.ink, marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    option: {
      width: 46,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Palette.bg,
      borderWidth: 1.5,
      borderColor: Palette.cardBorder,
    },
    optionActive: { backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
    optionChar: { fontSize: 21 },
    cancelBtn: {
      height: 46,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Palette.bg,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      marginTop: 20,
    },
    cancelText: { fontSize: 14, fontFamily: Font.sansSemibold, color: Palette.ink },
  });
