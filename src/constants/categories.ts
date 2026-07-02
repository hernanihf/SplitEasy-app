import { expenseEmoji } from '@/constants/design';

// The fixed expense category list, mirroring the backend's
// domain.ExpenseCategorySlugs (same slugs, same order). The backend stores
// and validates the slug; the emoji here and the localized names in i18n
// (`categories.<slug>`) are the frontend's half of the model.
export const CATEGORIES = [
  { slug: 'food', emoji: '🍽️' },
  { slug: 'groceries', emoji: '🛒' },
  { slug: 'coffee', emoji: '☕' },
  { slug: 'drinks', emoji: '🍻' },
  { slug: 'transport', emoji: '🚕' },
  { slug: 'fuel', emoji: '⛽' },
  { slug: 'travel', emoji: '✈️' },
  { slug: 'accommodation', emoji: '🏨' },
  { slug: 'housing', emoji: '🏠' },
  { slug: 'utilities', emoji: '💡' },
  { slug: 'internet', emoji: '📱' },
  { slug: 'entertainment', emoji: '🎬' },
  { slug: 'sports', emoji: '⚽' },
  { slug: 'shopping', emoji: '🛍️' },
  { slug: 'health', emoji: '💊' },
  { slug: 'education', emoji: '🎓' },
  { slug: 'gifts', emoji: '🎁' },
  { slug: 'pets', emoji: '🐾' },
  { slug: 'household', emoji: '🧹' },
  { slug: 'other', emoji: '📦' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const DEFAULT_CATEGORY: CategorySlug = 'other';

const EMOJI_BY_SLUG: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.emoji]),
);

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
