// ============================================================================
// GET /api/protected/organizers/me
//   Returns the caller's primary organizer id (single row, or null if
//   they're not an organizer). Used by the org dashboard to wire the
//   stats route without exposing the organizer's row to the client.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

export interface MeOrganizer {
  organizerId: string | null;
  name: string | null;
  isVerified: boolean;
}

export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { data, error } = await supabase
    .from('organizers')
    .select('id, name, is_verified')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const result: MeOrganizer = {
    organizerId: data?.id ?? null,
    name: data?.name ?? null,
    isVerified: data?.is_verified ?? false,
  };

  return NextResponse.json(result);
}
