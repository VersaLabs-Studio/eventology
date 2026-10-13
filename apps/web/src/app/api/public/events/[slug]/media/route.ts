import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * GET /api/public/events/[slug]/media — approved gallery for an event (HO-F).
 *
 * RLS (`em_select_visible`) scopes rows: anonymous callers see APPROVED only;
 * a signed-in uploader additionally sees their own pending/hidden photos and
 * (as host) everything for their events. Sorted newest first.
 *
 * Session enhancements: `myReaction` per photo + `viewer.isHost` to reveal
 * moderation controls. Reaction counts are aggregated via service-role for
 * the RLS-visible photo ids only: `event_media_reactions` is revoked from
 * anon (it names who reacted), so embedding it in the anon query failed
 * every signed-out gallery view with "permission denied".
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing event slug' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(60, Math.max(1, Number(searchParams.get('limit') ?? 24)));
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }
  const eventId = (event as { id: string }).id;

  const { data, error, count } = await supabase
    .from('event_media')
    .select(
      `id, storage_path, caption, status, created_at, uploader_id,
       uploader:profiles(id, full_name, avatar_url)`,
      { count: 'exact' }
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const mediaIds = (data ?? []).map((m) => (m as { id: string }).id);

  // Aggregate only — ids come from the RLS-scoped query above, and the
  // response carries counts, never reactor identities.
  const reactionCounts = new Map<string, number>();
  if (mediaIds.length > 0) {
    const { data: counted, error: countError } = await createServiceClient()
      .from('event_media')
      .select('id, reactions:event_media_reactions(count)')
      .in('id', mediaIds);
    if (countError) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: countError.message } } satisfies ErrorEnvelope,
        { status: 500 }
      );
    }
    for (const row of counted ?? []) {
      const r = row as { id: string; reactions: Array<{ count: number }> | null };
      reactionCounts.set(r.id, r.reactions?.[0]?.count ?? 0);
    }
  }

  // Optional session enhancements.
  const session = await auth.api.getSession({ headers: req.headers });
  let myReactions = new Set<string>();
  let isHost = false;

  if (session) {
    const authed = await createAuthedClient(session.user.id);
    if (mediaIds.length > 0) {
      const { data: reactions } = await authed
        .from('event_media_reactions')
        .select('media_id')
        .eq('profile_id', session.user.id)
        .in('media_id', mediaIds);
      myReactions = new Set((reactions ?? []).map((r) => (r as { media_id: string }).media_id));
    }
    const { data: hostFlag } = await authed.rpc('fn_is_event_host', {
      p_event_id: eventId,
      p_user: session.user.id,
    });
    isHost = hostFlag === true;
  }

  const media = (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      ...r,
      reaction_count: reactionCounts.get(r.id as string) ?? 0,
      my_reaction: myReactions.has(r.id as string),
    };
  });

  return NextResponse.json({
    data: media,
    meta: { total: count ?? 0, page, limit },
    viewer: { isHost },
  } satisfies ListEnvelope<unknown> & { viewer: { isHost: boolean } });
}
