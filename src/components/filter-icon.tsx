import type { ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

type Props = {
  color: string;
  size?: number;
  style?: ViewStyle;
};

// A vector funnel instead of a Unicode glyph, so it renders identically
// (and recognizably as "filter") on every platform/font — same rationale as
// ChevronIcon.
export function FilterIcon({ color, size = 18, style }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Polygon
        points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
