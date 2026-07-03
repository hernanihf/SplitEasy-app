import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/lib/settings';

type Props = {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
};

// A pulsing placeholder block — compose a few of these into a skeleton that
// mirrors a screen's real layout, shown while its first load is in flight
// (see home-skeleton.tsx). Kept as a single primitive so every skeleton in
// the app pulses in sync and at the same rate.
export function SkeletonBlock({ width, height, radius = 8, style }: Props) {
  const Palette = useColors();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [t]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + 0.35 * t.value,
  }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: Palette.inputBg }, animatedStyle, style]}
    />
  );
}
