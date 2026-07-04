import type { ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  color: string;
  size?: number;
  style?: ViewStyle;
};

// A vector chevron instead of a Unicode "⌄" — that glyph isn't covered by
// the Geist font, so it falls back to whatever the OS supplies, and
// Android's fallback renders it noticeably off-center against label text
// sitting next to it. An SVG renders identically everywhere.
export function ChevronIcon({ color, size = 10, style }: Props) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 10 6" style={style}>
      <Path
        d="M1 1L5 5L9 1"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
