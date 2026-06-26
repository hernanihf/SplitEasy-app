import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Logo } from '@/components/logo';

// Matches the PWA splash background so the OS splash hands off seamlessly to
// this animated in-app loader while fonts/auth/settings initialize.
const SPLASH_BG = '#0F1A16';

export function AppLoading() {
  // Start at a visible scale so the logo is never hidden, even if the
  // animation engine isn't running (e.g. some web edge cases) — the animation
  // is a progressive enhancement on top.
  const scale = useSharedValue(0.92);

  useEffect(() => {
    // Pop in, then breathe gently while loading.
    scale.value = withSequence(
      withTiming(1, { duration: 360, easing: Easing.out(Easing.back(1.5)) }),
      withRepeat(
        withSequence(
          withTiming(1.07, { duration: 750, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={animatedStyle}>
        <Logo size={96} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: SPLASH_BG },
});
