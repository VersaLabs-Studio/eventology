import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { aiModerateContent } from '@/lib/ai/service';
import { writeModeration } from '@/lib/ai/persistence';
import { createEventQuestionSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/events/[id]/questions — ask a question (HO-B).
 *
 * Invariants:
 * 1. author_id injected from the session — never the client.
 * 2. is_pinned / is_hidden forced to defaults (host controls live elsewhere).
 * 3. Body validated 3..1000 chars by Zod (mirrors the DB CHECK).
 * 4. New questions enqueue to the existing AI moderation pipeline
 *    (aiModerateContent → writeModeration, content_type 'event_question') —
 *    best-effort fire-and-forget, never blocks the submission, conservative
 *    (no auto-hide; a human decides, same as the event cron).
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
      { error: { code: 'MISSING_PARAM', message: 'event id required' } } satisfies ErrorEnvelope,
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

  const parsed = createEventQuestionSchema.safeParse(body);
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

  if (parsed.data.event_id !== id) {
    return NextResponse.json(
      { error: { code: 'PARAM_BODY_MISMATCH', message: 'event_id must match the URL event id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('event_questions')
    .insert({
      event_id: id,
      author_id: session.user.id, // injected server-side, never trusted from client
      body: parsed.data.body,
      is_pinned: false,
      is_hidden: false,
    })
    .select()
    .single();

  if (error) {
    // FK violation → event does not exist (or caller-scoped lookup failed).
    if (error.code === '23503') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Fire-and-forget AI moderation enqueue — consume the existing seam.
  void (async () => {
    try {
      const result = await aiModerateContent({
        content: parsed.data.body,
        content_type: 'event_question',
      });
      if (!result.ok || !result.data) return;
      await writeModeration(createServiceClient(), {
        content_type: 'event_question',
        content_id: (data as { id: string }).id,
        author_id: session.user.id,
        is_safe: result.data.is_safe,
        severity: result.data.severity,
        flags: result.data.flags,
        suggested_action: result.data.suggested_action,
        reason: result.data.reason,
        metadata: { source: 'api/protected/events/[id]/questions' },
      });
    } catch (err) {
      console.warn(
        '[AI/moderation] question enqueue failed:',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  })();

  return NextResponse.json(data, { status: 201 });
}
