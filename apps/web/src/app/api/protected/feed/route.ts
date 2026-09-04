import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * GET /api/protected/feed — the caller's personalized activity feed.
 *
 * Materialized read: rows live in `feed_activities`, appended by SECURITY
 * DEFINER triggers on save/register/review/follow writes (038). Fan-out is a
 * single indexed query (idx_feed_actor_time) — no per-actor fan-out loop.
 *
 * Row visibility is enforced by RLS (`feed_select_followed`): the caller reads
 * activities of people they follow whose `activity_private` is false, plus
 * their own activities. The endpoint adds no filtering beyond pagination —
 * RLS is the authz truth.
 *
 * Returns { data: FeedItem[], meta: { total, page, limit } }.
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
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const offset = (page - 1) * limit;

  // Two FKs point at profiles → explicit FK-name hints disambiguate the embeds.
  const { data, error, count } = await supabase
    .from('feed_activities')
    .select(
      `id, verb, created_at,
       actor:profiles!feed_activities_actor_id_fkey(id, full_name, avatar_url),
       event:events(id, title, slug, banner_image),
       target_user:profiles!feed_activities_target_user_id_fkey(id, full_name, avatar_url),
       target_organizer:organizers(id, name, slug, avatar_url)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, limit },
  } satisfies ListEnvelope<unknown>);
}
