// ============================================================================
// POST /api/protected/admin/organizers/[id]/verify
//   Flip organizer to verified (is_verified=true, status='verified').
//   Writes audit_log. Best-effort notifies the organizer via the
//   notify() seam (does not block the response).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute, writeAuditLog } from '@/lib/api/admin-guard';
import { notify } from '@/lib/comms/notify';
import { setUserRole } from '@/lib/auth/server';
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
      { error: { code: 'MISSING_ID', message: 'Organizer id is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Load current row + profile (we need the profile_id for notify)
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
      is_verified: true,
      verification_status: 'verified',
      verification_notes: null,
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

  // Grant the organizer role — the ONLY path that does so. Self-signup
  // (become route) leaves role as 'attendee'; verification is what unlocks
  // /org/*. setUserRole writes both the better-auth "user" table and the
  // domain profiles table.
  if (current.profile_id) {
    await setUserRole(current.profile_id, 'organizer');
  }

  await writeAuditLog(service, {
    actor_id: userId,
    action: 'organizer_verified',
    target_type: 'organizer',
    target_id: id,
    target_label: current.name,
    details: `Organizer ${current.name} verified by admin`,
    new_values: { is_verified: true, verification_status: 'verified' },
    old_values: {
      is_verified: current.is_verified,
      verification_status: current.verification_status,
    },
  });

  // Best-effort notify (fire-and-forget). We resolve the address from
  // profiles.phone/email — the comms seam takes care of the rest.
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
              title: 'Organizer verified',
              body: `Congratulations ${profile.full_name ?? current.name}, your organizer account has been verified. You can now create and publish events.`,
            },
          },
        });
      } catch (err) {
        console.warn('[admin/organizers/verify] best-effort notify failed:', err instanceof Error ? err.message : 'Unknown error');
      }
    })();
  }

  return NextResponse.json(data);
}
