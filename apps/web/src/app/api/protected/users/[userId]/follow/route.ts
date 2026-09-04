import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createUserFollowSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/users/[userId]/follow
 * Follow a user. Idempotent: UNIQUE(follower_id, following_id) violation
 * (23505) returns 200 { ok: true, already: true } instead of an error.
 *
 * Invariants:
 * 1. follower_id is injected server-side from the session — never the client.
 * 2. Body's following_id must match the [userId] path param (single source).
 * 3. Self-follow rejected up front (DB CHECK is the backstop).
 * 4. RLS (`038`) proves A cannot insert a follow as B.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'user id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = createUserFollowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.flatten(),
        },
      } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  if (parsed.data.following_id !== userId) {
    return NextResponse.json(
      { error: { code: 'PARAM_BODY_MISMATCH', message: 'following_id must match the URL user id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: { code: 'SELF_FOLLOW', message: 'You cannot follow yourself' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('user_follows')
    .insert({ follower_id: session.user.id, following_id: userId })
    .select()
    .single();

  if (error) {
    // UNIQUE(follower_id, following_id) violation → already following.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, already: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * DELETE /api/protected/users/[userId]/follow
 * Unfollow a user. RLS scopes the delete to the caller's own row, so deleting
 * another user's follow is a no-op. Idempotent: 204 even if not following.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'user id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', session.user.id)
    .eq('following_id', userId);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
