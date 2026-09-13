import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { buildIcsFromEvents, type IcsEventSource } from '@/lib/calendar/build-ics';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/calendar
 * Returns a multi-VEVENT ICS file for the caller's registered events.
 *
 * HO-K refactor: the event→VEVENT mapping now lives in lib/calendar/build-ics.ts,
 * shared with the tokenized subscribe feed (/api/public/calendar/[token]) —
 * no duplicated ICS logic. Response shape unchanged.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  // Fetch caller's non-cancelled registrations with event details
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      id,
      status,
      event:events (
        id,
        title,
        slug,
        description,
        short_description,
        start_date,
        end_date,
        timezone,
        venue_name,
        venue_address,
        location_type
      )
    `)
    .eq('user_id', session.user.id)
    .neq('status', 'cancelled');

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows = (registrations ?? [])
    .map((reg) => (reg as { event?: unknown }).event)
    .filter((e): e is IcsEventSource => e != null);

  const { value, error: icsError } = buildIcsFromEvents(rows);

  if (icsError || value === undefined) {
    return NextResponse.json(
      { error: { code: 'CALENDAR_ERROR', message: 'Failed to generate calendar file' } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return new NextResponse(value, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="my-events.ics"',
    },
  });
}
