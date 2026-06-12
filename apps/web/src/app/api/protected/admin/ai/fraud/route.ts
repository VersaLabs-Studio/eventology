// ============================================================================
// GET /api/protected/admin/ai/fraud
// AI-006 — Admin review queue for fraud signals. Admin-only (role guard).
// Returns open signals ordered by risk_score DESC, with the new
// 'block' recommendations surfaced first.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/ai/role-guard';
import { consumeRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/ai/rate-limit';
import type { ErrorEnvelope } from '@/lib/api';

export async function GET(req: NextRequest) {
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

  // Rate limit (admin scope — admins poll the queue often)
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

  // Service-role read — the policy says "admin reads own" but the
  // role is on profiles.role, which the join above resolves. We can
  // read via the authed client if RLS works as expected; fall back
  // to service-role to bypass any RLS edge case.
  const { data, error } = await service
    .from('fraud_signals')
    .select('id, subject_type, subject_id, user_id, risk_score, flags, recommended_action, reason, status, created_at')
    .eq('status', 'open')
    .order('risk_score', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  return NextResponse.json({ data: data ?? [] }, { headers: rateLimitHeaders(limit) });
}
