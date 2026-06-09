import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createEvents, EventAttributes } from 'ics';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/calendar
 * Returns a multi-VEVENT ICS file for the caller's registered events.
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
        venue_address
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

  const events: EventAttributes[] = [];

  for (const reg of registrations ?? []) {
    const event = reg.event as any;
    if (!event) continue;

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    const start: [number, number, number, number, number] = [
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      startDate.getUTCDate(),
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
    ];

    const end: [number, number, number, number, number] = [
      endDate.getUTCFullYear(),
      endDate.getUTCMonth() + 1,
      endDate.getUTCDate(),
      endDate.getUTCHours(),
      endDate.getUTCMinutes(),
    ];

    const location = event.venue_name
      ? (event.venue_address ? `${event.venue_name}, ${event.venue_address}` : event.venue_name)
      : (event.venue_address || 'Online');

    const desc = event.short_description || event.description?.replace(/<[^>]*>/g, '') || '';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/events/${event.slug}`;

    events.push({
      start,
      end,
      title: event.title,
      description: desc,
      location,
      url,
      startInputType: 'utc',
      startOutputType: 'utc',
    });
  }

  const { error: icsError, value } = createEvents(events);

  if (icsError) {
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
