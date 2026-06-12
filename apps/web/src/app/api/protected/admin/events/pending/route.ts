// ============================================================================
// GET /api/protected/admin/events/pending
//   List events awaiting approval (status='pending').
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute } from '@/lib/api/admin-guard';
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

export async function GET(req: NextRequest) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { service } = guard;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));
  const status = searchParams.get('status')?.trim() ?? '';
  const offset = (page - 1) * limit;

  let q = service
    .from('events')
    .select(`
      id, slug, title, short_description, description, banner_image,
      status, rejection_reason, is_featured, start_date, end_date,
      event_type, ticket_type, venue_name, sub_city, registrations_count, created_at,
      organizer:organizers!events_organizer_id_fkey(id, name, slug, is_verified),
      category:categories!events_category_id_fkey(id, name, slug, color)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'all') {
    q = q.eq('status', status as 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled');
  } else {
    // Default: pending (admin queue)
    q = q.eq('status', 'pending');
  }

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows: AdminEventRow[] = (data ?? []).map((r) => {
    const o = Array.isArray(r.organizer) ? r.organizer[0] : r.organizer;
    const c = Array.isArray(r.category) ? r.category[0] : r.category;
    return { ...(r as Omit<AdminEventRow, 'organizer' | 'category'>), organizer: o, category: c };
  });

  return NextResponse.json({
    data: rows,
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<AdminEventRow>);
}
