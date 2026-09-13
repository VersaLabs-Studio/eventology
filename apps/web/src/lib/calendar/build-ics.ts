// ============================================================================
// Calendar ICS Builder (HO-K)
// ============================================================================
// Extracted from the EXISTING /api/protected/calendar route so both the
// one-off download and the HO-K tokenized subscribe feed share ONE
// event→VEVENT mapping (package constraint: no duplicated logic).
//
// Input is the projection the callers select from `registrations.event` /
// `saved_events.event` — kept deliberately minimal and ICS-oriented.
// ============================================================================

import { createEvents, EventAttributes } from 'ics';

export interface IcsEventSource {
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  start_date: string;
  end_date: string;
  venue_name: string | null;
  venue_address: string | null;
  location_type?: string | null; // 046: 'in_person' | 'online' | 'hybrid'
}

/** UTC tuple the `ics` package expects: [Y, M, D, H, Min]. */
function utcTuple(date: Date): [number, number, number, number, number] {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

/** Minimal valid VCALENDAR for the empty case — calendar clients reject
 *  0-byte subscriptions, and an empty feed must stay subscribable. */
const EMPTY_CALENDAR = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Eventology//EN',
  'CALSCALE:GREGORIAN',
  'END:VCALENDAR',
].join('\r\n');

/**
 * Builds a multi-VEVENT ICS document from event rows.
 * Returns `{ value }` on success or `{ error }` if the ics package rejects
 * the input (caller maps to its own error response).
 */
export function buildIcsFromEvents(
  rows: IcsEventSource[]
): { value?: string; error?: string } {
  const events: EventAttributes[] = [];

  for (const event of rows) {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) continue;

    // Virtual events have no physical location (046); label them honestly.
    const location =
      event.location_type === 'online'
        ? 'Online'
        : event.venue_name
          ? event.venue_address
            ? `${event.venue_name}, ${event.venue_address}`
            : event.venue_name
          : (event.venue_address || 'Online');

    const desc =
      event.short_description || event.description?.replace(/<[^>]*>/g, '') || '';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eventology.app';

    events.push({
      start: utcTuple(startDate),
      end: utcTuple(endDate),
      title: event.title,
      description: desc,
      location,
      url: `${baseUrl}/events/${event.slug}`,
      startInputType: 'utc',
      startOutputType: 'utc',
    });
  }

  if (events.length === 0) {
    return { value: EMPTY_CALENDAR };
  }

  const { error, value } = createEvents(events);
  if (error) return { error: error.message ?? 'Failed to generate calendar' };
  return { value: value ?? undefined };
}
