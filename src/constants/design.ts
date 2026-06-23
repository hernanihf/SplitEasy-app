// Design tokens derived from the SplitEasy design (SplitEasy.dc.html).

export const Palette = {
  green: '#0E7C5A',
  greenDark: '#0a6349',
  greenTint: '#E6F2EC',
  greenTintBorder: '#CDE6D9',
  ink: '#0F1A16',
  muted: '#8A958F',
  muted2: '#65726B',
  muted3: '#7C8983',
  faint: '#9AA39E',
  bg: '#F6F7F6',
  inputBg: '#F4F6F5',
  card: '#FFFFFF',
  cardBorder: '#ECEFED',
  divider: '#F1F3F2',
  blue: '#2F6FED',
  red: '#C2453B',
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 30,
} as const;

export const Font = {
  sans: 'Geist',
  sansMedium: 'Geist-Medium',
  sansSemibold: 'Geist-Semibold',
  sansBold: 'Geist-Bold',
  mono: 'GeistMono',
  monoMedium: 'GeistMono-Medium',
  monoSemibold: 'GeistMono-Semibold',
} as const;

// Palette used to give each member a stable avatar color.
const AVATAR_COLORS = [
  '#0E7C5A',
  '#2F6FED',
  '#E0883D',
  '#B5547C',
  '#6B5BD2',
  '#1FA37A',
  '#C2603A',
  '#3A7CA5',
  '#C2548A',
  '#7A8B3A',
  '#4F8C6A',
];

export function avatarColor(id: number | string): string {
  const n = typeof id === 'number' ? id : hashString(id);
  return AVATAR_COLORS[Math.abs(n) % AVATAR_COLORS.length];
}

// Soft background tints for group emoji tiles.
const TILE_BG = ['#E3EEFB', '#E6F2EC', '#FBEAE0', '#F3EDFB', '#FBF0E0', '#E8F5F0'];

export function tileBg(id: number | string): string {
  const n = typeof id === 'number' ? id : hashString(id);
  return TILE_BG[Math.abs(n) % TILE_BG.length];
}

export function initial(name: string | undefined | null): string {
  const trimmed = (name ?? '').trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export const GROUP_EMOJIS = ['🏔️', '🏠', '🔥', '✈️', '🍽️', '🎉', '⚽', '🏖️', '🚗', '💸'];
