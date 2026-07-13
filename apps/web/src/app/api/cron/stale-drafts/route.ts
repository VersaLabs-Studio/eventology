import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAuthorizedCron } from '@/lib/cron';

/**
 * GET /api/cron/stale-drafts — Stale Draft Agent (Part 2 §6.2)
 *
 * Nudges organizers about draft events untouched for 14+ days. Idempotent:
 * only one nudge per draft (deduped on an existing notification carrying
 * metadata.kind = 'stale_draft').
 */
export const dynamic = 'force-dynamic';

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
  const cutoff = new Date(Date.now() - 14 * 86_400_000).toISOString();

  const { data: drafts } = await supabase
    .from('events')
    .select('id, title, updated_at, organizer:organizers(profile_id)')
    .eq('status', 'draft')
    .lt('updated_at', cutoff);

  const rows = (drafts ?? []) as { id: string; title: string; organizer: unknown }[];
  if (rows.length === 0) return NextResponse.json({ ok: true, nudged: 0 });

  const eventIds = rows.map((e) => e.id);
  const { data: existing } = await supabase
    .from('notifications')
    .select('reference_id, metadata')
    .eq('type', 'system_announcement')
    .in('reference_id', eventIds);

  const already = new Set(
    (existing ?? [])
      .filter((n) => (n as { metadata?: { kind?: string } }).metadata?.kind === 'stale_draft')
      .map((n) => (n as { reference_id: string }).reference_id)
  );

  const inserts = rows
    .filter((e) => !already.has(e.id))
    .map((e) => ({ event: e, uid: ownerId(e.organizer) }))
    .filter((x) => x.uid)
    .map((x) => ({
      user_id: x.uid as string,
      type: 'system_announcement' as const,
      title: 'Your draft is waiting',
      message: `"${x.event.title}" has been a draft for over two weeks. Finish and submit it to go live.`,
      action_url: '/org/drafts',
      reference_type: 'event',
      reference_id: x.event.id,
      metadata: { kind: 'stale_draft' },
    }));

  if (inserts.length === 0) return NextResponse.json({ ok: true, nudged: 0 });
  await supabase.from('notifications').insert(inserts);
  return NextResponse.json({ ok: true, nudged: inserts.length });
}
