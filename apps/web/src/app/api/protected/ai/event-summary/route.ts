// ============================================================================
// POST /api/protected/ai/event-summary
// AI-015 — One-click TL;DR for a long event description. Loads the event
// server-side (service-role — the summary needs the full description +
// capacity regardless of the caller's RLS view), calls generateEventSummary,
// and returns { summary, highlights }. Best-effort: ok:false + data:null on
// AI failure so the client shows a "couldn't summarize" state, never a 500.
//
// Auth-gated + per-user rate-limited to keep the (potentially paid) AI call
// off anonymous traffic — the public event page shows the button only to
// signed-in users.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { aiGenerateEventSummary } from '@/lib/ai/service';
import { consumeRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/ai/rate-limit';
import { initializeAI } from '@/lib/ai/init';
import type { ErrorEnvelope } from '@/lib/api';

const RequestSchema = z.object({
  event_id: z.string().uuid(),
});

interface SummaryResponse {
  ok: boolean;
  data: { summary: string; highlights: string[] } | null;
  reason?: string;
}

export async function POST(req: NextRequest) {
  initializeAI();

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

  // Profile-existence check before touching the rate-limit bucket (the
  // bucket table FKs to profiles; a slow onUserCreated insert would 500).
  const { data: profile } = await authed
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ ok: false, data: null, reason: 'NO_PROFILE' } satisfies SummaryResponse);
  }

  const limit = await consumeRateLimit(service, userId, RATE_LIMITS.recommendations);
  if (!limit.ok) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many AI requests. Try again shortly.' } } satisfies ErrorEnvelope,
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'event_id (uuid) is required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Load the event (service-role: approved events are public, but we read a
  // stable, complete row regardless of the caller's RLS scope).
  const { data: event } = await service
    .from('events')
    .select('title, description, event_type, start_date, end_date, capacity, registrations_count, venue:venues(name)')
    .eq('id', parsed.data.event_id)
    .maybeSingle();

  if (!event) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found' } } satisfies ErrorEnvelope,
      { status: 404, headers: rateLimitHeaders(limit) }
    );
  }

  const venueName = (event.venue as unknown as { name?: string } | null)?.name ?? null;

  const result = await aiGenerateEventSummary({
    title: String(event.title ?? ''),
    description: String(event.description ?? ''),
    event_type: String(event.event_type ?? ''),
    start_date: String(event.start_date ?? ''),
    end_date: String(event.end_date ?? ''),
    venue_name: venueName,
    registrations_count: Number(event.registrations_count ?? 0),
    capacity: Number(event.capacity ?? 0),
  });

  return NextResponse.json(
    { ok: result.ok, data: result.data ?? null } satisfies SummaryResponse,
    { headers: rateLimitHeaders(limit) }
  );
}
