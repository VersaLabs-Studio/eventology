import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/org/become
 *
 * Instant self-service organizer upgrade. Creates an organizer profile
 * and grants the organizer role. Respects existing RLS — the
 * "Organizers: authenticated create" policy (016:143) allows any
 * authenticated user to insert into the organizers table.
 *
 * Post-MVP: admin verification stays gated by is_verified = false.
 * This just grants the role + creates the organizer row.
 */
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

  // Use the service-role client to bypass RLS for the organizer insert
  // and profile update (the authenticated create policy allows it, but
  // the service-role client is simpler for this server-side operation).
  const supabase = await createClient();

  // 1. Check if the user already has an organizer profile
  const { data: existing } = await supabase
    .from('organizers')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (existing) {
    // Already an organizer — just update the role if needed and redirect
    await supabase
      .from('profiles')
      .update({ role: 'organizer' })
      .eq('id', userId);

    return NextResponse.json({ ok: true, alreadyOrganizer: true });
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

  // 3. Create the organizer record
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

  // 4. Update the profile role to organizer
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'organizer' })
    .eq('id', userId);

  if (profileError) {
    console.error('[OrgBecome] Failed to update profile role:', profileError);
    // Non-fatal — the organizer record exists, the role will be synced
  }

  // 5. Update the better-auth user's role directly in the database
  //    better-auth stores role as an additional field on its user table.
  try {
    const pool = (auth as unknown as { pool?: { query: (sql: string, args: unknown[]) => Promise<unknown> } }).pool;
    if (pool) {
      await pool.query(
        'UPDATE "user" SET role = $1 WHERE id = $2',
        ['organizer', userId]
      );
    }
  } catch (e) {
    console.error('[OrgBecome] Failed to update auth user role:', e);
    // Non-fatal — the organizer record exists, role will be synced on next session
  }

  return NextResponse.json({ ok: false, redirect: '/org/dashboard' });
}
