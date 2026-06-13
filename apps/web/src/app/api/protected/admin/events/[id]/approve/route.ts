// ============================================================================
// POST /api/protected/admin/events/[id]/approve
//   Flip event to status='approved'. Audit log. Best-effort notify
//   the organizer (event_approved notification_type maps to the
//   comms seam's 'event_approved' branch).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute, writeAuditLog } from '@/lib/api/admin-guard';
import { notify } from '@/lib/comms/notify';
import type { ErrorEnvelope } from '@/lib/api';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const guard = await requireAdminRoute(_req);
  if (!guard.ok) return guard.response;
  const { service, userId } = guard;
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_ID', message: 'Event id is required' } } satisfies ErrorEnvelope,
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
      status: 'approved',
      rejection_reason: null,
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
    action: 'event_approved',
    target_type: 'event',
    target_id: id,
    target_label: current.title,
    details: `Event "${current.title}" approved by admin`,
    new_values: { status: 'approved' },
    old_values: { status: current.status },
  });

  // Best-effort notify the organizer
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
          type: 'event_approved',
          referenceType: 'event',
          referenceId: id,
          address: {
            ...(profile.email ? { email: profile.email } : {}),
            ...(profile.phone ? { phone: profile.phone } : {}),
          },
          channelPrefs: { email: true, sms: false, push: true },
          templateInput: {
            kind: 'event_approved',
            data: { event: current.title },
          },
        });
      } catch (err) {
        console.warn('[admin/events/approve] best-effort notify failed:', err instanceof Error ? err.message : 'Unknown error');
      }
    })();
  }

  return NextResponse.json(data);
}
