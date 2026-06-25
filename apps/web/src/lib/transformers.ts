// ============================================================================
// API Response Transformers
// ============================================================================
// Maps Supabase API responses (snake_case, joined) to the app's display
// types (camelCase, nested). Used by hooks to bridge the shape gap.
//
// R3 / A3 fold-forward: introduced `normalizeEvent()` — the canonical
// single-source shape converter. R1/R2 call sites used to construct
// the display shape inline; new code should prefer `normalizeEvent`.
// `transformEvent` is kept as a thin alias for backward compat.
// ============================================================================

import type { Event, Category, Organizer, TicketTier } from '@/lib/types';

// ---------------------------------------------------------------------------
// Raw API shapes (what Supabase returns with joins)
// ---------------------------------------------------------------------------

interface RawCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface RawOrganizer {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string | null;
  avatar_url: string | null;
  bio: string | null;
  website?: string | null;
  is_verified: boolean;
  social_links?: Record<string, unknown> | null;
  events_count?: number;
  total_attendees?: number;
  created_at?: string;
}

interface RawTicketTier {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  capacity: number;
  sold_count: number;
  sort_order?: number;
}

interface RawEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  short_description: string | null;
  banner_image: string | null;
  gallery: string[] | null;
  event_type: string;
  ticket_type: string;
  tags: string[] | null;
  start_date: string;
  end_date: string;
  timezone: string;
  venue_name: string | null;
  venue_address: string | null;
  sub_city: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  is_featured: boolean;
  capacity: number;
  registrations_count: number;
  views_count: number;
  created_at: string;
  category: RawCategory | null;
  organizer: RawOrganizer | null;
  ticket_tiers: RawTicketTier[] | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Transformers
// ---------------------------------------------------------------------------

/**
 * Null-safe category transformer. When the embedded category is null
 * (e.g. RLS blocks the anon read for inactive categories), return a
 * neutral fallback so the UI never dereferences null.
 */
function transformCategory(raw: RawCategory | null | undefined): Category {
  if (!raw) {
    return { id: '', name: '', slug: '', icon: '', description: '', eventCount: 0, color: '' };
  }
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    icon: raw.icon,
    description: '',
    eventCount: 0,
    color: raw.color,
  };
}

/**
 * Null-safe organizer transformer. When the embedded organizer is null
 * (e.g. RLS blocks the anon read for unverified organizers), return a
 * neutral fallback so the UI never dereferences null.
 */
function transformOrganizer(raw: RawOrganizer | null | undefined): Organizer {
  if (!raw) {
    return {
      id: '', name: '', slug: '', email: '', phone: '', avatar: '',
      bio: '', verified: false, eventsCount: 0, totalAttendees: 0,
      joinedDate: '',
    };
  }
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    avatar: raw.avatar_url ?? '',
    bio: raw.bio ?? '',
    website: raw.website ?? undefined,
    verified: raw.is_verified,
    eventsCount: raw.events_count ?? 0,
    totalAttendees: raw.total_attendees ?? 0,
    joinedDate: raw.created_at ?? '',
    socialLinks: raw.social_links as Organizer['socialLinks'],
  };
}

function transformTicketTier(raw: RawTicketTier): TicketTier {
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    currency: raw.currency,
    capacity: raw.capacity,
    sold: raw.sold_count,
    description: raw.description ?? '',
  };
}

/**
 * Canonical event-shape normalizer. Every page that displays an
 * `Event` should pass the raw API response through this. The shape is
 * stable and can be re-used by both server and client components
 * (no React dependency). This is the single source of truth for the
 * snake_case → camelCase bridge.
 */
export function normalizeEvent(raw: RawEvent): Event {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description ?? '',
    shortDescription: raw.short_description ?? '',
    category: transformCategory(raw.category),
    type: raw.event_type as Event['type'],
    status: raw.status as Event['status'],
    date: raw.start_date,
    endDate: raw.end_date,
    time: formatTime(raw.start_date),
    endTime: formatTime(raw.end_date),
    location: raw.venue_name ?? 'Venue TBA',
    address: raw.venue_address ?? '',
    subCity: raw.sub_city ?? '',
    coordinates: {
      lat: raw.latitude ?? 0,
      lng: raw.longitude ?? 0,
    },
    bannerImage: raw.banner_image ?? '/images/placeholders/event.svg',
    gallery: raw.gallery ?? [],
    organizer: transformOrganizer(raw.organizer),
    ticketTiers: raw.ticket_tiers ? raw.ticket_tiers.map(transformTicketTier) : [],
    ticketType: raw.ticket_type as Event['ticketType'],
    tags: raw.tags ?? [],
    isFeatured: raw.is_featured,
    views: raw.views_count,
    registrations: raw.registrations_count,
    capacity: raw.capacity,
    createdAt: raw.created_at,
  };
}

export function transformEvent(raw: RawEvent): Event {
  return normalizeEvent(raw);
}
