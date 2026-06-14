import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEvents, EventAttributes } from 'ics';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/public/events/[slug]/calendar
 * Returns a single-event ICS file for the event (public access).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch approved event by slug with all required fields
  const { data: event, error } = await supabase
    .from('events')
    .select(`
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
    `)
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (error || !event) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

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
  const fullDesc = `${desc}\n\nEvent Link: ${url}`;

  const eventAttrs: EventAttributes = {
    start,
    end,
    title: event.title,
    description: fullDesc,
    location,
    url,
    uid: `${event.id}@eventology.app`,
    startInputType: 'utc',
    startOutputType: 'utc',
    alarms: [{ trigger: { minutes: 15, before: true } }],
  };

  const { error: icsError, value } = createEvents([eventAttrs]);

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
      'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
    },
  });
}