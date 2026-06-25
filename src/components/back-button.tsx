import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path
          d="M14.5 6 L8.5 12 L14.5 18"
          stroke={Palette.ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
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
