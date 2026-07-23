import Svg, { Circle, Path, Rect } from 'react-native-svg';

// One hand-drawn icon set for every UI action glyph (share, download, close,
// etc.) — same stroke recipe BackButton's chevron already used (24x24
// viewBox, round caps/joins) because that's what fixed its own "uneven side
// bearings" problem: mixing arbitrary emoji as buttons renders inconsistently
// across platforms/fonts, where a single owned SVG set renders identically
// everywhere. Category emoji (food, transport, etc.) are unaffected — those
// are content, not chrome.
export type IconName =
  | 'chevron-left'
  | 'download'
  | 'copy'
  | 'x'
  | 'check'
  | 'world'
  | 'bell'
  | 'sun'
  | 'moon'
  | 'contrast';

type Props = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color, strokeWidth = 2 }: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'chevron-left' && <Path d="M14.5 6 L8.5 12 L14.5 18" {...common} />}
      {name === 'download' && <Path d="M12 3.5V14.5M7.5 10L12 14.5L16.5 10M5 18.5H19" {...common} />}
      {name === 'copy' && (
        <>
          <Rect x="8" y="8" width="11" height="12" rx="2" {...common} />
          <Path d="M6 15H5.5A1.5 1.5 0 0 1 4 13.5v-9A1.5 1.5 0 0 1 5.5 3h9A1.5 1.5 0 0 1 16 4.5V6" {...common} />
        </>
      )}
      {name === 'x' && <Path d="M6 6L18 18M18 6L6 18" {...common} />}
      {name === 'check' && <Path d="M5 13L10 18L19 7" {...common} />}
      {name === 'world' && (
        <>
          <Circle cx="12" cy="12" r="8" {...common} />
          <Path d="M4 12H20M12 4C9 7 9 17 12 20M12 4C15 7 15 17 12 20" {...common} />
        </>
      )}
      {name === 'bell' && (
        <Path d="M7 9a5 5 0 0 1 10 0c0 4.5 1.5 6 2 6.5H5c.5-.5 2-2 2-6.5ZM10 18.5a2 2 0 0 0 4 0" {...common} />
      )}
      {name === 'sun' && (
        <>
          <Circle cx="12" cy="12" r="4" {...common} />
          <Path
            d="M12 2.5V5M12 19V21.5M4.5 12H2M22 12H19.5M5.5 5.5L7.2 7.2M16.8 16.8L18.5 18.5M18.5 5.5L16.8 7.2M7.2 16.8L5.5 18.5"
            {...common}
          />
        </>
      )}
      {name === 'moon' && <Path d="M20 12.8A8.5 8.5 0 1 1 11.2 4a6.7 6.7 0 0 0 8.8 8.8Z" {...common} />}
      {name === 'contrast' && (
        <>
          <Circle cx="12" cy="12" r="8" {...common} />
          <Path d="M12 4a8 8 0 0 1 0 16Z" fill={color} stroke="none" />
        </>
      )}
    </Svg>
  );
}
