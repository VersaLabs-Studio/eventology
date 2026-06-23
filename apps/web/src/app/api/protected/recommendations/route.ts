// ============================================================================
// GET /api/protected/recommendations
// AI-003 — Personalized event recommendations for the signed-in user.
// Loads the user's preferences + past attendance + available events,
// calls recommendEvents, returns a ranked list. Best-effort: returns
// { data: [], ok: false } on AI failure (no 500) so the home rail can
// fall back to "no recommendations" gracefully.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { aiRecommendEvents } from '@/lib/ai/service';
import { consumeRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/ai/rate-limit';
import { initializeAI } from '@/lib/ai/init';
import type { ErrorEnvelope } from '@/lib/api';

export async function GET(_req: NextRequest) {
  initializeAI();

  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const service = createServiceClient();
  const authed = await createAuthedClient(userId);

  // W5: Check profile existence BEFORE rate-limit. The onUserCreated
  // callback (auth/server.ts:38) inserts into Supabase `profiles`
  // asynchronously — if the insert is slow or fails, the profiles row
  // won't exist when consumeRateLimit tries to UPSERT into
  // ai_rate_limit_buckets (FK violation). By checking first, we return
  // early with NO_PROFILE and never hit the bucket table.
  const { data: profile } = await authed
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({
      ok: false,
      data: [],
      reason: 'NO_PROFILE',
    });
  }

  // Rate-limit (per-user) — now safe: profiles row is confirmed to exist.
  const limit = await consumeRateLimit(service, userId, RATE_LIMITS.recommendations);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many recommendation requests. Try again shortly.',
        },
      } satisfies ErrorEnvelope,
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  // 2. Load past attendance: registrations with status='confirmed' or
  // 'checked_in', joined to the event for category/type hints.
  // Service-role read — we need cross-table reads that RLS does not
  // permit (the user only sees their own registrations, but the AI
  // needs the event row's category/event_type).
  const { data: pastAtt } = await service
    .from('registrations')
    .select('event_id, rating:reviews(rating), events!inner(category_id, event_type, categories(name))')
    .eq('user_id', userId)
    .in('status', ['confirmed', 'checked_in'])
    .limit(20);

  const past_attendance = (pastAtt ?? [])
    .map((r) => {
      // The join shape is a bit awkward from supabase-js; narrow carefully
      const events = r.events as unknown as
        | { categories?: { name?: string } | null; event_type?: string }
        | null;
      const ratingData = r.rating as unknown as { rating?: number } | { rating?: number }[] | null;
      const rating = Array.isArray(ratingData) ? ratingData[0]?.rating : ratingData?.rating;
      return {
        event_id: r.event_id,
        category: events?.categories?.name ?? 'unknown',
        rating: typeof rating === 'number' ? rating : 3,
      };
    })
    .filter((p) => p.category !== 'unknown');

  // 3. Load available events (upcoming, approved) — service-role for
  // a wider view than the user's RLS permits.
  const { data: events } = await service
    .from('events')
    .select('id, title, event_type, start_date, ticket_tiers(price)')
    .eq('status', 'approved')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(30);

  // Cross-reference category names from the events by looking up via
  // a small join — supabase-js already gave us the FK; the cheaper path
  // is to include `category:categories(name, slug)` in the select
  // (we did via the events select above? no — re-query)
  const { data: eventsWithCategory } = await service
    .from('events')
    .select('id, title, event_type, start_date, category:categories(name), ticket_tiers(price)')
    .eq('status', 'approved')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(30);

  const available_events = (eventsWithCategory ?? []).map((e) => {
    const tier = Array.isArray(e.ticket_tiers) ? e.ticket_tiers[0] : null;
    const category = (e.category as unknown as { name?: string } | null)?.name ?? 'General';
    return {
      id: e.id,
      title: e.title,
      category,
      event_type: e.event_type,
      tags: [] as string[],
      start_date: e.start_date,
      ...(tier?.price != null ? { price: Number(tier.price) } : {}),
    };
  });

  // Drop events the user has already registered for
  const registeredIds = new Set((pastAtt ?? []).map((r) => r.event_id));
  const filtered = available_events.filter((e) => !registeredIds.has(e.id)).slice(0, 10);

  // 4. Call the AI service. Always best-effort.
  const result = await aiRecommendEvents({
    user_id: userId,
    past_attendance,
    available_events: filtered,
    limit: 5,
  });

  // Even on ok=false, the response is well-formed (empty list). The
  // home rail shows a graceful "no recommendations" state.
  return NextResponse.json(
    {
      ok: result.ok,
      data: result.data?.recommendations ?? [],
    },
    { headers: rateLimitHeaders(limit) }
  );
}
