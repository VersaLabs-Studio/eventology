// ============================================================================
// PATCH  /api/protected/organizers/[id]/team/[memberId]
//   Update a team member's role. App-level ownership re-check (admin OR
//   organizer owner).
//
// DELETE /api/protected/organizers/[id]/team/[memberId]
//   Remove a team member. Same authorization.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { createAuthedClient } from '@/lib/supabase/server';
import type { ErrorEnvelope } from '@/lib/api';

const patchSchema = z.object({
  role: z.enum(['admin', 'member']),
});

/**
 * Reused across PATCH/DELETE — verifies the caller is the organizer
 * owner (or an admin), and that the member row belongs to this organizer.
 */
async function authorize(
  req: NextRequest,
  organizerId: string,
  memberId: string
): Promise<{ ok: true; service: ReturnType<typeof createServiceClient> } | { ok: false; response: NextResponse }> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
        { status: 401 }
      ),
    };
  }

  const authed = await createAuthedClient(session.user.id);

  const { data: caller } = await authed
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (caller?.role !== 'admin') {
    const { data: org } = await authed
      .from('organizers')
      .select('id')
      .eq('id', organizerId)
      .eq('profile_id', session.user.id)
      .maybeSingle();

    if (!org) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Not the owner of this organizer' } } satisfies ErrorEnvelope,
          { status: 403 }
        ),
      };
    }
  }

  // Verify the member row belongs to this organizer
  const service = createServiceClient();
  const { data: member, error: memberErr } = await service
    .from('organizer_team_members')
    .select('id, organizer_id, role')
    .eq('id', memberId)
    .maybeSingle();

  if (memberErr) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: 'DB_ERROR', message: memberErr.message } } satisfies ErrorEnvelope,
        { status: 500 }
      ),
    };
  }
  if (!member) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Team member not found' } } satisfies ErrorEnvelope,
        { status: 404 }
      ),
    };
  }
  if (member.organizer_id !== organizerId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Member does not belong to this organizer' } } satisfies ErrorEnvelope,
        { status: 403 }
      ),
    };
  }
  // Cannot demote the owner
  if (member.role === 'owner') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: 'CANNOT_MODIFY_OWNER', message: 'Owner role is fixed' } } satisfies ErrorEnvelope,
        { status: 409 }
      ),
    };
  }

  return { ok: true, service };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { id: organizerId, memberId } = await params;
  if (!organizerId || !memberId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'organizer id + member id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const guard = await authorize(req, organizerId, memberId);
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(body);
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

  const { data, error } = await guard.service
    .from('organizer_team_members')
    .update({ role: parsed.data.role })
    .eq('id', memberId)
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { id: organizerId, memberId } = await params;
  if (!organizerId || !memberId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'organizer id + member id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const guard = await authorize(req, organizerId, memberId);
  if (!guard.ok) return guard.response;

  const { error } = await guard.service
    .from('organizer_team_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
