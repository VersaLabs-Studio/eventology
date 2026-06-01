/**
 * Eventology Mobile — Public Type Surface
 * Re-exports the canonical entity types from `mock-data` and adds
 * derived view-model types used across the app. Screens and
 * components should import from this module — never from
 * `mock-data` directly — so the data layer can be swapped (e.g.
 * for a real API) without touching call sites.
 */

import type { MockUser, MockTicket } from "./mock-data";

export type {
  Category,
  Organizer,
  Event,
  EventStatus,
  EventType,
  TicketType,
  TicketTier,
  MockUser,
  MockTicket,
} from "./mock-data";

/** Canonical user alias — matches the rest of the app's naming. */
export type User = MockUser;

/** Canonical ticket alias — matches the rest of the app's naming. */
export type Ticket = MockTicket;

/**
 * Event enriched with precomputed flags used by cards, filters,
 * and the sort pipeline. Callers should build this once (e.g. via
 * `useMemo`) rather than recomputing on every render.
 */
export interface EventWithComputed extends Event {
  /** True if the event's end date is in the future. */
  isUpcoming: boolean;
  /** Mirrors `Event.isFeatured` — duplicated for ergonomic access. */
  isFeatured: boolean;
  /** True when the event has no paid ticket tiers. */
  isFree: boolean;
  /** Lowest tier price in ETB (0 for free events). */
  lowPriceETB: number;
}

/** Sort modes exposed by the discover screen. */
export type SortOption = "trending" | "upcoming" | "free" | "paid";

/** Tabs on the tickets screen. */
export type TicketTab = "upcoming" | "past" | "all";
