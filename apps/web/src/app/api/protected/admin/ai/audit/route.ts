// ============================================================================
// POST /api/protected/admin/ai/audit
// AI-006 — Admin dashboard: audit log analysis. Loads the recent audit
// log entries and asks the AI to summarize patterns, anomalies, and
// compliance posture. Admin-only.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/ai/role-guard';
import { aiAnalyzeAuditLog } from '@/lib/ai/service';
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

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await service
    .from('audit_log')
    .select('action, target_type, target_id, actor_id, details, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const entries = (data ?? []).map((row) => {
    const r = row as {
      action: string;
      target_type: string;
      target_id: string | null;
      actor_id: string | null;
      details: Record<string, unknown> | null;
      created_at: string;
    };
    return {
      action: r.action,
      target_type: r.target_type,
      target_label: r.target_id ?? undefined,
      actor_id: r.actor_id ?? undefined,
      details: r.details ? JSON.stringify(r.details) : undefined,
      created_at: r.created_at,
    };
  });

  const result = await aiAnalyzeAuditLog({
    entries,
    period_label: 'the last 7 days',
    focus: 'all',
  });

  return NextResponse.json(
    { ok: result.ok, data: result.data, entry_count: entries.length },
    { headers: rateLimitHeaders(limit) }
  );
}
