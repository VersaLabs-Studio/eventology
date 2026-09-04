import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pgUuid } from '@eventology/schemas';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/public/users/[userId]/badges — public trophy case + points total
 * (HO-D). Social proof: user_badges + badges are public-readable (RLS), the
 * points total comes via fn_points_total (point_ledger rows stay owner-only).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const parsed = pgUuid().safeParse(userId);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'A valid user id is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_badges')
    .select('id, awarded_at, badge:badges(id, code, name, description, icon, tier, points)')
    .eq('profile_id', userId)
    .order('awarded_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const { data: points, error: pointsError } = await supabase.rpc('fn_points_total', {
    p_user: userId,
  });

  if (pointsError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: pointsError.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: data ?? [],
    pointsTotal: points ?? 0,
  });
}
