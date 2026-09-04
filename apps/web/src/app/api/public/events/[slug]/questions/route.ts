import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/public/events/[slug]/questions — threaded Q&A for an event.
 *
 * Public (no auth required). RLS (`039`) scopes rows: the anon/unauthed caller
 * sees visible rows only; a signed-in caller additionally sees their own
 * hidden rows and (as host) hidden questions for their events. Sorted
 * pinned → upvotes → newest, answers official-first then oldest-first.
 *
 * When a session IS present the response is enhanced with:
 *   - `myVote` per question (caller's own vote — eqv_select_own policy)
 *   - `viewer.isHost` (fn_is_event_host) to reveal pin/hide controls
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
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
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

  const { data: questions, error, count } = await supabase
    .from('event_questions')
    .select(
      `id, body, is_pinned, is_hidden, upvotes, created_at, author_id,
       author:profiles(id, full_name, avatar_url),
       answers:event_answers(id, body, is_official, is_hidden, created_at, author_id,
         author:profiles(id, full_name, avatar_url))`,
      { count: 'exact' }
    )
    .eq('event_id', eventId)
    .order('is_pinned', { ascending: false })
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false })
    .order('created_at', { referencedTable: 'event_answers', ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Optional session enhancements (myVote + host flag).
  const session = await auth.api.getSession({ headers: req.headers });
  let myVotes = new Set<string>();
  let isHost = false;

  if (session) {
    const authed = await createAuthedClient(session.user.id);
    const questionIds = (questions ?? []).map((q) => (q as { id: string }).id);
    if (questionIds.length > 0) {
      const { data: votes } = await authed
        .from('event_question_votes')
        .select('question_id')
        .eq('profile_id', session.user.id)
        .in('question_id', questionIds);
      myVotes = new Set((votes ?? []).map((v) => (v as { question_id: string }).question_id));
    }
    const { data: hostFlag } = await authed.rpc('fn_is_event_host', {
      p_event_id: eventId,
      p_user: session.user.id,
    });
    isHost = hostFlag === true;
  }

  return NextResponse.json({
    data: (questions ?? []).map((q) => {
      const row = q as Record<string, unknown>;
      return {
        ...row,
        my_vote: myVotes.has(row.id as string),
      };
    }),
    meta: { total: count ?? 0, page, limit },
    viewer: { isHost },
  });
}
