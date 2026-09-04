import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { updateEventMediaSchema } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * PATCH /api/protected/media/[id] — caption edit / moderation status (HO-F).
 *
 * Authorization (RLS `em_update_own_or_host` backstops):
 *   - caption edit: the uploader OR the event host
 *   - status transitions (approve/hide/unhide): the event HOST ONLY —
 *     uploaders never moderate their own photos into the public gallery
 *     ("do not bypass the moderation queue").
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
      { error: { code: 'MISSING_PARAM', message: 'media id required' } } satisfies ErrorEnvelope,
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

  const parsed = updateEventMediaSchema.safeParse(body);
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

  const { caption, status } = parsed.data;
  if (caption === undefined && status === undefined) {
    return NextResponse.json(
      { error: { code: 'NO_FIELDS', message: 'No fields to update' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { data: media } = await supabase
    .from('event_media')
    .select('id, event_id, uploader_id')
    .eq('id', id)
    .maybeSingle();

  if (!media) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Media not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const row = media as { id: string; event_id: string; uploader_id: string };
  const isUploader = row.uploader_id === session.user.id;

  const { data: hostFlag } = await supabase.rpc('fn_is_event_host', {
    p_event_id: row.event_id,
    p_user: session.user.id,
  });
  const isHost = hostFlag === true;

  // Status transitions are host-only.
  if (status !== undefined && !isHost) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only the event host can moderate photos' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Caption edits are uploader-or-host.
  if (caption !== undefined && !isUploader && !isHost) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You can only edit your own photos' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (caption !== undefined) updates.caption = caption;
  if (status !== undefined) updates.status = status;

  const { data, error } = await supabase
    .from('event_media')
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
 * DELETE /api/protected/media/[id] — remove a photo row (uploader or host;
 * RLS `em_delete_own_or_host` backstops). Idempotent: 204 either way.
 *
 * NOTE: the storage object itself lives in the uploader's own folder — hosts
 * cannot delete other users' storage objects (storage RLS), so host deletions
 * remove the row and orphan the file in the public bucket (invisible once
 * unlisted). Flagged in the build report.
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
      { error: { code: 'MISSING_PARAM', message: 'media id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  // Fetch first so OWNERS can also remove their own storage object.
  const { data: media } = await supabase
    .from('event_media')
    .select('id, storage_path')
    .eq('id', id)
    .maybeSingle();

  if (!media) {
    return new NextResponse(null, { status: 204 });
  }

  const row = media as { id: string; storage_path: string };

  const { error } = await supabase
    .from('event_media')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Best-effort storage cleanup for the owner's own object (storage RLS
  // permits deleting files inside the caller's own folder only). The path
  // stored is a public URL — derive the object path after the bucket segment.
  if (row.storage_path.includes('/event-media/')) {
    try {
      const objectPath = row.storage_path.split('/event-media/')[1];
      if (objectPath) {
        await supabase.storage.from('event-media').remove([objectPath]);
      }
    } catch {
      // Non-fatal: row removal is the source of truth for visibility.
    }
  }

  return new NextResponse(null, { status: 204 });
}
