// ============================================================================
// GET /api/protected/admin/ai/moderation
// AI-006 — Admin review queue for content moderation. Admin-only.
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

  const { data, error } = await service
    .from('content_moderation')
    .select('id, content_type, content_id, author_id, is_safe, severity, flags, suggested_action, reason, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  return NextResponse.json({ data: data ?? [] }, { headers: rateLimitHeaders(limit) });
}
