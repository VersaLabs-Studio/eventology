import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * GET /api/protected/tickets
 * Returns the current user's tickets.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  // Use authenticated client so RLS resolves auth.uid() to the profile UUID
  const supabase = await createAuthedClient(session.user.id);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const status = searchParams.get('status')?.trim() ?? '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('tickets')
    .select(`
      *,
      event:events(id, title, slug, banner_image, start_date, end_date, venue_name, category:categories(slug)),
      registration:registrations(id, attendee_name, attendee_email, ticket_tier_id)
    `, { count: 'exact' })
    .order('issued_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Status filter
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<unknown>);
}
