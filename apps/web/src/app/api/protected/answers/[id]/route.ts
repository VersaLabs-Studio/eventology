import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { updateEventAnswerSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * PATCH /api/protected/answers/[id] — edit / hide an own answer (HO-B).
 * Author-only (RLS `ea_modify_own` is the enforcement backstop). Per the
 * LOCKED policies, hosts do not moderate other users' answers.
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
      { error: { code: 'MISSING_PARAM', message: 'answer id required' } } satisfies ErrorEnvelope,
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

  const parsed = updateEventAnswerSchema.safeParse(body);
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

  const { body: newBody, is_hidden } = parsed.data;
  if (newBody === undefined && is_hidden === undefined) {
    return NextResponse.json(
      { error: { code: 'NO_FIELDS', message: 'No fields to update' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const updates: Record<string, unknown> = {};
  if (newBody !== undefined) updates.body = newBody;
  if (is_hidden !== undefined) updates.is_hidden = is_hidden;

  const { data, error } = await supabase
    .from('event_answers')
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
  if (!data) {
    // RLS made the update a no-op (not the author's answer / not visible).
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Answer not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/protected/answers/[id] — delete an own answer.
 * Author-only (RLS `ea_delete_own` scopes the delete; non-permitted deletes
 * are no-ops). Idempotent: 204 either way.
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
      { error: { code: 'MISSING_PARAM', message: 'answer id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { error } = await supabase
    .from('event_answers')
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
