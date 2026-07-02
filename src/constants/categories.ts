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
