// ============================================================================
// POST /api/protected/events/[id]/broadcast
//   Organizer sends a one-to-many announcement to all confirmed
//   attendees of the event. The message is delivered two ways:
//     1. A single `messages` row in a per-event conversation (the
//        organizer's existing event_inquiry conversation, or a new one
//        created on first broadcast).
//     2. Best-effort fan-out via the comms seam (notify) — every
//        attendee gets a `system_announcement` notification + email/push.
//
// RATE LIMIT: a simple per-organizer cap is enforced here (5/hour) so a
// single misbehaving organizer cannot flood attendees. Implemented as a
// per-organizer in-memory bucket — good enough for V1; production-grade
// rate limiting belongs in the edge / CDN tier (per the AI rate-limit
// pattern).
//
// App-level guard: caller must own the event (requireOrganizerOwnership).
// Defense-in-depth: rate-limited, fail-open comms, broadcast is logged
// to the in-app conversation for an audit trail.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { requireOrganizerOwnership } from '@/lib/ai/role-guard';
import { notify } from '@/lib/comms/notify';
import { loadUserAddress, loadUserPrefs } from '@/lib/comms/notify';
import type { ErrorEnvelope } from '@/lib/api';

const broadcastSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
});

// Per-organizer broadcast rate limit: max 5 in the last hour
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_BROADCASTS_PER_HOUR = 5;

const broadcastLog = new Map<string, number[]>();

function isRateLimited(organizerId: string): boolean {
  const now = Date.now();
  const arr = broadcastLog.get(organizerId) ?? [];
  const recent = arr.filter((t) => now - t < RATE_WINDOW_MS);
  broadcastLog.set(organizerId, recent);
  if (recent.length >= MAX_BROADCASTS_PER_HOUR) return true;
  recent.push(now);
  return false;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id: eventId } = await params;
  if (!eventId) {
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

  const parsed = broadcastSchema.safeParse(body);
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

  const authed = await createAuthedClient(session.user.id);

  // App-level ownership check (admins bypass)
  const guard = await requireOrganizerOwnership(authed, session.user, eventId);
  if (!guard.ok) {
    return NextResponse.json(
      { error: { code: guard.reason ?? 'FORBIDDEN', message: 'Not authorized to broadcast for this event' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Service-role for cross-table fan-out (organizer-scoped reads can't
  // see attendee rows in other organizers' registrations).
  const service = createServiceClient();

  // Rate limit (per-organizer)
  if (guard.organizerId && isRateLimited(guard.organizerId)) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Broadcast rate limit exceeded. Try again later.',
        },
      } satisfies ErrorEnvelope,
      { status: 429 }
    );
  }

  // Load the event title for the in-app message
  const { data: event, error: eventErr } = await service
    .from('events')
    .select('id, title')
    .eq('id', eventId)
    .maybeSingle();

  if (eventErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: eventErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!event) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  // Load confirmed attendees (via registration rows)
  const { data: regs, error: regsErr } = await service
    .from('registrations')
    .select('id, user_id')
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'checked_in']);

  if (regsErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: regsErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const attendeeIds = Array.from(new Set((regs ?? []).map((r) => r.user_id))).filter(
    (id) => id !== session.user.id
  );

  if (attendeeIds.length === 0) {
    return NextResponse.json({ success: true, delivered: 0, conversation_id: null });
  }

  // Create or reuse a "broadcast" conversation keyed to the event +
  // organizer. Find-or-create on (event_id, type='event_inquiry',
  // participant_ids = organizer_profile_id ∪ attendees). V1 creates a
  // new conversation per broadcast — the audit trail is in the
  // notifications table.
  const participantIds = Array.from(new Set([session.user.id, ...attendeeIds]));

  const { data: conversation, error: convErr } = await service
    .from('conversations')
    .insert({
      type: 'event_inquiry',
      event_id: eventId,
      subject: parsed.data.subject,
      participant_ids: participantIds,
      last_message: parsed.data.body.slice(0, 200),
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (convErr || !conversation) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: convErr?.message ?? 'Failed to create broadcast conversation' } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Write the broadcast message as the organizer
  await service.from('messages').insert({
    conversation_id: conversation.id,
    sender_id: session.user.id,
    type: 'text',
    content: parsed.data.body,
  });

  // Fire-and-forget per-attendee notify. Best-effort. Use a single
  // unawaited IIFE so the response returns immediately. We log every
  // delivery outcome to the standard delivery rows; notify() never
  // throws, but we wrap the whole fan-out in a try so a single
  // attendee's resolution error doesn't break the chain.
  void (async () => {
    for (const attendeeId of attendeeIds) {
      try {
        const prefs = await loadUserPrefs(service, attendeeId);
        const address = await loadUserAddress(service, attendeeId);
        await notify(service, {
          userId: attendeeId,
          type: 'system_announcement',
          referenceType: 'event',
          referenceId: eventId,
          address,
          channelPrefs: prefs.channelPrefs,
          locale: prefs.locale,
          templateInput: {
            kind: 'system_announcement',
            data: {
              title: `${event.title}: ${parsed.data.subject}`,
              body: parsed.data.body,
            },
          },
        });
      } catch (err) {
        console.warn(
          `[broadcast] notify failed for attendee ${attendeeId}:`,
          err instanceof Error ? err.message : 'Unknown error'
        );
      }
    }
  })();

  return NextResponse.json({
    success: true,
    conversation_id: conversation.id,
    delivered: attendeeIds.length,
  });
}
