// ============================================================================
// Event JSON-LD — schema.org Event structured data (HO-K)
// ============================================================================
// Pure function: event row → schema.org JSON. Emitted by the event detail
// SERVER component (page source is the machine-readable surface).
//
// SECURITY (HO-I interplay): the 046 `online_url` is NEVER placed in JSON-LD
// — it would leak the gated join URL into public page source. Virtual
// events get a `VirtualLocation` with a name only; the join URL itself
// stays behind the gated join-link endpoint.
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://eventology.app';

export interface JsonLdEventSource {
  slug: string;
  title: string;
  description: string | null;
  short_description: string | null;
  banner_image: string | null;
  start_date: string;
  end_date: string;
  location_type: string | null; // 046: 'in_person' | 'online' | 'hybrid'
  venue_name: string | null;
  venue_address: string | null;
  sub_city?: string | null;
  ticket_tiers?: Array<{ name: string; price: number; currency: string }> | null;
  organizer?: { name: string } | { name: string }[] | null;
}

/** schema.org attendance mode per the 046 location_type. */
function attendanceMode(locationType: string | null): string {
  switch (locationType) {
    case 'online':
      return 'https://schema.org/OnlineEventAttendanceMode';
    case 'hybrid':
      return 'https://schema.org/MixedEventAttendanceMode';
    default:
      return 'https://schema.org/OfflineEventAttendanceMode';
  }
}

function place(v: JsonLdEventSource): Record<string, unknown> {
  return {
    '@type': 'Place',
    name: v.venue_name ?? 'Venue TBA',
    ...(v.venue_address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: v.venue_address,
            addressLocality: v.sub_city || 'Addis Ababa',
            addressCountry: 'ET',
          },
        }
      : {}),
  };
}

/** VirtualLocation WITHOUT the gated URL — see the security note above. */
function virtualLocation(): Record<string, unknown> {
  return { '@type': 'VirtualLocation', name: 'Online event' };
}

function location(v: JsonLdEventSource): Record<string, unknown> | Record<string, unknown>[] {
  switch (v.location_type) {
    case 'online':
      return virtualLocation();
    case 'hybrid':
      return [place(v), virtualLocation()];
    default:
      return place(v);
  }
}

function organizer(v: JsonLdEventSource): Record<string, unknown> | null {
  const org = Array.isArray(v.organizer) ? v.organizer[0] : v.organizer;
  if (!org?.name) return null;
  return { '@type': 'Organization', name: org.name };
}

/**
 * Builds the schema.org `Event` JSON-LD object, or null when the row lacks
 * the minimum required fields (callers skip emitting the script tag).
 */
export function buildEventJsonLd(v: JsonLdEventSource): Record<string, unknown> | null {
  if (!v.title || !v.start_date || !v.end_date) return null;

  const url = `${BASE_URL}/events/${v.slug}`;

  const offers =
    v.ticket_tiers && v.ticket_tiers.length > 0
      ? v.ticket_tiers.map((tier) => ({
          '@type': 'Offer',
          name: tier.name,
          price: tier.price,
          priceCurrency: tier.currency,
          url,
          availability: 'https://schema.org/InStock',
        }))
      : [
          {
            '@type': 'Offer',
            name: 'Admission',
            price: 0,
            priceCurrency: 'ETB',
            url,
            availability: 'https://schema.org/InStock',
          },
        ];

  const org = organizer(v);

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: v.title,
    startDate: new Date(v.start_date).toISOString(),
    endDate: new Date(v.end_date).toISOString(),
    eventAttendanceMode: attendanceMode(v.location_type),
    eventStatus: 'https://schema.org/EventScheduled',
    location: location(v),
    url,
    ...(v.description || v.short_description
      ? {
          description:
            (v.short_description ?? '') ||
            (v.description ?? '').replace(/<[^>]*>/g, '').slice(0, 500),
        }
      : {}),
    ...(v.banner_image ? { image: [v.banner_image] } : {}),
    offers,
    ...(org ? { organizer: org } : {}),
  };
}
