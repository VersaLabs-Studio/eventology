import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/tickets/[id]
 * Returns a single ticket by ID.
 * RLS ensures only the owner or organizer can view.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing ticket id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Use authenticated client so RLS resolves auth.uid() to the profile UUID
  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      event:events(id, title, slug, banner_image, start_date, end_date, venue_name, category:categories(slug)),
      registration:registrations(id, attendee_name, attendee_email, ticket_tier_id, checked_in_at)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Ticket not found' } } satisfies ErrorEnvelope,
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
