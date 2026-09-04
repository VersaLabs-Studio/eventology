import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/me/referral — my code/link + redemption stats (HO-E).
 *
 * The code is AUTO-CREATED on first fetch (fn_get_or_create_referral —
 * LOCKED decision). Stats are read under RLS (ref_red_select_involved scopes
 * redemptions to the caller's involvement).
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const userId = session.user.id;

  const { data: code, error: codeError } = await supabase.rpc('fn_get_or_create_referral', {
    p_user: userId,
  });
  if (codeError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: codeError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const [{ count: signups }, { count: qualified }] = await Promise.all([
    supabase
      .from('referral_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', userId),
    supabase
      .from('referral_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .eq('status', 'rewarded'),
  ]);

  if (signups === null || qualified === null) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Failed to load referral stats' } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eventology.app';

  return NextResponse.json({
    code,
    inviteUrl: `${appUrl}/?ref=${code}`,
    signups,
    qualified,
  });
}
