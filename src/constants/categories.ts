import type { IconName } from '@/components/icon';
import { expenseEmoji } from '@/constants/design';

// The fixed expense category list, mirroring the backend's
// domain.ExpenseCategorySlugs (same slugs, same order). The backend stores
// and validates the slug; the emoji/color here and the localized names in
// i18n (`categories.<slug>`) are the frontend's half of the model. The
// color gives each category a stable slice color in the spending chart.
export const CATEGORIES = [
  { slug: 'food', emoji: '🍽️', color: '#E0883D' },
  { slug: 'groceries', emoji: '🛒', color: '#1FA37A' },
  { slug: 'coffee', emoji: '☕', color: '#9C6B4A' },
  { slug: 'drinks', emoji: '🍻', color: '#D9A93A' },
  { slug: 'transport', emoji: '🚕', color: '#3A7CA5' },
  { slug: 'fuel', emoji: '⛽', color: '#C2453B' },
  { slug: 'travel', emoji: '✈️', color: '#2F6FED' },
  { slug: 'accommodation', emoji: '🏨', color: '#6B5BD2' },
  { slug: 'housing', emoji: '🏠', color: '#0E7C5A' },
  { slug: 'utilities', emoji: '💡', color: '#E0B93D' },
  { slug: 'internet', emoji: '📱', color: '#4FA3A0' },
  { slug: 'entertainment', emoji: '🎬', color: '#B5547C' },
  { slug: 'sports', emoji: '⚽', color: '#4F8C3A' },
  { slug: 'shopping', emoji: '🛍️', color: '#D96BA0' },
  { slug: 'health', emoji: '💊', color: '#D65B72' },
  { slug: 'education', emoji: '🎓', color: '#5B78C9' },
  { slug: 'gifts', emoji: '🎁', color: '#C2603A' },
  { slug: 'pets', emoji: '🐾', color: '#8B7A3A' },
  { slug: 'household', emoji: '🧹', color: '#7A8B9A' },
  { slug: 'other', emoji: '📦', color: '#8A958F' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const DEFAULT_CATEGORY: CategorySlug = 'other';

const EMOJI_BY_SLUG: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.emoji]),
);

const COLOR_BY_SLUG: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.color]),
);

// The chart slice / legend color for a category, falling back to the "other"
// grey for anything unrecognized.
export function categoryColor(slug: string | undefined | null): string {
  return (slug && COLOR_BY_SLUG[slug]) || COLOR_BY_SLUG.other;
}

// One line icon per slug (same order as CATEGORIES), for tiles that render
// the new Icon component instead of the emoji above.
const ICON_BY_SLUG: Record<CategorySlug, IconName> = {
  food: 'fork',
  groceries: 'cart',
  coffee: 'coffee',
  drinks: 'drink',
  transport: 'car',
  fuel: 'fuel',
  travel: 'plane',
  accommodation: 'bed',
  housing: 'home',
  utilities: 'bulb',
  internet: 'wifi',
  entertainment: 'clapper',
  sports: 'ball',
  shopping: 'bag',
  health: 'health',
  education: 'cap',
  gifts: 'gift',
  pets: 'paw',
  household: 'broom',
  other: 'question',
};

// The icon for a category tile, falling back to "other" for anything
// unrecognized (including the legacy no-category case categoryEmoji's
// keyword guess used to cover — that guess only mattered for pre-migration
// data, and losing that extra nuance is an acceptable trade for one
// consistent icon set instead of two overlapping ones).
export function categoryIcon(slug: string | undefined | null): IconName {
  return (slug && ICON_BY_SLUG[slug as CategorySlug]) || ICON_BY_SLUG.other;
}

// The icon for an expense: its category's emoji when it has a meaningful
// category, otherwise the old keyword-based guess from the description —
// that keeps pre-category expenses (all migrated as "other") looking the
// way they always did instead of collapsing into one generic box icon.
export function categoryEmoji(
  category: string | undefined | null,
  description?: string | null,
): string {
  if (category && category !== 'other' && EMOJI_BY_SLUG[category]) {
    return EMOJI_BY_SLUG[category];
  }
  return expenseEmoji(description);
}

