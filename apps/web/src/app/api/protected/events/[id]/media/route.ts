import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { aiModerateContent } from '@/lib/ai/service';
import { writeModeration } from '@/lib/ai/persistence';
import { createEventMediaSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/events/[id]/media — register an uploaded photo (HO-F).
 *
 * Flow (no new upload path — the EXISTING seam is consumed):
 *   1. The client uploads the FILE via POST /api/protected/upload with
 *      bucket='event-media' (that seam enforces image type, 5MB cap, and the
 *      caller's own storage folder), receiving back a public URL.
 *   2. The client POSTs that URL here; this route validates the metadata and
 *      registers the row.
 *
 * Invariants:
 * 1. ATTENDEE GATE: the caller must have a confirmed registration
 *    (fn_attended is the RLS backstop; checked here for a clean 403).
 * 2. uploader_id injected from the session — never the client.
 * 3. status forced 'pending' — moderation moves it.
 * 4. New rows enqueue to the existing AI moderation pipeline (best-effort,
 *    conservative — no auto-hide; a human decides, same as events/questions).
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

  const parsed = createEventMediaSchema.safeParse(body);
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

  // Clean 403 before the FK/RLS insert path denies.
  const { data: attended } = await supabase.rpc('fn_attended', {
    p_event: id,
    p_user: session.user.id,
  });
  if (attended !== true) {
    return NextResponse.json(
      { error: { code: 'NOT_ATTENDED', message: 'Only attendees of this event can upload photos' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from('event_media')
    .insert({
      event_id: id,
      uploader_id: session.user.id, // injected server-side, never trusted from client
      storage_path: parsed.data.storage_path,
      caption: parsed.data.caption ?? null,
      status: 'pending', // moderation owns the transition
    })
    .select()
    .single();

  if (error) {
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

  const mediaId = (data as { id: string }).id;

  // Fire-and-forget AI moderation enqueue — consume the existing seam.
  // Caption-only content (the pixel scan is a live-provider concern; the stub
  // yields a safe verdict so the queue flow is exercised end-to-end).
  void (async () => {
    try {
      const result = await aiModerateContent({
        content: parsed.data.caption ?? 'photo upload',
        content_type: 'event_photo',
      });
      if (!result.ok || !result.data) return;
      await writeModeration(createServiceClient(), {
        content_type: 'event_photo',
        content_id: mediaId,
        author_id: session.user.id,
        is_safe: result.data.is_safe,
        severity: result.data.severity,
        flags: result.data.flags,
        suggested_action: result.data.suggested_action,
        reason: result.data.reason,
        metadata: { source: 'api/protected/events/[id]/media' },
      });
    } catch (err) {
      console.warn(
        '[AI/moderation] media enqueue failed:',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  })();

  return NextResponse.json(data, { status: 201 });
}
