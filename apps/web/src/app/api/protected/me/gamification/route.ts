import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/me/gamification — my badges, points, streak,
 * next-badge progress (HO-D).
 *
 * Streak is DERIVED at read (no denormalized counter): current streak =
 * total attended events (status confirmed/checked_in), matching the
 * streak_5 badge semantics ("5 events attended"). Next-badge progress is
 * computed against the same aggregates + the caller's completed hosted
 * events (super_host).
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

  const [{ data: awards }, { data: points }, { count: attended }, { data: catRows }] =
    await Promise.all([
      supabase
        .from('user_badges')
        .select('id, awarded_at, badge:badges(id, code, name, description, icon, tier, points)')
        .eq('profile_id', userId)
        .order('awarded_at', { ascending: false }),
      supabase.rpc('fn_points_total', { p_user: userId }),
      supabase
        .from('registrations')
        .select('event_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['confirmed', 'checked_in']),
      supabase
        .from('registrations')
        .select('event:events(category_id)')
        .eq('user_id', userId)
        .in('status', ['confirmed', 'checked_in']),
    ]);

  if (attended === null) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Failed to load attendance' } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const categories = new Set<string>();
  for (const row of catRows ?? []) {
    const r = row as { event?: { category_id?: string | null } | { category_id?: string | null }[] | null };
    const event = Array.isArray(r.event) ? r.event[0] : r.event;
    const categoryId = event?.category_id;
    if (categoryId) categories.add(categoryId);
  }

  // super_host progress: completed hosted events (approved + ended), matching
  // the recaps cron's completion semantics.
  let hostedCompleted = 0;
  const { data: myOrganizers } = await supabase
    .from('organizers')
    .select('id')
    .eq('profile_id', userId);
  const organizerIds = (myOrganizers ?? []).map((o) => (o as { id: string }).id);
  if (organizerIds.length > 0) {
    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .in('organizer_id', organizerIds)
      .eq('status', 'approved')
      .lt('end_date', new Date().toISOString());
    hostedCompleted = count ?? 0;
  }

  const earned = new Set(
    (awards ?? []).map((a) => (a as { badge?: { code?: string } }).badge?.code).filter(Boolean) as string[]
  );

  // Next badge = first unearned in fixed priority order, with progress.
  const targets = [
    { code: 'first_event', target: 1, current: Math.min(attended, 1) },
    { code: 'streak_5', target: 5, current: attended },
    { code: 'explorer', target: 5, current: categories.size },
    { code: 'super_host', target: 10, current: hostedCompleted },
  ] as const;
  const nextTarget = targets.find((t) => !earned.has(t.code)) ?? null;

  return NextResponse.json({
    pointsTotal: points ?? 0,
    badges: awards ?? [],
    streak: attended, // derived; see doc comment
    nextBadge: nextTarget
      ? {
          code: nextTarget.code,
          target: nextTarget.target,
          current: nextTarget.current,
        }
      : null,
  });
}
