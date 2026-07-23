// Design tokens derived from the SplitEasy design (SplitEasy.dc.html).

import type { IconName } from '@/components/icon';

export type ThemeColors = {
  green: string;
  greenDark: string;
  greenTint: string;
  greenTintBorder: string;
  ink: string;
  muted: string;
  muted2: string;
  muted3: string;
  faint: string;
  bg: string;
  inputBg: string;
  card: string;
  cardBorder: string;
  divider: string;
  blue: string;
  red: string;
  canvas: string; // the area around the centered app column on wide screens
};

export const LightColors: ThemeColors = {
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
  canvas: '#E7E5DF',
};

export const DarkColors: ThemeColors = {
  green: '#27B37D',
  greenDark: '#1C9266',
  greenTint: '#15302A',
  greenTintBorder: '#23463C',
  ink: '#EAF0EC',
  muted: '#8C988F',
  muted2: '#A6B0A9',
  muted3: '#93A09A',
  faint: '#6C766F',
  bg: '#0E1311',
  inputBg: '#1A211E',
  card: '#161D1A',
  cardBorder: '#262E2A',
  divider: '#222A26',
  blue: '#5B8DEF',
  red: '#E0655B',
  canvas: '#000000',
};

// Light palette, kept as the default for any non-themed/static usage.
export const Palette: ThemeColors = LightColors;

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

// Soft background tints for group emoji tiles — fixed regardless of theme
// (unlike ThemeColors), so an icon drawn on top needs a fixed dark color too
// (TILE_ICON_COLOR below), not Palette.ink — that flips to a near-white in
// dark mode and disappears against these always-light tints.
const TILE_BG = ['#E3EEFB', '#E6F2EC', '#FBEAE0', '#F3EDFB', '#FBF0E0', '#E8F5F0'];

export const TILE_ICON_COLOR = '#0F1A16';

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

export const GROUP_EMOJIS = [
  '🏔️', '🏠', '🔥', '✈️', '🍽️', '🎉', '⚽', '🏖️', '🚗', '💸',
  '❤️', '🎁', '🍸', '🐾', '💼', '📚', '📷', '⛺', '🚲',
];

// Each group emoji's line-icon equivalent, for tiles that render the shared
// Icon component instead of the emoji glyph directly (same "one owned icon
// set instead of mixed emoji" reasoning as every other icon in the app).
// Keyed by the emoji itself — not a separate stored value — so groups picked
// before this existed keep rendering correctly with no migration.
const GROUP_ICON_BY_EMOJI: Record<string, IconName> = {
  '🏔️': 'mountain',
  '🏠': 'home',
  '🔥': 'fire',
  '✈️': 'plane',
  '🍽️': 'fork',
  '🎉': 'party',
  '⚽': 'ball',
  '🏖️': 'beach',
  '🚗': 'car',
  '💸': 'cash',
  '❤️': 'heart',
  '🎁': 'gift',
  '🍸': 'drink',
  '🐾': 'paw',
  '💼': 'briefcase',
  '📚': 'book',
  '📷': 'camera',
  '⛺': 'tent',
  '🚲': 'bike',
};

export function groupIcon(emoji: string | undefined | null): IconName {
  return (emoji && GROUP_ICON_BY_EMOJI[emoji]) || 'cash';
}

// A generic "expense" icon, used when a description doesn't match any keyword.
export const DEFAULT_EXPENSE_EMOJI = '🧾';

// Maps an expense description to a related emoji by keyword (English + Spanish).
// Most specific keywords first.
const EXPENSE_EMOJI: { emoji: string; words: string[] }[] = [
  { emoji: '🚕', words: ['taxi', 'uber', 'cab', 'cabify', 'didi', 'remis', 'ride'] },
  { emoji: '🎉', words: ['disco', 'club', 'party', 'fiesta', 'boliche', 'nightclub'] },
  { emoji: '🍻', words: ['bar', 'beer', 'birra', 'cerveza', 'drink', 'trago', 'pub', 'pint'] },
  { emoji: '🍷', words: ['wine', 'vino'] },
  { emoji: '☕', words: ['coffee', 'cafe', 'café', 'starbucks'] },
  { emoji: '🥩', words: ['meat', 'butcher', 'carne', 'carnicería', 'carniceria', 'asado', 'parrilla'] },
  { emoji: '🛒', words: ['grocery', 'groceries', 'market', 'super', 'súper', 'mercado', 'almacen', 'almacén', 'compras', 'verduleria', 'verdulería'] },
  { emoji: '🍔', words: ['food', 'eat', 'lunch', 'dinner', 'breakfast', 'meal', 'comida', 'almuerzo', 'cena', 'desayuno', 'resto', 'restaurant', 'restaurante', 'burger', 'pizza', 'sushi'] },
  { emoji: '⛽', words: ['gas', 'fuel', 'nafta', 'combustible', 'gasolina'] },
  { emoji: '✈️', words: ['flight', 'plane', 'avion', 'avión', 'vuelo', 'airline', 'aerolinea', 'aerolínea'] },
  { emoji: '🚆', words: ['train', 'subway', 'metro', 'bus', 'colectivo', 'subte', 'tren', 'transport', 'transporte', 'sube'] },
  { emoji: '🏨', words: ['hotel', 'airbnb', 'hostel', 'lodging', 'hospedaje', 'alojamiento'] },
  { emoji: '🎬', words: ['movie', 'cinema', 'cine', 'pelicula', 'película', 'film'] },
  { emoji: '🛍️', words: ['shopping', 'shop', 'tienda', 'ropa', 'clothes', 'clothing'] },
  { emoji: '💊', words: ['pharmacy', 'farmacia', 'medicine', 'medicina', 'remedio', 'health', 'salud', 'doctor', 'medico', 'médico'] },
  { emoji: '⚽', words: ['soccer', 'futbol', 'fútbol', 'football', 'sport', 'deporte'] },
  { emoji: '🎮', words: ['game', 'games', 'juego', 'gaming', 'playstation', 'xbox'] },
  { emoji: '🏠', words: ['rent', 'alquiler', 'renta', 'house', 'casa'] },
  { emoji: '🎁', words: ['gift', 'regalo', 'present'] },
  { emoji: '💡', words: ['bill', 'factura', 'expensas', 'utilities', 'luz', 'internet', 'wifi', 'agua', 'water'] },
];

// Returns a related emoji for the description, falling back to a generic expense
// icon so a row is never left without one.
export function expenseEmoji(description: string | undefined | null): string {
  const text = (description ?? '').toLowerCase();
  for (const { emoji, words } of EXPENSE_EMOJI) {
    if (words.some((w) => text.includes(w))) return emoji;
  }
  return DEFAULT_EXPENSE_EMOJI;
}
