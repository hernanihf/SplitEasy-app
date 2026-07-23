import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { Icon } from '@/components/icon';
import { useColors } from '@/lib/settings';

// Circular back button with a crisp, optically-centred SVG chevron. Replaces a
// text "‹" glyph, whose uneven side bearings made it look off-centre.
export function BackButton({ onPress, style }: { onPress: () => void; style?: ViewStyle }) {
  const Palette = useColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={[styles.btn, { backgroundColor: Palette.card, borderColor: Palette.cardBorder }, style]}>
      <Icon name="chevron-left" size={20} color={Palette.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
