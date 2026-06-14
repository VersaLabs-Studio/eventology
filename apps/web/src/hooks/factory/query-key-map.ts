'use client';

import { EventKeys, OrganizerKeys, CategoryKeys, VenueKeys, RegistrationKeys, TicketKeys, TicketTierKeys, PaymentKeys, ReviewKeys } from '@eventology/config';

// ---------------------------------------------------------------------------
// Query key resolver — maps entity key to its query key factory
// ---------------------------------------------------------------------------

export const QUERY_KEY_MAP: Record<string, { all: () => readonly unknown[]; list: (opts?: object) => readonly unknown[]; doc: (id: string) => readonly unknown[] }> = {
  events: EventKeys,
  organizers: OrganizerKeys,
  categories: CategoryKeys,
  venues: VenueKeys,
  registrations: RegistrationKeys,
  tickets: TicketKeys,
  ticket_tiers: TicketTierKeys,
  payments: PaymentKeys,
  reviews: ReviewKeys,
};
