// ============================================================================
// POST /api/protected/admin/events/[id]/reject
//   Flip event to status='rejected' with a reason. Audit log.
//   Best-effort notify the organizer.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminRoute, writeAuditLog } from '@/lib/api/admin-guard';
import { notify } from '@/lib/comms/notify';
import type { ErrorEnvelope } from '@/lib/api';

const rejectSchema = z.object({
  reason: z.string().min(1, 'A rejection reason is required').max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const guard = await requireAdminRoute(req);
  if (!guard.ok) return guard.response;
  const { service, userId } = guard;
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_ID', message: 'Event id is required' } } satisfies ErrorEnvelope,
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

  const parsed = rejectSchema.safeParse(body);
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

  const { data: current, error: fetchErr } = await service
    .from('events')
    .select('id, title, slug, status, organizer_id, organizers(profile_id, name)')
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: fetchErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!current) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const { data, error } = await service
    .from('events')
    .update({
      status: 'rejected',
      rejection_reason: parsed.data.reason,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  await writeAuditLog(service, {
    actor_id: userId,
    action: 'event_rejected',
    target_type: 'event',
    target_id: id,
    target_label: current.title,
    details: `Event "${current.title}" rejected: ${parsed.data.reason}`,
    new_values: {
      status: 'rejected',
      rejection_reason: parsed.data.reason,
    },
    old_values: { status: current.status },
  });

  // Best-effort notify
  const org = Array.isArray(current.organizers) ? current.organizers[0] : current.organizers;
  if (org?.profile_id) {
    void (async () => {
      try {
        const { data: profile } = await service
          .from('profiles')
          .select('email, phone')
          .eq('id', org.profile_id)
          .maybeSingle();
        if (!profile?.email) return;

        await notify(service, {
          userId: org.profile_id,
          type: 'event_rejected',
          referenceType: 'event',
          referenceId: id,
          address: {
            ...(profile.email ? { email: profile.email } : {}),
            ...(profile.phone ? { phone: profile.phone } : {}),
          },
          channelPrefs: { email: true, sms: false, push: true },
          templateInput: {
            kind: 'event_rejected',
            data: { event: current.title },
          },
        });
      } catch (err) {
        console.warn('[admin/events/reject] best-effort notify failed:', err instanceof Error ? err.message : 'Unknown error');
      }
    })();
  }

  return NextResponse.json(data);
}
