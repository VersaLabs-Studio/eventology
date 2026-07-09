import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/org/become
 *
 * Self-service organizer APPLICATION only. Creates a PENDING organizer row
 * (is_verified=false, verification_status='pending'). The role stays
 * 'attendee' — it is granted ONLY on admin verification via setUserRole()
 * (see lib/auth/server.ts), called from the admin verify route. This is the
 * linchpin of the organizer role model: self-signup must never grant access.
 *
 * GET /api/protected/org/become
 *   Returns the caller's current organizer application status so the
 *   become page can branch its UI (none / pending / verified / rejected).
 */
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('organizers')
    .select('id, name, verification_status, verification_notes')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ status: null });
  }

  return NextResponse.json({
    status: data.verification_status,
    reason: data.verification_notes ?? null,
    name: data.name,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const userEmail = session.user.email;
  const userName = (session.user as { name?: string }).name || userEmail.split('@')[0];

  // Service-role client bypasses RLS for the organizer insert. App-level
  // auth is verified above via auth.api.getSession; this is ownership-safe.
  const supabase = createServiceClient();

  // 1. Check if the user already has an organizer application
  const { data: existing } = await supabase
    .from('organizers')
    .select('id, verification_status')
    .eq('profile_id', userId)
    .maybeSingle();

  if (existing) {
    // Already applied — return the current status. Do NOT bump the role.
    return NextResponse.json({
      ok: true,
      alreadyOrganizer: true,
      status: existing.verification_status,
    });
  }

  // 2. Generate a slug from the user's name
  const baseSlug = userName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Check slug uniqueness, append random suffix if needed
  let slug = baseSlug;
  const { data: slugCheck } = await supabase
    .from('organizers')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (slugCheck) {
    slug = `${baseSlug}-${userId.slice(0, 6)}`;
  }

  // 3. Create the organizer record — PENDING. Role granted only on admin verify.
  const { error: orgError } = await supabase
    .from('organizers')
    .insert({
      profile_id: userId,
      name: userName,
      slug,
      email: userEmail,
      is_verified: false,
      verification_status: 'pending',
    });

  if (orgError) {
    console.error('[OrgBecome] Failed to create organizer:', orgError);
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Failed to create organizer profile' } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Role stays 'attendee'. No profile/role mutation here — verification is
  // the only path that grants the organizer role (see setUserRole).
  return NextResponse.json({ ok: true, status: 'pending' });
}
