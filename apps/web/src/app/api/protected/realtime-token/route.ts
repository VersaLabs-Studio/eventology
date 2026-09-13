import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signRealtimeJWT } from '@/lib/supabase/jwt';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/realtime-token — the Realtime auth bridge (HO-M).
 *
 * The browser Supabase client is anon-keyed (better-auth session, no
 * Supabase JWT), so `auth.uid()` is NULL on a raw socket and RLS-gated
 * realtime streams yield nothing. This endpoint mints a SHORT-LIVED
 * (10m) Supabase JWT for the session user only; the live hook feeds it to
 * `supabase.realtime.setAuth()` and refreshes ~60s before expiry.
 *
 * Security posture: session-gated, token never touches storage, expiry
 * clock is authoritative server-side. Do NOT widen the TTL, do NOT accept
 * a profile id from the client.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const token = await signRealtimeJWT(session.user.id);

  return NextResponse.json(
    { token, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
