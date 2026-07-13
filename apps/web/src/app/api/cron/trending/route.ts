import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAuthorizedCron } from '@/lib/cron';

/**
 * GET /api/cron/trending — Trending Detection Agent (Part 2 §5.15 / §6.2)
 *
 * Ranks approved, upcoming, not-yet-featured events by registration velocity
 * over the last 24h and suggests the top few for featuring — surfaced to admins
 * as a notification (deduped per UTC day) and returned as JSON. Editorial
 * featuring stays a human action; this only *suggests*.
 */
export const dynamic = 'force-dynamic';

const VELOCITY_THRESHOLD = 5; // registrations in 24h to be considered trending
const TOP_N = 5;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } }, { status: 401 });
  }
  const supabase = createServiceClient();
  const now = new Date();
  const since = new Date(now.getTime() - 86_400_000).toISOString();

  // Upcoming, approved, not-yet-featured events.
  const { data: events } = await supabase
    .from('events')
    .select('id, title, is_featured, start_date, status')
    .eq('status', 'approved')
    .eq('is_featured', false)
    .gte('start_date', now.toISOString());

  const candidates = (events ?? []) as { id: string; title: string }[];
  if (candidates.length === 0) return NextResponse.json({ ok: true, suggestions: [] });

  const ids = candidates.map((e) => e.id);
  const { data: recentRegs } = await supabase
    .from('registrations')
    .select('event_id')
    .in('event_id', ids)
    .gte('created_at', since);

  const velocity = new Map<string, number>();
  for (const r of recentRegs ?? []) {
    const id = (r as { event_id: string }).event_id;
    velocity.set(id, (velocity.get(id) ?? 0) + 1);
  }

  const suggestions = candidates
    .map((e) => ({ id: e.id, title: e.title, velocity: velocity.get(e.id) ?? 0 }))
    .filter((e) => e.velocity >= VELOCITY_THRESHOLD)
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, TOP_N);

  if (suggestions.length === 0) return NextResponse.json({ ok: true, suggestions: [] });

  // Notify admins once per UTC day.
  const dayKey = now.toISOString().slice(0, 10);
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  const adminIds = (admins ?? []).map((a) => (a as { id: string }).id);

  if (adminIds.length > 0) {
    const { data: sentToday } = await supabase
      .from('notifications')
      .select('user_id, metadata')
      .eq('type', 'system_announcement')
      .in('user_id', adminIds);
    const notifiedAdmins = new Set(
      (sentToday ?? [])
        .filter((n) => (n as { metadata?: { kind?: string; day?: string } }).metadata?.kind === 'trending'
          && (n as { metadata?: { day?: string } }).metadata?.day === dayKey)
        .map((n) => (n as { user_id: string }).user_id)
    );
    const top = suggestions.map((s) => s.title).join(', ');
    const inserts = adminIds
      .filter((id) => !notifiedAdmins.has(id))
      .map((id) => ({
        user_id: id,
        type: 'system_announcement' as const,
        title: 'Trending now — consider featuring',
        message: `${suggestions.length} event(s) gaining traction: ${top}.`,
        action_url: '/admin/featured',
        reference_type: 'event',
        reference_id: suggestions[0].id,
        metadata: { kind: 'trending', day: dayKey },
      }));
    if (inserts.length > 0) await supabase.from('notifications').insert(inserts);
  }

  return NextResponse.json({ ok: true, suggestions });
}
