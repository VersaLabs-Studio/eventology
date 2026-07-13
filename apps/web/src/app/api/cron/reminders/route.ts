import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAuthorizedCron } from '@/lib/cron';

/**
 * GET /api/cron/reminders — Reminder Agent (Part 2 §6.2)
 *
 * Notifies confirmed attendees of events starting soon. Two windows: 24h and
 * 1h. Idempotent — a reminder is only inserted if one with the same
 * (event, user, window) doesn't already exist, so re-running (any cron cadence)
 * never double-notifies.
 */
export const dynamic = 'force-dynamic';

interface EventRow {
  id: string;
  title: string;
  start_date: string;
}

async function runWindow(
  supabase: ReturnType<typeof createServiceClient>,
  windowKey: '24h' | '1h',
  hours: number
): Promise<number> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + hours * 3_600_000);

  const { data: events } = await supabase
    .from('events')
    .select('id, title, start_date')
    .eq('status', 'approved')
    .gte('start_date', now.toISOString())
    .lte('start_date', cutoff.toISOString());

  const rows = (events ?? []) as EventRow[];
  if (rows.length === 0) return 0;

  const eventIds = rows.map((e) => e.id);

  // Which (event,user) already got a reminder for this window?
  const { data: existing } = await supabase
    .from('notifications')
    .select('user_id, reference_id, metadata')
    .eq('type', 'event_reminder')
    .in('reference_id', eventIds);

  const already = new Set(
    (existing ?? [])
      .filter((n) => (n as { metadata?: { window?: string } }).metadata?.window === windowKey)
      .map((n) => `${(n as { reference_id: string }).reference_id}:${(n as { user_id: string }).user_id}`)
  );

  const { data: regs } = await supabase
    .from('registrations')
    .select('user_id, event_id')
    .in('event_id', eventIds)
    .eq('status', 'confirmed');

  const titleById = new Map(rows.map((e) => [e.id, e.title]));

  const inserts = (regs ?? [])
    .filter((r) => !already.has(`${(r as { event_id: string }).event_id}:${(r as { user_id: string }).user_id}`))
    .map((r) => {
      const eventId = (r as { event_id: string }).event_id;
      const title = titleById.get(eventId) ?? 'Your event';
      return {
        user_id: (r as { user_id: string }).user_id,
        type: 'event_reminder' as const,
        title: windowKey === '1h' ? `Starting soon: ${title}` : `Tomorrow: ${title}`,
        message:
          windowKey === '1h'
            ? `${title} starts within the hour. See you there!`
            : `${title} starts within 24 hours. Get your ticket ready.`,
        action_url: `/events`,
        reference_type: 'event',
        reference_id: eventId,
        metadata: { window: windowKey },
      };
    });

  if (inserts.length === 0) return 0;
  await supabase.from('notifications').insert(inserts);
  return inserts.length;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } }, { status: 401 });
  }
  const supabase = createServiceClient();
  const sent24 = await runWindow(supabase, '24h', 24);
  const sent1 = await runWindow(supabase, '1h', 1);
  return NextResponse.json({ ok: true, sent: { '24h': sent24, '1h': sent1 } });
}
