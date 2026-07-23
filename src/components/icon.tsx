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
  | 'contrast'
  // Category / event-type icons — one per domain.ExpenseCategorySlugs slug,
  // plus 'cash' (settlement) and 'message' (comment).
  | 'fork'
  | 'cart'
  | 'coffee'
  | 'drink'
  | 'car'
  | 'fuel'
  | 'plane'
  | 'bed'
  | 'home'
  | 'bulb'
  | 'wifi'
  | 'clapper'
  | 'ball'
  | 'bag'
  | 'health'
  | 'cap'
  | 'gift'
  | 'paw'
  | 'broom'
  | 'dots'
  | 'cash'
  | 'message';

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
      {name === 'fork' && (
        <>
          <Path d="M5 3V8L7 11M9 3V8L7 11M7 3V11M7 11V21" {...common} />
          <Path d="M15 3C15 3 20 6.5 20 10C20 11.5 18.8 12.5 17.3 13L15 13.5Z M17 13V21" {...common} />
        </>
      )}
      {name === 'cart' && (
        <>
          <Path d="M3 4H5L7.5 14.5A2 2 0 0 0 9.4 16H17A2 2 0 0 0 18.9 14.5L20.5 7H6" {...common} />
          <Circle cx="9" cy="20" r="1.4" {...common} />
          <Circle cx="17" cy="20" r="1.4" {...common} />
        </>
      )}
      {name === 'coffee' && (
        <>
          <Path d="M5 8H16V13A5.5 5 0 0 1 10.5 18A5.5 5 0 0 1 5 13V8Z" {...common} />
          <Path d="M16 9.5H17.5A2 2 0 0 1 17.5 13.5H16" {...common} />
          <Path d="M8 3C8 4 7 4.5 7 5.5S8 7 8 8M13 3C13 4 12 4.5 12 5.5S13 7 13 8" {...common} />
        </>
      )}
      {name === 'drink' && <Path d="M4 4H20L12 13Z M12 13V19M8 21H16" {...common} />}
      {name === 'car' && (
        <>
          <Path d="M4 16L5.5 10.5A2 2 0 0 1 7.4 9H16.6A2 2 0 0 1 18.5 10.5L20 16M3 16H21" {...common} />
          <Circle cx="7.5" cy="17.3" r="1.5" {...common} />
          <Circle cx="16.5" cy="17.3" r="1.5" {...common} />
        </>
      )}
      {name === 'fuel' && (
        <>
          <Rect x="5" y="6" width="8" height="15" rx="1.5" {...common} />
          <Path d="M7.5 9.5H10.5" {...common} />
          <Path d="M13 11H16A2 2 0 0 1 18 13V17.5A1.5 1.5 0 0 0 21 17.5V9.5L18.5 7" {...common} />
        </>
      )}
      {name === 'plane' && <Path d="M3 12L21 3L14.5 20L11 12.5L3 12Z M11 12.5L21 3" {...common} />}
      {name === 'bed' && (
        <Path d="M3 19V7M3 12H21V19M7 12V9.5A2 2 0 0 1 9 7.5H15A2 2 0 0 1 17 9.5V12M21 19V15" {...common} />
      )}
      {name === 'home' && <Path d="M4 11L12 4L20 11M6 10V20H18V10" {...common} />}
      {name === 'bulb' && (
        <Path d="M9 18H15M10 21H14M8 12A4 4 0 1 1 16 12C16 14 14.5 14.5 14 16H10C9.5 14.5 8 14 8 12Z" {...common} />
      )}
      {name === 'wifi' && (
        <>
          <Path d="M4 9C9 4 15 4 20 9M7 12.5C10 9.5 14 9.5 17 12.5" {...common} />
          <Circle cx="12" cy="17" r="1.3" fill={color} stroke="none" />
        </>
      )}
      {name === 'clapper' && (
        <>
          <Path d="M3 8L5.5 4H9L6.5 8M12 8L14.5 4H18L15.5 8" {...common} />
          <Rect x="3" y="8" width="18" height="12" rx="1.5" {...common} />
        </>
      )}
      {name === 'ball' && (
        <>
          <Circle cx="12" cy="12" r="8" {...common} />
          <Path d="M12 6V10L15.5 12.5L14 16.5H10L8.5 12.5L12 10" {...common} />
        </>
      )}
      {name === 'bag' && <Path d="M6 8H18L17 21H7L6 8Z M9 8V6A3 3 0 0 1 15 6V8" {...common} />}
      {name === 'health' && (
        <>
          <Circle cx="12" cy="12" r="8" {...common} />
          <Path d="M12 8.5V15.5M8.5 12H15.5" {...common} />
        </>
      )}
      {name === 'cap' && (
        <Path d="M2 9L12 4L22 9L12 14L2 9Z M6 11V15.5C6 16.9 8.7 18 12 18C15.3 18 18 16.9 18 15.5V11M22 9V14.5" {...common} />
      )}
      {name === 'gift' && (
        <>
          <Rect x="4" y="10" width="16" height="10" rx="1" {...common} />
          <Rect x="3" y="7" width="18" height="4" rx="1" {...common} />
          <Path d="M12 7V20" {...common} />
          <Path
            d="M12 7C10.3 7 9 5.7 9 4.6C9 3.6 10 3.1 10.9 3.9C11.4 4.4 12 5.3 12 7C12 5.3 12.6 4.4 13.1 3.9C14 3.1 15 3.6 15 4.6C15 5.7 13.7 7 12 7Z"
            {...common}
          />
        </>
      )}
      {name === 'paw' && (
        <>
          <Circle cx="12" cy="16" r="3.4" fill={color} stroke="none" />
          <Circle cx="6.5" cy="9" r="1.7" fill={color} stroke="none" />
          <Circle cx="10.3" cy="5.8" r="1.7" fill={color} stroke="none" />
          <Circle cx="14.3" cy="5.8" r="1.7" fill={color} stroke="none" />
          <Circle cx="17.8" cy="9.3" r="1.7" fill={color} stroke="none" />
        </>
      )}
      {name === 'broom' && (
        <Path d="M15 3L9 15M9 15L4 21M9 15L6 22M9 15L9 22M9 15L12 22M9 15L14 21" {...common} />
      )}
      {name === 'dots' && (
        <>
          <Circle cx="7" cy="12" r="1.8" fill={color} stroke="none" />
          <Circle cx="12" cy="12" r="1.8" fill={color} stroke="none" />
          <Circle cx="17" cy="12" r="1.8" fill={color} stroke="none" />
        </>
      )}
      {name === 'cash' && (
        <>
          <Rect x="2" y="6" width="20" height="12" rx="2" {...common} />
          <Circle cx="12" cy="12" r="3" {...common} />
        </>
      )}
      {name === 'message' && (
        <Path d="M4 6A2 2 0 0 1 6 4H18A2 2 0 0 1 20 6V15A2 2 0 0 1 18 17H9L4 21V6Z" {...common} />
      )}
    </Svg>
  );
}
