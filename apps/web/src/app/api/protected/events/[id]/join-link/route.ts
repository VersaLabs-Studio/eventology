import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/events/[id]/join-link — the gated stream/meeting URL
 * for virtual & hybrid events (HO-I).
 *
 * Reveal policy (LOCKED): the URL is served ONLY to confirmed attendees
 * (status='confirmed' registration) and event hosts. Everyone else —
 * including any authed user — gets 403. The URL never appears in public
 * payloads (all public/protected event surfaces run through the
 * stripOnlineUrl sanitizer).
 *
 * Provider and timing: returned for confirmed attendees regardless of
 * event status (a test stream / early join room is the host's choice);
 * hosts always get the URL for configuration.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
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

  const supabase = await createAuthedClient(session.user.id);

  // Hosts pass unconditionally (they configure the URL).
  const { data: isHost } = await supabase.rpc('fn_is_event_host', {
    p_event_id: id,
    p_user: session.user.id,
  });

  if (isHost !== true) {
    // Confirmed-attendee gate — direct ownership read (spec allows
    // "fn_attended (or confirmed registration)"; we read registrations
    // directly. NOTE: 043's fn_attended references registrations.profile_id,
    // a column that doesn't exist (owner is user_id) — using it here would
    // 500; the direct read is the safe, correct gate.
    const { data: reg, error: regError } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', session.user.id)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (regError) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: regError.message } } satisfies ErrorEnvelope,
        { status: 500 }
      );
    }
    if (!reg) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Join link is available to confirmed attendees only' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('id, location_type, online_url, online_provider')
    .eq('id', id)
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status }
    );
  }

  const row = event as {
    id: string;
    location_type: string;
    online_url: string | null;
    online_provider: string | null;
  };

  if (row.location_type === 'in_person' || !row.online_url) {
    return NextResponse.json(
      { error: { code: 'NO_ONLINE_URL', message: 'This event has no online join link' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      url: row.online_url,
      provider: row.online_provider ?? 'custom',
      location_type: row.location_type,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
