import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/events/[id]/registrations
 * Returns all registrations for a specific event.
 * RLS enforces that only the event organizer can see all registrations.
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
      { error: { code: 'MISSING_PARAM', message: 'Missing event id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Use authenticated client so RLS resolves auth.uid() to the profile UUID
  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id, event_id, user_id, ticket_tier_id, attendee_name, attendee_email,
      attendee_phone, status, created_at, checked_in_at,
      ticket_tier:ticket_tiers(name, price, currency),
      ticket:tickets(id, ticket_number, status, used_at)
    `)
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    // Map RLS denial to 403
    if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not authorized to view registrations for this event' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [], meta: { total: data?.length ?? 0 } });
}
