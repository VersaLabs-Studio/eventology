import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { pgUuid } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

const uuidParamSchema = z.object({ userId: pgUuid() });

/**
 * GET /api/public/users/[userId]/social — public social proof for a user.
 *
 * Always returns follower/following counts (user_follows is public-readable
 * per 038). When the OPTIONAL caller session exists AND `?eventId=` is given,
 * also returns `friendsAttending`: people THE CALLER follows who have a
 * confirmed registration on that event.
 *
 * ASSUMPTION (documented in the HO-A build report): "people I follow" is
 * resolved strictly from the caller's session — never from the [userId] path
 * param — because exposing which of an arbitrary user's follows are registered
 * would leak other users' registration data. Anonymous callers get an empty
 * `friendsAttending` array (not an error).
 *
 * The friends computation goes through `fn_friends_attending` (SECURITY
 * DEFINER, 038) because registrations RLS (016) is owner/organizer-only; the
 * function exposes only id/full_name/avatar_url of followed attendees and
 * excludes activity_private users.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const parsedParam = uuidParamSchema.safeParse({ userId });
  if (!parsedParam.success) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'A valid user id is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Public counts via head-count queries (no rows transferred).
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);

  if (followers === null || following === null) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Failed to load social counts' } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  let friendsAttending: Array<{ id: string; full_name: string; avatar_url: string | null }> = [];
  let isFollowing: boolean | null = null;

  // Optional session: public route, auth enhances the response.
  const session = await auth.api.getSession({ headers: req.headers });
  if (session) {
    // Whether the CALLER follows this user (drives the follow-toggle state).
    const authed = await createAuthedClient(session.user.id);
    const { count } = await authed
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', session.user.id)
      .eq('following_id', userId);
    isFollowing = (count ?? 0) > 0;
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  if (eventId) {
    const parsedEvent = pgUuid().safeParse(eventId);
    if (!parsedEvent.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'eventId must be a valid uuid' } } satisfies ErrorEnvelope,
        { status: 400 }
      );
    }

    if (session) {
      const authed = await createAuthedClient(session.user.id);
      const { data, error } = await authed.rpc('fn_friends_attending', {
        p_event_id: parsedEvent.data,
        p_follower: session.user.id,
      });
      if (error) {
        return NextResponse.json(
          { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
          { status: 500 }
        );
      }
      friendsAttending = data ?? [];
    }
  }

  return NextResponse.json({
    followers,
    following,
    friendsAttending,
    ...(isFollowing !== null ? { isFollowing } : {}),
  });
}
