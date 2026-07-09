// ============================================================================
// POST /api/protected/admin/organizers/[id]/reject
//   Flip organizer to rejected (is_verified=false, status='rejected')
//   with a reason stored in verification_notes. Audit log + best-effort
//   notify.
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
      { error: { code: 'MISSING_ID', message: 'Organizer id is required' } } satisfies ErrorEnvelope,
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
    .from('organizers')
    .select('id, name, email, profile_id, verification_status, is_verified, verification_notes')
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
      { error: { code: 'NOT_FOUND', message: 'Organizer not found' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  const { data, error } = await service
    .from('organizers')
    .update({
      is_verified: false,
      verification_status: 'rejected',
      verification_notes: parsed.data.reason,
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

  // Role is intentionally NOT elevated on rejection — the applicant stays
  // 'attendee'. Only admin verification (verify route → setUserRole) grants
  // the organizer role. notify() below writes the in-app notification row
  // (and best-effort external channels) with the rejection reason.

  await writeAuditLog(service, {
    actor_id: userId,
    action: 'organizer_rejected',
    target_type: 'organizer',
    target_id: id,
    target_label: current.name,
    details: `Organizer ${current.name} rejected: ${parsed.data.reason}`,
    new_values: {
      is_verified: false,
      verification_status: 'rejected',
      verification_notes: parsed.data.reason,
    },
    old_values: {
      is_verified: current.is_verified,
      verification_status: current.verification_status,
    },
  });

  // Best-effort notify
  if (current.profile_id) {
    void (async () => {
      try {
        const { data: profile } = await service
          .from('profiles')
          .select('email, phone, full_name')
          .eq('id', current.profile_id)
          .maybeSingle();

        if (!profile?.email) return;

        await notify(service, {
          userId: current.profile_id,
          type: 'system_announcement',
          referenceType: 'organizer',
          referenceId: current.id,
          address: {
            ...(profile.email ? { email: profile.email } : {}),
            ...(profile.phone ? { phone: profile.phone } : {}),
          },
          channelPrefs: { email: true, sms: false, push: true },
          templateInput: {
            kind: 'system_announcement',
            data: {
              title: 'Organizer application rejected',
              body: `Hello ${profile.full_name ?? current.name}, your organizer application was rejected. Reason: ${parsed.data.reason}`,
            },
          },
        });
      } catch (err) {
        console.warn('[admin/organizers/reject] best-effort notify failed:', err instanceof Error ? err.message : 'Unknown error');
      }
    })();
  }

  return NextResponse.json(data);
}