// Keyword → category, for suggesting a category while someone types a
// manual expense description (a receipt scan already gets its category
// straight from the AI, so this is only for that path). Most specific /
// least ambiguous categories first — e.g. "coffee" must win over the much
// broader "food" bucket for the same word list, and "fuel" claims "gas"
// before "utilities" gets a chance to.
//
// Skews toward Argentina (brand names, slang) since that's this app's
// primary market (see currencies.ts's DEFAULT_CURRENCY). Deliberately
// excludes a few real signals that are too collision-prone as whole words to
// be worth it as a *suggestion* — "día" (the Día supermarket chain, but
// also just the word "day"), "disco" (a real supermarket chain too, but
// already claimed by "nightclub" above it), "personal" and "claro" (both
// telecom brands, but common enough as plain words to misfire constantly).
const CATEGORY_KEYWORDS: { slug: CategorySlug; words: string[] }[] = [
  { slug: 'coffee', words: ['coffee', 'cafe', 'café', 'starbucks', 'espresso', 'latte', 'cappuccino', 'capuchino', 'cortado'] },
  {
    slug: 'pets',
    words: [
      'pet', 'pets', 'mascota', 'mascotas', 'veterinario', 'veterinaria', 'vet',
      'petshop', 'perro', 'perros', 'gato', 'gatos', 'purina',
    ],
  },
  {
    slug: 'education',
    words: [
      'school', 'escuela', 'colegio', 'universidad', 'university', 'curso', 'cursos', 'course',
      'matricula', 'matrícula', 'jardin', 'jardín', 'profesor', 'profesora', 'libros', 'clases',
    ],
  },
  { slug: 'gifts', words: ['gift', 'gifts', 'regalo', 'regalos', 'present', 'cumpleaños', 'birthday', 'aniversario', 'navidad'] },
  {
    slug: 'health',
    words: [
      'pharmacy', 'farmacia', 'medicine', 'medicina', 'remedio', 'remedios', 'health', 'salud',
      'doctor', 'medico', 'médico', 'dentista', 'dentist', 'hospital', 'clinica', 'clínica',
      'obra social', 'prepaga', 'turno', 'analisis', 'análisis', 'kinesiologo', 'kinesiólogo',
      'psicologo', 'psicólogo', 'oculista',
    ],
  },
  {
    slug: 'drinks',
    words: [
      'bar', 'beer', 'birra', 'cerveza', 'drink', 'drinks', 'trago', 'tragos', 'pub', 'boliche',
      'disco', 'nightclub', 'party', 'fiesta', 'club', 'wine', 'vino', 'fernet', 'whisky',
      'vodka', 'gin', 'tequila', 'champagne', 'previa',
    ],
  },
  {
    slug: 'groceries',
    words: [
      'grocery', 'groceries', 'market', 'super', 'súper', 'supermercado', 'mercado',
      'almacen', 'almacén', 'verduleria', 'verdulería', 'carniceria', 'carnicería', 'butcher',
      'coto', 'jumbo', 'carrefour', 'dietetica', 'dietética', 'panaderia', 'panadería',
      'fiambreria', 'fiambrería', 'pescaderia', 'pescadería',
    ],
  },
  { slug: 'fuel', words: ['gas', 'fuel', 'nafta', 'combustible', 'gasolina', 'ypf', 'shell', 'axion', 'puma', 'gnc'] },
  {
    slug: 'transport',
    words: [
      'taxi', 'uber', 'cab', 'cabify', 'didi', 'remis', 'train', 'subway', 'metro',
      'bus', 'colectivo', 'subte', 'tren', 'transporte', 'peaje', 'toll', 'estacionamiento',
      'parking', 'sube', 'combi',
    ],
  },
  { slug: 'travel', words: ['flight', 'plane', 'avion', 'avión', 'vuelo', 'airline', 'aerolinea', 'aerolínea', 'pasaje', 'pasajes', 'despegar', 'booking'] },
  { slug: 'accommodation', words: ['hotel', 'airbnb', 'hostel', 'lodging', 'hospedaje', 'alojamiento'] },
  {
    slug: 'entertainment',
    words: [
      'movie', 'cinema', 'cine', 'pelicula', 'película', 'netflix', 'spotify', 'hbo', 'disney',
      'concierto', 'concert', 'recital', 'teatro', 'entrada', 'entradas',
      'game', 'games', 'juego', 'juegos', 'gaming', 'playstation', 'xbox',
    ],
  },
  {
    slug: 'sports',
    words: [
      'soccer', 'futbol', 'fútbol', 'football', 'gym', 'gimnasio', 'cancha', 'padel', 'pádel',
      'tenis', 'pileta', 'yoga', 'pilates', 'crossfit',
    ],
  },
  { slug: 'internet', words: ['internet', 'wifi', 'telefono', 'teléfono', 'celular', 'movistar', 'fibra'] },
  {
    slug: 'utilities',
    words: [
      'bill', 'factura', 'facturas', 'utilities', 'luz', 'electricidad', 'agua', 'water',
      'edenor', 'edesur', 'metrogas', 'aysa', 'abl',
    ],
  },
  { slug: 'housing', words: ['rent', 'alquiler', 'expensas', 'hipoteca', 'inmobiliaria'] },
  {
    slug: 'household',
    words: ['limpieza', 'detergente', 'ferreteria', 'ferretería', 'muebles', 'lavanderia', 'lavandería', 'tintoreria', 'tintorería'],
  },
  { slug: 'shopping', words: ['shopping', 'shop', 'tienda', 'ropa', 'clothes', 'clothing', 'zapatillas', 'mercadolibre', 'zara'] },
  {
    slug: 'food',
    words: [
      'food', 'eat', 'lunch', 'dinner', 'breakfast', 'meal', 'comida', 'almuerzo',
      'cena', 'desayuno', 'resto', 'restaurant', 'restaurante', 'burger', 'pizza', 'sushi',
      'delivery', 'rappi', 'pedidosya', 'empanadas', 'asado', 'parrilla', 'milanesa',
      'heladeria', 'heladería', 'helado',
    ],
  },
];

// Splits into lowercased word tokens (Unicode-aware, so accented letters
// stay part of a word instead of splitting on them). Matching whole tokens
// rather than raw substrings matters here — a substring check would let
// "bar" match inside "Bariloche" and misfile a flight as a bar tab.
function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// Best-effort category guess from a manually-typed description, to
// pre-select the category picker as a suggestion — never authoritative, the
// user can always override it. Returns null (no opinion) rather than
// DEFAULT_CATEGORY when nothing matches, so a caller can tell "no match"
// apart from "confidently other" and leave whatever's already selected alone.
export function guessCategory(description: string | undefined | null): CategorySlug | null {
  const lower = (description ?? '').toLowerCase();
  if (!lower.trim()) return null;
  const tokens = new Set(tokenize(lower));
  // A keyword with a space (e.g. "obra social") is a phrase — tokens are
  // single words, so those are matched as a substring of the raw text
  // instead; every other keyword matches only as a whole token, so "bar"
  // can't match inside "Bariloche".
  const matches = (w: string) => (w.includes(' ') ? lower.includes(w) : tokens.has(w));
  for (const { slug, words } of CATEGORY_KEYWORDS) {
    if (words.some(matches)) return slug;
  }
  return null;
}
