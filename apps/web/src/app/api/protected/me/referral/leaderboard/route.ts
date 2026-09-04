import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/me/referral/leaderboard — top referrers by QUALIFIED
 * (rewarded) count (HO-E). Cross-user aggregate served via the SECURITY
 * DEFINER fn_referral_leaderboard (redemptions themselves stay
 * involved-visible only; the function exposes just rank/name/count).
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 10)));

  const supabase = await createAuthedClient(session.user.id);
  const { data, error } = await supabase.rpc('fn_referral_leaderboard', { p_limit: limit });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}
