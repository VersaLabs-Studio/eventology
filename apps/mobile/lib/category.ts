// ============================================================================
// Category presentation — colour + icon
// ============================================================================
// `categories.color` in Postgres stores a *Tailwind utility class* ("bg-blue-500",
// "bg-primary"), because the web renders it straight into className. Native has
// no Tailwind, so the mobile card was doing `${event.category.color}22` and
// producing the string "bg-blue-50022" — not a colour. React Native silently
// drops unparseable colours, which is why category pills rendered transparent.
//
// This module is the single translation point from that class to a real hex.
// It accepts the class, the category slug, or nothing, and always returns a
// usable colour.
// ============================================================================

import type { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Tailwind utility class → hex. Mirrors the palette Tailwind ships. */
const CLASS_TO_HEX: Record<string, string> = {
  'bg-primary': colors.primary,
  'bg-secondary': colors.secondary,
  'bg-accent': colors.accent,
  'bg-blue-500': '#3B82F6',
  'bg-purple-500': '#A855F7',
  'bg-rose-500': '#F43F5E',
  'bg-amber-500': '#F59E0B',
  'bg-pink-500': '#EC4899',
  'bg-orange-500': '#F97316',
  'bg-green-500': '#22C55E',
  'bg-teal-500': '#14B8A6',
  'bg-red-500': '#EF4444',
  'bg-indigo-500': '#6366F1',
};

/** Category slug → hex, used when `color` is absent or unrecognised. */
const SLUG_TO_HEX: Record<string, string> = {
  tech: '#3B82F6',
  business: colors.primary,
  arts: '#A855F7',
  health: '#F43F5E',
  education: '#F59E0B',
  music: '#EC4899',
  food: '#F97316',
  community: colors.secondary,
};

const SLUG_TO_ICON: Record<string, IoniconName> = {
  tech: 'hardware-chip-outline',
  business: 'briefcase-outline',
  arts: 'color-palette-outline',
  health: 'heart-outline',
  education: 'school-outline',
  music: 'musical-notes-outline',
  food: 'restaurant-outline',
  community: 'people-outline',
};

export interface CategoryLike {
  slug?: string | null;
  color?: string | null;
}

/** Always returns a real hex — falls back to brand emerald. */
export function categoryColor(category?: CategoryLike | null): string {
  if (!category) return colors.primary;

  const raw = category.color?.trim();
  if (raw) {
    // Already a hex or rgb() the API may start returning later — pass through.
    if (raw.startsWith('#') || raw.startsWith('rgb')) return raw;
    const mapped = CLASS_TO_HEX[raw];
    if (mapped) return mapped;
  }

  const bySlug = category.slug ? SLUG_TO_HEX[category.slug] : undefined;
  return bySlug ?? colors.primary;
}

export function categoryIcon(slug?: string | null): IoniconName {
  return (slug && SLUG_TO_ICON[slug]) || 'calendar-outline';
}

/**
 * Translucent tint + border derived from the category colour, for pills drawn
 * over arbitrary backgrounds. Hex-with-alpha is valid in React Native.
 */
export function categoryTint(category?: CategoryLike | null): { bg: string; border: string; fg: string } {
  const base = categoryColor(category);
  // Appending an alpha pair only parses for #rrggbb. A passed-through rgb()
  // would become garbage, so fall back to a flat tint in that case.
  const isHex6 = /^#[0-9a-f]{6}$/i.test(base);
  return isHex6
    ? { bg: `${base}22`, border: `${base}59`, fg: base }
    : { bg: 'transparent', border: base, fg: base };
}
