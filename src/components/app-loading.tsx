import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Font, Palette } from '@/constants/design';
import { useLoadingDots } from '@/lib/use-loading-dots';

// Matches the PWA splash background so the OS splash hands off seamlessly to
// this animated in-app loader while fonts/auth/settings initialize.
const SPLASH_BG = '#0F1A16';
const SIZE = 104;
const SPREAD = 20; // px each half travels outward at full separation
const FADE = 0.75; // opacity drops from 1 to (1 - FADE) at full separation

type AppLoadingProps = {
  message?: string;
};

export function AppLoading({ message }: AppLoadingProps) {
  const dots = useLoadingDots();
  // 0 = halves together & opaque, 1 = split apart & faded. Ping-pongs forever.
  // At rest (0) the logo is the full, solid circle, so it stays visible even if
  // the animation engine isn't running.
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [t]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -SPREAD * t.value }],
    opacity: 1 - FADE * t.value,
  }));
  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: SPREAD * t.value }],
    opacity: 1 - FADE * t.value,
  }));

  return (
    <View style={styles.root}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Animated.View style={[styles.half, leftStyle]}>
          <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
            <Path d="M50,3 A47,47 0 0,0 50,97 Z" fill={Palette.green} />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.half, rightStyle]}>
          <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
            <Path d="M50,3 A47,47 0 0,1 50,97 Z" fill={Palette.blue} />
          </Svg>
        </Animated.View>
      </View>
      {message && <Text style={styles.message}>{message + dots}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: SPLASH_BG },
  half: { position: 'absolute', top: 0, left: 0 },
  message: {
    marginTop: 28,
    fontSize: 14,
    fontFamily: Font.sansMedium,
    color: 'rgba(255,255,255,0.7)',
  },
});
