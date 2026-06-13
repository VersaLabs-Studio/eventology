// ============================================================================
// GET  /api/protected/events
//   List the caller's organizer events (any status). Used by the organizer
//   dashboard / "My Events" page where drafts and pending are visible.
//   RLS `Events: organizer read own` self-enforces ownership — non-owner
//   rows are silently filtered out.
//
//   Note: this route is distinct from `/api/public/events` (which returns
//   only approved events to anyone). The public endpoint is used by the
//   home rail + catalog; this one is used by `useMyOrganizerEvents`.
//
// POST /api/protected/events — handled by createCreateHandler('events', …)
//   as exported below. Stays in the same file so the path is single-sourced.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createCreateHandler } from '@/lib/api';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createEventSchema } from '@eventology/schemas';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

export interface MyEventRow {
  id: string;
  slug: string;
  title: string;
  banner_image: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  start_date: string;
  end_date: string;
  event_type: string;
  ticket_type: 'free' | 'paid';
  capacity: number;
  registrations_count: number;
  views_count: number;
  is_featured: boolean;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  // Resolve the caller's organizer id (may be null for attendee-only users)
  const { data: org } = await supabase
    .from('organizers')
    .select('id')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (!org) {
    return NextResponse.json({
      data: [],
      meta: { total: 0, page: 1, limit: 0 },
    } satisfies ListEnvelope<MyEventRow>);
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));
  const status = searchParams.get('status')?.trim() ?? '';
  const offset = (page - 1) * limit;

  let q = supabase
    .from('events')
    .select(`
      id, slug, title, banner_image, status, start_date, end_date,
      event_type, ticket_type, capacity, registrations_count, views_count,
      is_featured, created_at
    `, { count: 'exact' })
    .eq('organizer_id', org.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'all') {
    q = q.eq('status', status as MyEventRow['status']);
  }

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: (data ?? []) as MyEventRow[],
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<MyEventRow>);
}

export const POST = createCreateHandler('events', createEventSchema);
