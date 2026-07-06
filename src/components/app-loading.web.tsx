import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/constants/design';

// Matches the PWA splash background so the OS splash hands off seamlessly to
// this loader while fonts/auth/settings initialize.
const SPLASH_BG = '#0F1A16';
const SIZE = 104;
const SPREAD = 20; // px each half travels outward at full separation
const FADE = 0.75; // opacity drops from 1 to (1 - FADE) at full separation
const fadedOpacity = 1 - FADE;

// Web gets its own implementation (not app-loading.tsx's reanimated version)
// because "web": { "output": "static" } pre-renders this component to HTML
// at build time, before any JS runs — a JS-driven (reanimated) animation
// would be frozen at its first frame until hydration, and often stays frozen
// even after, since the loading conditions this gates (fonts/auth/settings)
// can resolve before the JS thread — busy downloading/parsing the bundle —
// ever gets to run an animation frame. A plain CSS @keyframes animation is
// applied by the browser directly from the exported HTML/CSS, with no JS
// required, so it's already moving in the very first paint.
//
// animationKeyframes/animationDuration/etc. are react-native-web-only style
// extensions (compiled to real CSS @keyframes by react-native-web's Babel
// plugin), not part of RN's StyleSheet types — hence the per-property casts.
// They MUST stay inside StyleSheet.create (not a plain object built outside
// it) since that static `StyleSheet.create({...})` call is exactly what the
// Babel plugin pattern-matches to extract real CSS at build time; anything
// else falls back to a runtime inline style, which doesn't understand
// animationKeyframes and silently serializes it to garbage.
const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: SPLASH_BG },
  half: { position: 'absolute', top: 0, left: 0 },
  left: {
    animationDuration: '1600ms',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { transform: 'translateX(0px)', opacity: 1 },
        '50%': { transform: `translateX(-${SPREAD}px)`, opacity: fadedOpacity },
        '100%': { transform: 'translateX(0px)', opacity: 1 },
      },
    ],
  } as ViewStyle,
  right: {
    animationDuration: '1600ms',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationKeyframes: [
      {
        '0%': { transform: 'translateX(0px)', opacity: 1 },
        '50%': { transform: `translateX(${SPREAD}px)`, opacity: fadedOpacity },
        '100%': { transform: 'translateX(0px)', opacity: 1 },
      },
    ],
  } as ViewStyle,
});

export function AppLoading() {
  return (
    <View style={styles.root}>
      <View style={{ width: SIZE, height: SIZE }}>
        <View style={[styles.half, styles.left]}>
          <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
            <Path d="M50,3 A47,47 0 0,0 50,97 Z" fill={Palette.green} />
          </Svg>
        </View>
        <View style={[styles.half, styles.right]}>
          <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
            <Path d="M50,3 A47,47 0 0,1 50,97 Z" fill={Palette.blue} />
          </Svg>
        </View>
      </View>
    </View>
  );
}
