// ============================================================================
// GET /api/protected/admin/events
//   List ALL events (any status) for admin management. Distinct from
//   /api/protected/admin/events/pending (which is scoped to the approval
//   queue). Supports:
//     - search:  title / description / short_description / venue_name (ilike)
//     - status:  optional status filter; if absent, lists every event
//     - page/limit: pagination
//   Uses the service-role client (admin) + joins organizer + category, and
//   returns per-status counts in meta for the dashboard stat cards.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute } from '@/lib/api/admin-guard';
import { escapeSearchTerm } from '@/lib/api/list-handler';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

export interface AdminEventRow {
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
  sub_city: string | null;
  registrations_count: number;
  created_at: string;
  // Joins
  organizer: { id: string; name: string; slug: string; is_verified: boolean } | null;
  category: { id: string; name: string; slug: string; color: string } | null;
}

export interface AdminEventsMeta {
  total: number;
  page: number;
  limit: number;
  counts: {
    all: number;
    approved: number;
    pending: number;
    draft: number;
    rejected: number;
    cancelled: number;
    featured: number;
  };
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { service } = guard;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 12)));
  const status = searchParams.get('status')?.trim() ?? '';
  const search = searchParams.get('search')?.trim() ?? '';
  const offset = (page - 1) * limit;

  let q = service
    .from('events')
    .select(
      `
      id, slug, title, short_description, description, banner_image,
      status, rejection_reason, is_featured, start_date, end_date,
      event_type, ticket_type, venue_name, sub_city, registrations_count, created_at,
      organizer:organizers!events_organizer_id_fkey(id, name, slug, is_verified),
      category:categories!events_category_id_fkey(id, name, slug, color)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'all') {
    q = q.eq('status', status as AdminEventRow['status']);
  }

  // PostgREST .or() uses * (not %) as the wildcard. Escape the chars that
  // break the filter syntax (commas, parens, asterisks).
  if (search) {
    const escaped = escapeSearchTerm(search);
    q = q.or(
      `title.ilike.*${escaped}*,description.ilike.*${escaped}*,short_description.ilike.*${escaped}*,venue_name.ilike.*${escaped}*`
    );
  }

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Per-status counts for the dashboard stat cards (parallel head counts).
  const [cAll, cApproved, cPending, cDraft, cRejected, cCancelled, cFeatured] = await Promise.all([
    service.from('events').select('*', { count: 'exact', head: true }),
    service.from('events').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    service.from('events').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('events').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    service.from('events').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    service.from('events').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    service.from('events').select('*', { count: 'exact', head: true }).eq('is_featured', true),
  ]);

  const rows: AdminEventRow[] = (data ?? []).map((r) => {
    const o = Array.isArray(r.organizer) ? r.organizer[0] : r.organizer;
    const c = Array.isArray(r.category) ? r.category[0] : r.category;
    return { ...(r as unknown as Omit<AdminEventRow, 'organizer' | 'category'>), organizer: o, category: c };
  });

  const meta: AdminEventsMeta = {
    total: count ?? 0,
    page,
    limit,
    counts: {
      all: cAll.count ?? 0,
      approved: cApproved.count ?? 0,
      pending: cPending.count ?? 0,
      draft: cDraft.count ?? 0,
      rejected: cRejected.count ?? 0,
      cancelled: cCancelled.count ?? 0,
      featured: cFeatured.count ?? 0,
    },
  };

  return NextResponse.json({
    data: rows,
    meta,
  } satisfies ListEnvelope<AdminEventRow>);
}
