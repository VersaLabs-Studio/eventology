import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { announcementCreateSchema } from '@eventology/schemas';
import { notify, loadUserPrefs, loadUserAddress } from '@/lib/comms/notify';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

/**
 * /api/protected/events/[id]/announcements — the live layer (HO-M).
 *
 *   GET  → backfill for the live panel (RLS: confirmed attendees + host;
 *          everyone else gets an RLS-filtered EMPTY list — the response
 *          includes `viewer.isHost` so the panel can render the composer).
 *   POST → host-only (RLS ann_insert_host + server-injected author_id —
 *          the author_id = auth.uid() conjunct prevents co-host forging).
 *          Announcements ENQUEUE into the existing comms/push seam
 *          (notify/loadUserPrefs/loadUserAddress — the exact primitives the
 *          broadcast route uses); the seam itself is unmodified, no
 *          conversation row is created (announcements have their own live
 *          surface — documented assumption).
 */

const BACKFILL_LIMIT = 100;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Missing event id' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('event_announcements')
    .select('id, event_id, author_id, body, created_at')
    .eq('event_id', id)
    .order('created_at', { ascending: true })
    .limit(BACKFILL_LIMIT);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Composer visibility for the panel (host = owner or team member).
  const { data: isHost } = await supabase.rpc('fn_is_event_host', {
    p_event_id: id,
    p_user: session.user.id,
  });

  return NextResponse.json({
    data: data ?? [],
    meta: { total: data?.length ?? 0, page: 1, limit: BACKFILL_LIMIT },
    viewer: { isHost: isHost === true },
  } satisfies ListEnvelope<unknown> & { viewer: { isHost: boolean } });
}

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
      { error: { code: 'MISSING_PARAM', message: 'Missing event id' } } satisfies ErrorEnvelope,
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

  const parsed = announcementCreateSchema.safeParse(body);
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

  // Insert — author_id server-injected (never the client). RLS
  // ann_insert_host rejects non-hosts (42501) and authorship forgery alike.
  const { data: announcement, error } = await supabase
    .from('event_announcements')
    .insert({
      event_id: id,
      author_id: session.user.id,
      body: parsed.data.body,
    })
    .select('id, event_id, author_id, body, created_at')
    .single();

  if (error) {
    if (error.code === '42501' || error.message.includes('row-level security')) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only the event host can post announcements' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
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

  // Push fan-out — ENQUEUE ONLY into the existing comms seam (broadcast
  // route's primitives, unmodified). Fire-and-forget: the announcement row
  // is already live over Realtime; a comms outage never blocks it.
  void (async () => {
    try {
      const service = createServiceClient();

      const { data: event } = await service
        .from('events')
        .select('title')
        .eq('id', id)
        .maybeSingle();

      const { data: regs } = await service
        .from('registrations')
        .select('id, user_id')
        .eq('event_id', id)
        .in('status', ['confirmed', 'checked_in']);

      const attendeeIds = Array.from(
        new Set((regs ?? []).map((r) => (r as { user_id: string }).user_id))
      ).filter((uid) => uid !== session.user.id);

      for (const attendeeId of attendeeIds) {
        try {
          const prefs = await loadUserPrefs(service, attendeeId);
          const address = await loadUserAddress(service, attendeeId);
          await notify(service, {
            userId: attendeeId,
            type: 'system_announcement',
            referenceType: 'event',
            referenceId: id,
            address,
            channelPrefs: prefs.channelPrefs,
            locale: prefs.locale,
            templateInput: {
              kind: 'system_announcement',
              data: {
                title: `${event?.title ?? 'Event'}: live announcement`,
                body: parsed.data.body,
              },
            },
          });
        } catch (err) {
          console.warn(
            `[announcements] notify failed for attendee ${attendeeId}:`,
            err instanceof Error ? err.message : 'Unknown error'
          );
        }
      }
    } catch (err) {
      console.warn(
        '[announcements] push fan-out failed:',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  })();

  return NextResponse.json(announcement, { status: 201 });
}
