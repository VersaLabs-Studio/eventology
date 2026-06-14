// ============================================================================
// GET  /api/protected/organizers/[id]/team
//   List members of the given organizer team (joined with the member's
//   profile + invite status). RLS (`Team: organizer read`) self-enforces
//   ownership for non-admin callers; we re-verify ownership at the app
//   layer to keep the 403 envelope uniform.
//
// POST /api/protected/organizers/[id]/team
//   Invite a profile (by email) to the team. Sets role + creates the
//   membership row. accepted_at is null until the invitee accepts —
//   in V1 we auto-accept on insert because there is no invite link flow.
//   Defense-in-depth: also re-verifies ownership at the app layer.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

export interface TeamMemberRow {
  id: string;
  organizer_id: string;
  profile_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

/**
 * Verifies the caller is the organizer owner (or an admin). Returns the
 * authed client + userId on success, or a 401/403 response.
 */
async function authorizeOrganizerAccess(
  req: NextRequest,
  organizerId: string
): Promise<{ ok: true; authed: Awaited<ReturnType<typeof createAuthedClient>>; userId: string; service: ReturnType<typeof createServiceClient> } | { ok: false; response: NextResponse }> {
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

  // Admin bypass — but we still need a service client for some reads.
  const { data: callerProfile } = await authed
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (callerProfile?.role === 'admin') {
    return { ok: true, authed, userId: session.user.id, service: createServiceClient() };
  }

  // Otherwise: must own the organizer.
  const { data: org } = await authed
    .from('organizers')
    .select('id, profile_id')
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

  return { ok: true, authed, userId: session.user.id, service: createServiceClient() };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { id: organizerId } = await params;
  if (!organizerId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'organizer id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const guard = await authorizeOrganizerAccess(req, organizerId);
  if (!guard.ok) return guard.response;

  // Service-role is justified here ONLY to read the join (profile.full_name,
  // email, avatar_url) which RLS would let the joiner see anyway, but the
  // joined view is wider than the caller's own organizer context.
  const { data, error, count } = await guard.service
    .from('organizer_team_members')
    .select(`
      id, organizer_id, profile_id, role, invited_at, accepted_at, created_at, updated_at,
      profile:profiles!organizer_team_members_profile_id_fkey(full_name, email, avatar_url)
    `, { count: 'exact' })
    .eq('organizer_id', organizerId)
    .order('invited_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows: TeamMemberRow[] = (data ?? []).map((r) => {
    const p = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    return {
      id: r.id,
      organizer_id: r.organizer_id,
      profile_id: r.profile_id,
      role: r.role,
      invited_at: r.invited_at,
      accepted_at: r.accepted_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      full_name: p?.full_name ?? null,
      email: p?.email ?? null,
      avatar_url: p?.avatar_url ?? null,
    };
  });

  return NextResponse.json({
    data: rows,
    meta: { total: count ?? 0, page: 1, limit: rows.length },
  } satisfies ListEnvelope<TeamMemberRow>);
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { id: organizerId } = await params;
  if (!organizerId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'organizer id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const guard = await authorizeOrganizerAccess(req, organizerId);
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

  const parsed = inviteSchema.safeParse(body);
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

  // Resolve profile by email (service-role needed because RLS would only
  // let the caller see their own profile row).
  const { data: profile, error: profErr } = await guard.service
    .from('profiles')
    .select('id')
    .eq('email', parsed.data.email.toLowerCase())
    .maybeSingle();

  if (profErr) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: profErr.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  if (!profile) {
    return NextResponse.json(
      { error: { code: 'PROFILE_NOT_FOUND', message: 'No profile with that email' } } satisfies ErrorEnvelope,
      { status: 404 }
    );
  }

  // Insert team member. V1 auto-accepts (no invite-link flow yet).
  const { data, error } = await guard.service
    .from('organizer_team_members')
    .insert({
      organizer_id: organizerId,
      profile_id: profile.id,
      role: parsed.data.role,
      accepted_at: new Date().toISOString(),
    })
    .select(`
      id, organizer_id, profile_id, role, invited_at, accepted_at, created_at, updated_at,
      profile:profiles!organizer_team_members_profile_id_fkey(full_name, email, avatar_url)
    `)
    .single();

  if (error) {
    // 23505 = unique violation (already a member)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: { code: 'ALREADY_MEMBER', message: 'Profile is already on this team' } } satisfies ErrorEnvelope,
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const p = Array.isArray(data.profile) ? data.profile[0] : data.profile;
  const row: TeamMemberRow = {
    id: data.id,
    organizer_id: data.organizer_id,
    profile_id: data.profile_id,
    role: data.role,
    invited_at: data.invited_at,
    accepted_at: data.accepted_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    full_name: p?.full_name ?? null,
    email: p?.email ?? null,
    avatar_url: p?.avatar_url ?? null,
  };

  return NextResponse.json(row, { status: 201 });
}
