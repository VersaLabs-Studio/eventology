/**
 * Eventology Mobile — App-Wide Constants
 * Static enumerations consumed by filter chips, sort menus, and
 * the tickets tabs. Values are derived from the data layer
 * (`mock-data` categories) and from the view-model types
 * (`lib/types`) so adding a sort mode or tab is a single-file change.
 */

import { categories } from "./mock-data";
import type { SortOption, TicketTab } from "./types";

/**
 * Cities surfaced in the discover / search filters.
 * Order is intentional (capital first, then major regional hubs).
 */
export const CITIES = [
  "Addis Ababa",
  "Dire Dawa",
  "Hawassa",
  "Bahir Dar",
  "Adama",
  "Mekelle",
] as const;

export type City = (typeof CITIES)[number];

/** Label/value pair used by the sort selector. */
export interface SortOptionMeta {
  value: SortOption;
  label: string;
}

export const SORT_OPTIONS: readonly SortOptionMeta[] = [
  { value: "trending", label: "Trending" },
  { value: "upcoming", label: "Upcoming" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;

/** Label/value pair used by the tickets tabs. */
export interface TicketTabMeta {
  value: TicketTab;
  label: string;
}

export const TICKET_TABS: readonly TicketTabMeta[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
] as const;

/**
 * Category list re-exported for filter UIs. We don't deep-clone —
 * the array is `as const`-like in `mock-data` and is safe to share
 * by reference.
 */
export const FILTER_CATEGORIES = categories;

/** Persisted store key for `use-store`. Bumping the suffix invalidates storage. */
export const STORE_KEY = "eventology-mobile-store-v1" as const;

/** Default caps for store collections. */
export const STORE_LIMITS = {
  recentSearches: 10,
  viewHistory: 20,
} as const;
