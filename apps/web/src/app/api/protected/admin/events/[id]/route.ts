// ============================================================================
// GET /api/protected/admin/events/[id]
//   Single-event detail for admin (any status, any organizer). Uses the
//   service-role client so admins can inspect events they don't own.
//   Returns the event with joined organizer, category, and ticket tiers.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute } from '@/lib/api/admin-guard';
import type { ErrorEnvelope } from '@/lib/api';

export interface AdminEventDetail {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  banner_image: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejection_reason: string | null;
  is_featured: boolean;
  featured_until: string | null;
  start_date: string;
  end_date: string;
  event_type: string;
  ticket_type: 'free' | 'paid';
  venue_name: string | null;
  venue_address: string | null;
  sub_city: string | null;
  capacity: number;
  registrations_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  organizer: {
    id: string;
    name: string;
    slug: string;
    is_verified: boolean;
    avatar_url: string | null;
  } | null;
  category: { id: string; name: string; slug: string; color: string; icon: string | null } | null;
  ticket_tiers: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    capacity: number;
    sold_count: number;
  }>;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const guard = await requireAdminRoute(_req);
  if (!guard.ok) return guard.response;
  const { service } = guard;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_ID', message: 'Event id is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { data, error } = await service
    .from('events')
    .select(
      `
      id, slug, title, short_description, description, banner_image,
      status, rejection_reason, is_featured, featured_until,
      start_date, end_date, event_type, ticket_type,
      venue_name, venue_address, sub_city, capacity,
      registrations_count, views_count, created_at, updated_at,
      organizer:organizers!events_organizer_id_fkey(id, name, slug, is_verified, avatar_url),
      category:categories!events_category_id_fkey(id, name, slug, color, icon),
      ticket_tiers(id, name, price, currency, capacity, sold_count)
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const o = Array.isArray(data.organizer) ? data.organizer[0] : data.organizer;
  const c = Array.isArray(data.category) ? data.category[0] : data.category;

  const detail: AdminEventDetail = {
    ...(data as Omit<AdminEventDetail, 'organizer' | 'category' | 'ticket_tiers'>),
    organizer: o,
    category: c,
    ticket_tiers: (data.ticket_tiers as AdminEventDetail['ticket_tiers']) ?? [],
  };

  return NextResponse.json(detail);
}
