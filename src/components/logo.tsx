import Svg, { Circle, ClipPath, Defs, G, Rect } from 'react-native-svg';

import { Palette } from '@/constants/design';

// The SplitEasy mark: a circle split into a green and a blue half with a thin
// gap. Drawn as SVG (transparent background) so it sits cleanly on any surface.
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityRole="image">
      <Defs>
        <ClipPath id="logo-circle">
          <Circle cx={50} cy={50} r={46} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#logo-circle)">
        <Rect x={0} y={0} width={48.5} height={100} fill={Palette.green} />
        <Rect x={51.5} y={0} width={48.5} height={100} fill={Palette.blue} />
      </G>
    </Svg>
  );
}
