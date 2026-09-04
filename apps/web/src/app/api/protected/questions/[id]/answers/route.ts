import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createEventAnswerSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/questions/[id]/answers — answer a question (HO-B).
 *
 * Invariants:
 * 1. author_id injected from the session — never the client.
 * 2. is_official is set SERVER-SIDE when the caller is the event host
 *    (fn_is_event_host) — never trusted from the client.
 * 3. Body validated 1..2000 chars by Zod (mirrors the DB CHECK).
 */
export async function POST(
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

  const parsed = createEventAnswerSchema.safeParse(body);
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

  const supabase = await createAuthedClient(session.user.id);

  // The question must exist AND be visible to the caller (RLS-scoped read:
  // hidden questions are only answerable by their author or the host).
  const { data: question } = await supabase
    .from('event_questions')
    .select('id, event_id')
    .eq('id', id)
    .maybeSingle();

  if (!question) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Question not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const { data: hostFlag } = await supabase.rpc('fn_is_event_host', {
    p_event_id: (question as { event_id: string }).event_id,
    p_user: session.user.id,
  });

  const { data, error } = await supabase
    .from('event_answers')
    .insert({
      question_id: id,
      author_id: session.user.id, // injected server-side, never trusted from client
      body: parsed.data.body,
      is_official: hostFlag === true, // server-side host detection only
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
