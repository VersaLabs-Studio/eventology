import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { buildIcsFromEvents, type IcsEventSource } from '@/lib/calendar/build-ics';

/**
 * GET /api/public/calendar/[token] — live ICS subscribe feed (HO-K).
 *
 * Tier: PUBLIC (calendar clients cannot send auth headers) — the opaque
 * token IS the credential (LOCKED). Resolution order:
 *
 *   1. SERVICE-role read of `calendar_feed_tokens` by token — the ONLY
 *      permitted service-role use in this package (constraint). RLS on the
 *      table would hide the row from an anon-feeling request, and the
 *      token lookup must work without a user session.
 *   2. revoked row → 410 Gone (rotation invalidates immediately).
 *   3. unknown token → 404 (no enumeration hint beyond that).
 *   4. `createAuthedClient(profileId)` for the DATA reads — RLS still
 *      scopes the events to that user. The token never appears in any
 *      response, and the URL carries no identity (verified: token is
 *      32 random bytes, base64url).
 *
 * Response is `text/calendar` with no-store — subscribing clients re-poll
 * and see new registrations appear (live-updating, not one-off).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || token.length < 20) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Feed not found' } },
      { status: 404 }
    );
  }

  const service = createServiceClient();

  // 1. Resolve token → profile (service role: the single sanctioned use).
  const { data: row } = await service
    .from('calendar_feed_tokens')
    .select('id, profile_id, kind, revoked')
    .eq('token', token)
    .maybeSingle();

  if (!row) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Feed not found' } },
      { status: 404 }
    );
  }
  const feed = row as { id: string; profile_id: string; kind: string; revoked: boolean };

  // 2. Rotated/revoked tokens die immediately.
  if (feed.revoked) {
    return NextResponse.json(
      { error: { code: 'GONE', message: 'This feed has been revoked — create a new one in settings' } },
      { status: 410 }
    );
  }

  // 4. Data reads under the FEED OWNER's identity — RLS applies throughout.
  const authed = await createAuthedClient(feed.profile_id);

  let rows: IcsEventSource[];

  if (feed.kind === 'saved') {
    const { data, error } = await authed
      .from('saved_events')
      .select(`
        event:events (
          title, slug, description, short_description,
          start_date, end_date, venue_name, venue_address, location_type
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: 'Feed read failed' } },
        { status: 500 }
      );
    }
    rows = (data ?? [])
      .map((r) => (r as { event?: unknown }).event)
      .filter((e): e is IcsEventSource => e != null);
  } else {
    // 'my_events' — same semantics as the existing one-off download:
    // non-cancelled registrations, event joined.
    const { data, error } = await authed
      .from('registrations')
      .select(`
        status,
        event:events (
          title, slug, description, short_description,
          start_date, end_date, venue_name, venue_address, location_type
        )
      `)
      .neq('status', 'cancelled')
      .limit(500);

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: 'Feed read failed' } },
        { status: 500 }
      );
    }
    rows = (data ?? [])
      .map((r) => (r as { event?: unknown }).event)
      .filter((e): e is IcsEventSource => e != null);
  }

  const { value, error: icsError } = buildIcsFromEvents(rows);
  if (icsError || value === undefined) {
    return NextResponse.json(
      { error: { code: 'CALENDAR_ERROR', message: 'Feed generation failed' } },
      { status: 500 }
    );
  }

  return new NextResponse(value, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="eventology-${feed.kind}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
