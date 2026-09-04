import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { updateEventQuestionSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * PATCH /api/protected/questions/[id] — edit / pin / hide a question (HO-B).
 *
 * Authorization (RLS `eq_update_own_or_host` is the enforcement backstop):
 *   - body edit: author of the question OR the event host
 *   - is_pinned / is_hidden: event host ONLY (rejected 403 otherwise)
 *
 * Host detection uses the fn_is_event_host RPC (039) — the same predicate the
 * RLS policies use, so UI and DB can never disagree.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'question id required' } } satisfies ErrorEnvelope,
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

  const parsed = updateEventQuestionSchema.safeParse(body);
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

  const { body: newBody, is_pinned, is_hidden } = parsed.data;

  if (newBody === undefined && is_pinned === undefined && is_hidden === undefined) {
    return NextResponse.json(
      { error: { code: 'NO_FIELDS', message: 'No fields to update' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  // Fetch the question (RLS-scoped: hidden questions visible to author/host).
  const { data: question } = await supabase
    .from('event_questions')
    .select('id, event_id, author_id')
    .eq('id', id)
    .maybeSingle();

  if (!question) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Question not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const row = question as { id: string; event_id: string; author_id: string };
  const isAuthor = row.author_id === session.user.id;

  const { data: hostFlag } = await supabase.rpc('fn_is_event_host', {
    p_event_id: row.event_id,
    p_user: session.user.id,
  });
  const isHost = hostFlag === true;

  // Pin/hide is host-only.
  if ((is_pinned !== undefined || is_hidden !== undefined) && !isHost) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only the event host can pin or hide questions' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Body edit is author-or-host.
  if (newBody !== undefined && !isAuthor && !isHost) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You can only edit your own questions' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (newBody !== undefined) updates.body = newBody;
  if (is_pinned !== undefined) updates.is_pinned = is_pinned;
  if (is_hidden !== undefined) updates.is_hidden = is_hidden;

  const { data, error } = await supabase
    .from('event_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/protected/questions/[id] — delete a question.
 * Author or event host (RLS `eq_delete_own_or_host` scopes the delete;
 * a non-permitted delete is a no-op). Idempotent: 204 either way.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'question id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { error } = await supabase
    .from('event_questions')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
