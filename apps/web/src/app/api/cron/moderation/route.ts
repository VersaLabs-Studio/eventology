import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAuthorizedCron } from '@/lib/cron';
import { aiModerateContent } from '@/lib/ai/service';
import { writeModeration } from '@/lib/ai/persistence';

/**
 * GET /api/cron/moderation — Moderation Agent (Part 2 §5.1 / §6.2)
 *
 * AI pre-scans pending_review events that haven't been scanned yet and persists
 * the verdict to content_moderation, so the admin queue shows the "AI: Likely
 * Safe / Flagged" badge. Conservative by design: it never auto-approves or
 * auto-rejects — a human still decides. (Auto-action can be layered on once a
 * live model provides calibrated confidence.)
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface PendingEvent {
  id: string;
  title: string;
  description: string | null;
  organizer: unknown;
}

function ownerId(organizer: unknown): string | null {
  if (!organizer) return null;
  const o = Array.isArray(organizer) ? organizer[0] : organizer;
  return (o as { profile_id?: string })?.profile_id ?? null;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } }, { status: 401 });
  }
  const supabase = createServiceClient();

  const { data: pending } = await supabase
    .from('events')
    .select('id, title, description, organizer:organizers(profile_id)')
    .eq('status', 'pending_review')
    .limit(25);

  const rows = (pending ?? []) as PendingEvent[];
  if (rows.length === 0) return NextResponse.json({ ok: true, scanned: 0 });

  // Skip events already scanned.
  const ids = rows.map((e) => e.id);
  const { data: existing } = await supabase
    .from('content_moderation')
    .select('content_id')
    .in('content_id', ids);
  const scanned = new Set((existing ?? []).map((m) => (m as { content_id: string }).content_id));

  let count = 0;
  for (const e of rows) {
    if (scanned.has(e.id)) continue;

    const result = await aiModerateContent({
      content: `${e.title}\n\n${e.description ?? ''}`.trim(),
      content_type: 'event_description',
    });
    if (!result.ok || !result.data) continue;

    await writeModeration(supabase, {
      content_type: 'event_description',
      content_id: e.id,
      author_id: ownerId(e.organizer),
      is_safe: result.data.is_safe,
      severity: result.data.severity,
      flags: result.data.flags,
      suggested_action: result.data.suggested_action,
      reason: result.data.reason,
      metadata: { source: 'cron/moderation' },
    });
    count += 1;
  }

  return NextResponse.json({ ok: true, scanned: count });
}
