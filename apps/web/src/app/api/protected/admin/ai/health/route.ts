// ============================================================================
// POST /api/protected/admin/ai/health
// AI-006 — Admin dashboard: platform health summary. Computes a
// snapshot of the platform's health metrics, then asks the AI to
// narrate it. Returns the AI narrative + the raw snapshot for the
// admin dashboard to render.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/ai/role-guard';
import { aiGeneratePlatformHealthSummary } from '@/lib/ai/service';
import { consumeRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/ai/rate-limit';
import type { ErrorEnvelope } from '@/lib/api';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }
  const userId = session.user.id;
  const service = createServiceClient();
  const authed = await createAuthedClient(userId);

  const limit = await consumeRateLimit(service, userId, RATE_LIMITS.admin);
  if (!limit.ok) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many admin requests' } } satisfies ErrorEnvelope,
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const guard = await requireAdmin(authed, session.user);
  if (!guard.ok) {
    return NextResponse.json(
      { error: { code: guard.reason ?? 'FORBIDDEN', message: 'Admin only' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Compute the snapshot (small set of cheap aggregates)
  const [
    eventsRes,
    activeEventsRes,
    usersRes,
    newUsersRes,
    regsRes,
    pendingModsRes,
    flaggedRes,
  ] = await Promise.all([
    service.from('events').select('id', { count: 'exact', head: true }),
    service.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    service.from('profiles').select('id', { count: 'exact', head: true }),
    service.from('profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    service.from('registrations').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    service.from('content_moderation').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    service.from('fraud_signals').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  const total_events = eventsRes.count ?? 0;
  const active_events = activeEventsRes.count ?? 0;
  const total_users = usersRes.count ?? 0;
  const new_users_period = newUsersRes.count ?? 0;
  const total_registrations = regsRes.count ?? 0;
  const pending_moderations = pendingModsRes.count ?? 0;
  const flagged_content = flaggedRes.count ?? 0;

  // Best-effort: also try to read total revenue from payments (defensive)
  let revenue_period = 0;
  try {
    const { data } = await service
      .from('payments')
      .select('organizer_amount')
      .eq('status', 'completed')
      .gte('paid_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    revenue_period = (data ?? []).reduce((sum, p) => sum + Number((p as { organizer_amount?: number }).organizer_amount ?? 0), 0);
  } catch {
    // payment column may not exist yet on some envs — best-effort
  }

  const result = await aiGeneratePlatformHealthSummary({
    total_events,
    active_events,
    total_users,
    new_users_period,
    total_registrations,
    revenue_period: Math.round(revenue_period * 100) / 100,
    pending_moderations,
    flagged_content,
    system_errors: 0, // surfaced from observability in a future iteration
    period_label: 'the last 30 days',
  });

  return NextResponse.json(
    {
      ok: result.ok,
      data: result.data,
      snapshot: {
        total_events,
        active_events,
        total_users,
        new_users_period,
        total_registrations,
        revenue_period: Math.round(revenue_period * 100) / 100,
        pending_moderations,
        flagged_content,
      },
    },
    { headers: rateLimitHeaders(limit) }
  );
}
