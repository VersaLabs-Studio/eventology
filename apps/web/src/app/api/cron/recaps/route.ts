import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAuthorizedCron } from '@/lib/cron';
import { aiGenerateEventRecap } from '@/lib/ai/service';

/**
 * GET /api/cron/recaps — Recap Agent (Part 2 §3.18 / §6.2)
 *
 * For events that ended in the last ~24h and don't yet have a recap, generate
 * one via the AI recap service and store it on events.metadata.recap. Best
 * effort: with AI_PROVIDER=stub this writes the deterministic stub recap; it
 * becomes real prose once a live provider key is configured.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface EndedEvent {
  id: string;
  title: string;
  event_type: string;
  description: string | null;
  start_date: string;
  end_date: string;
  venue_name: string | null;
  capacity: number;
  metadata: Record<string, unknown> | null;
  organizer: unknown;
}

function organizerProfileId(organizer: unknown): string | null {
  if (!organizer) return null;
  const o = Array.isArray(organizer) ? organizer[0] : organizer;
  return (o as { profile_id?: string })?.profile_id ?? null;
}

/**
 * HO-D: super_host award check for an event's organizer. Called for every
 * event that just completed — INDEPENDENT of AI recap success. fn_award_badge
 * is idempotent, so re-running never double-awards. Eligibility: the organizer
 * has hosted >= 10 completed (approved + ended) events.
 */
async function maybeAwardSuperHost(
  supabase: ReturnType<typeof createServiceClient>,
  organizerProfileId: string | null
): Promise<void> {
  if (!organizerProfileId) return;
  try {
    const { data: orgs } = await supabase
      .from('organizers')
      .select('id')
      .eq('profile_id', organizerProfileId);
    const orgIds = (orgs ?? []).map((o) => (o as { id: string }).id);
    if (orgIds.length === 0) return;

    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .in('organizer_id', orgIds)
      .eq('status', 'approved')
      .lt('end_date', new Date().toISOString());

    if ((count ?? 0) >= 10) {
      await supabase.rpc('fn_award_badge', {
        p_user: organizerProfileId,
        p_code: 'super_host',
      });
    }
  } catch (err) {
    console.warn(
      '[Gamification] super_host check failed:',
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } }, { status: 401 });
  }
  const supabase = createServiceClient();
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 3_600_000).toISOString();

  const { data: events } = await supabase
    .from('events')
    .select('id, title, event_type, description, start_date, end_date, venue_name, capacity, metadata, organizer:organizers(profile_id)')
    .lt('end_date', now.toISOString())
    .gte('end_date', since);

  const ended = ((events ?? []) as EndedEvent[]).filter((e) => !(e.metadata && 'recap' in e.metadata));
  if (ended.length === 0) return NextResponse.json({ ok: true, generated: 0 });

  let generated = 0;
  for (const e of ended) {
    // HO-D: event-completion step — award check runs even if recap generation
    // fails below (completion ≠ recap).
    await maybeAwardSuperHost(supabase, organizerProfileId(e.organizer));

    const [{ count: total }, { count: checkedIn }] = await Promise.all([
      supabase.from('registrations').select('id', { count: 'exact', head: true })
        .eq('event_id', e.id).in('status', ['confirmed', 'checked_in']),
      supabase.from('registrations').select('id', { count: 'exact', head: true })
        .eq('event_id', e.id).eq('status', 'checked_in'),
    ]);

    const result = await aiGenerateEventRecap({
      event_title: e.title,
      event_type: e.event_type,
      description: e.description ?? '',
      start_date: e.start_date,
      end_date: e.end_date,
      venue_name: e.venue_name,
      total_registrations: total ?? 0,
      checked_in_count: checkedIn ?? 0,
      capacity: e.capacity,
    });

    if (!result.ok || !result.data) continue;

    await supabase
      .from('events')
      .update({ metadata: { ...(e.metadata ?? {}), recap: result.data, recap_generated_at: now.toISOString() } })
      .eq('id', e.id);
    generated += 1;
  }

  return NextResponse.json({ ok: true, generated });
}
