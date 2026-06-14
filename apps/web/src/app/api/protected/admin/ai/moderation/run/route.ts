// ============================================================================
// POST /api/protected/admin/ai/moderation/run
// AI-006 — Manually trigger moderation on a specific content_id. Admin-only.
// Closes the loop: an admin can re-moderate content that was either
// never AI-checked (fold-forward gap on event submission) or that
// needs re-evaluation after a content edit.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/ai/role-guard';
import { aiModerateContent } from '@/lib/ai/service';
import { writeModeration } from '@/lib/ai/persistence';
import { consumeRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/ai/rate-limit';
import type { ErrorEnvelope } from '@/lib/api';

const RequestSchema = z.object({
  content_type: z.enum(['event_description', 'review', 'message', 'profile_bio']),
  content_id: z.string().uuid(),
  text: z.string().min(1).max(50_000),
  context: z.string().max(2000).optional(),
});

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

  const limit = await consumeRateLimit(service, userId, RATE_LIMITS.moderation);
  if (!limit.ok) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many moderation requests' } } satisfies ErrorEnvelope,
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

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }
  const parsed = RequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid body', details: parsed.error.flatten() } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const result = await aiModerateContent({
    content: parsed.data.text,
    content_type: parsed.data.content_type,
    ...(parsed.data.context ? { context: parsed.data.context } : {}),
  });

  if (!result.ok || !result.data) {
    return NextResponse.json(
      { ok: false, reason: 'AI_UNAVAILABLE' },
      { status: 503, headers: rateLimitHeaders(limit) }
    );
  }

  // Persist a moderation row
  const rowId = await writeModeration(service, {
    content_type: parsed.data.content_type,
    content_id: parsed.data.content_id,
    author_id: null, // admin-triggered; the auth id is the admin's, not the content's author
    is_safe: result.data.is_safe,
    severity: result.data.severity,
    flags: result.data.flags,
    suggested_action: result.data.suggested_action,
    reason: result.data.reason ?? null,
    metadata: { triggered_by: 'admin_manual', admin_id: userId },
  });

  return NextResponse.json(
    { ok: true, moderation: result.data, row_id: rowId },
    { headers: rateLimitHeaders(limit) }
  );
}
