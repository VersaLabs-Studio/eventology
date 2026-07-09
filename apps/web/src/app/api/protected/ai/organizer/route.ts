// ============================================================================
// POST /api/protected/ai/organizer
// AI-004 — Consolidated organizer-assist route. One POST handles all
// nine organizer-facing AI tasks (description, tags, marketing, pricing,
// narrative, insights, prediction, report, recap) via a `task` field in
// the body. Organizer/admin role-guarded (caller must own the event
// OR be admin). Rate-limited per-user.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { requireOrganizerOwnership, getCallerContext } from '@/lib/ai/role-guard';
import { consumeRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/ai/rate-limit';
import {
  aiGenerateEventDescription,
  aiGenerateEventTags,
  aiGenerateMarketingCopy,
  aiGeneratePricingSuggestion,
  aiGenerateAnalyticsNarrative,
  aiGenerateAttendeeInsights,
  aiGeneratePerformancePrediction,
  aiGenerateReport,
  aiGenerateEventRecap,
} from '@/lib/ai/service';
import type { ErrorEnvelope } from '@/lib/api';

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const TaskSchema = z.enum([
  'description',
  'tags',
  'marketing',
  'pricing',
  'narrative',
  'insights',
  'prediction',
  'report',
  'recap',
]);

const RequestSchema = z.object({
  task: TaskSchema,
  event_id: z.string().uuid().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
});

type Task = z.infer<typeof TaskSchema>;

// ---------------------------------------------------------------------------
// Per-task handlers
// ---------------------------------------------------------------------------

type TaskHandler = (params: {
  authed: Awaited<ReturnType<typeof createAuthedClient>>;
  service: ReturnType<typeof createServiceClient>;
  eventId: string;
  input: Record<string, unknown>;
}) => Promise<unknown>;

const TASK_HANDLERS: Record<Task, TaskHandler> = {
  description: async ({ eventId, input }) => {
    const result = await aiGenerateEventDescription({
      title: String(input.title ?? ''),
      event_type: String(input.event_type ?? ''),
      category: String(input.category ?? ''),
      venue_name: (input.venue_name as string | null | undefined) ?? null,
      start_date: String(input.start_date ?? ''),
      tags: Array.isArray(input.tags) ? (input.tags as string[]) : undefined,
      short_description: (input.short_description as string | null | undefined) ?? null,
    });
    // Unwrap the AIServiceResult envelope so the response `data` is the
    // actual output (e.g. { description, short_description }) the client
    // expects — not the { ok, data, error } envelope.
    return result.data ?? {};
  },

  tags: async ({ eventId, input }) => {
    const result = await aiGenerateEventTags({
      title: String(input.title ?? ''),
      description: String(input.description ?? ''),
      event_type: String(input.event_type ?? ''),
      category: String(input.category ?? ''),
    });
    // Unwrap the AIServiceResult envelope so the response `data` is the
    // actual output (e.g. { description, short_description }) the client
    // expects — not the { ok, data, error } envelope.
    return result.data ?? {};
  },

  marketing: async ({ eventId, input }) => {
    const platform = String(input.platform ?? 'email') as 'email' | 'social' | 'sms' | 'push';
    const tone = (input.tone as 'professional' | 'casual' | 'exciting' | 'urgent' | undefined) ?? 'exciting';
    const result = await aiGenerateMarketingCopy({
      event_title: String(input.event_title ?? ''),
      event_description: String(input.event_description ?? ''),
      event_type: String(input.event_type ?? ''),
      target_audience: String(input.target_audience ?? 'general'),
      platform,
      tone,
    });
    // Unwrap the AIServiceResult envelope so the response `data` is the
    // actual output (e.g. { description, short_description }) the client
    // expects — not the { ok, data, error } envelope.
    return result.data ?? {};
  },

  pricing: async ({ eventId, input }) => {
    const organizer_tier = (input.organizer_tier as 'new' | 'established' | 'premium' | undefined) ?? 'new';
    const result = await aiGeneratePricingSuggestion({
      event_type: String(input.event_type ?? ''),
      category: String(input.category ?? ''),
      venue_capacity: Number(input.venue_capacity ?? 100),
      target_audience: String(input.target_audience ?? 'general'),
      comparable_event_prices: Array.isArray(input.comparable_event_prices)
        ? (input.comparable_event_prices as number[])
        : undefined,
      organizer_tier,
    });
    // Unwrap the AIServiceResult envelope so the response `data` is the
    // actual output (e.g. { description, short_description }) the client
    // expects — not the { ok, data, error } envelope.
    return result.data ?? {};
  },

  narrative: async ({ eventId, input }) => {
    const result = await aiGenerateAnalyticsNarrative({
      event_title: String(input.event_title ?? ''),
      registrations_count: Number(input.registrations_count ?? 0),
      capacity: Number(input.capacity ?? 0),
      views_count: Number(input.views_count ?? 0),
      revenue: input.revenue != null ? Number(input.revenue) : undefined,
      period_label: String(input.period_label ?? 'this period'),
      previous_registrations: input.previous_registrations != null ? Number(input.previous_registrations) : undefined,
      previous_views: input.previous_views != null ? Number(input.previous_views) : undefined,
    });
    // Unwrap the AIServiceResult envelope so the response `data` is the
    // actual output (e.g. { description, short_description }) the client
    // expects — not the { ok, data, error } envelope.
    return result.data ?? {};
  },

  insights: async ({ eventId, input }) => {
    const result = await aiGenerateAttendeeInsights({
      event_title: String(input.event_title ?? ''),
      total_registrations: Number(input.total_registrations ?? 0),
      checked_in_count: Number(input.checked_in_count ?? 0),
      cancelled_count: Number(input.cancelled_count ?? 0),
      ticket_tiers: Array.isArray(input.ticket_tiers)
        ? (input.ticket_tiers as Array<{ name: string; sold: number; capacity: number }>)
        : [],
      registration_dates: Array.isArray(input.registration_dates)
        ? (input.registration_dates as string[])
        : [],
      top_sub_cities: Array.isArray(input.top_sub_cities)
        ? (input.top_sub_cities as string[])
        : undefined,
    });
    // Unwrap the AIServiceResult envelope so the response `data` is the
    // actual output (e.g. { description, short_description }) the client
    // expects — not the { ok, data, error } envelope.
    return result.data ?? {};
  },

  prediction: async ({ eventId, input }) => {
    const result = await aiGeneratePerformancePrediction({
      event_title: String(input.event_title ?? ''),
      event_type: String(input.event_type ?? ''),
      days_until_event: Number(input.days_until_event ?? 0),
      current_registrations: Number(input.current_registrations ?? 0),
      capacity: Number(input.capacity ?? 0),
      views_trend: Array.isArray(input.views_trend) ? (input.views_trend as number[]) : [],
      registrations_trend: Array.isArray(input.registrations_trend)
        ? (input.registrations_trend as number[])
        : [],
      is_featured: input.is_featured === true,
    });
    // Unwrap the AIServiceResult envelope so the response `data` is the
    // actual output (e.g. { description, short_description }) the client
    // expects — not the { ok, data, error } envelope.
    return result.data ?? {};
  },

  report: async ({ eventId, input }) => {
    const report_type = String(input.report_type ?? 'event') as
      | 'event' | 'organizer' | 'platform' | 'financial';
    const audience = String(input.audience ?? 'organizer') as
      | 'organizer' | 'admin' | 'external';
    const result = await aiGenerateReport({
      report_type,
      title: String(input.title ?? ''),
      data: (input.data as Record<string, unknown>) ?? {},
      period: {
        start: String(input.period_start ?? ''),
        end: String(input.period_end ?? ''),
      },
      audience,
    });
    // Unwrap the AIServiceResult envelope so the response `data` is the
    // actual output (e.g. { description, short_description }) the client
    // expects — not the { ok, data, error } envelope.
    return result.data ?? {};
  },

  recap: async ({ eventId, input }) => {
    const result = await aiGenerateEventRecap({
      event_title: String(input.event_title ?? ''),
      event_type: String(input.event_type ?? ''),
      description: String(input.description ?? ''),
      start_date: String(input.start_date ?? ''),
      end_date: String(input.end_date ?? ''),
      venue_name: (input.venue_name as string | null | undefined) ?? null,
      total_registrations: Number(input.total_registrations ?? 0),
      checked_in_count: Number(input.checked_in_count ?? 0),
      capacity: Number(input.capacity ?? 0),
      highlights: Array.isArray(input.highlights) ? (input.highlights as string[]) : undefined,
      feedback_summary: (input.feedback_summary as string | undefined) ?? undefined,
      revenue: input.revenue != null ? Number(input.revenue) : undefined,
    });
    // Unwrap the AIServiceResult envelope so the response `data` is the
    // actual output (e.g. { description, short_description }) the client
    // expects — not the { ok, data, error } envelope.
    return result.data ?? {};
  },
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

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

  // Per-user rate limit
  const limit = await consumeRateLimit(service, userId, RATE_LIMITS.organizer);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many AI requests. Try again shortly.',
        },
      } satisfies ErrorEnvelope,
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  // Validate body
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
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.flatten(),
        },
      } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const { task, event_id, input = {} } = parsed.data;

  const authed = await createAuthedClient(userId);

  // Role guard.
  //  • event_id present  → require ownership of that event (edit flow).
  //  • event_id absent   → create flow: the event doesn't exist yet, so we
  //    only gate on organizer/admin role (description/tags tasks don't touch
  //    event rows). This unblocks the AI-assist button on the create form.
  if (event_id) {
    const guard = await requireOrganizerOwnership(authed, session.user, event_id);
    if (!guard.ok) {
      return NextResponse.json(
        {
          error: {
            code: guard.reason ?? 'FORBIDDEN',
            message:
              guard.reason === 'NOT_OWNER'
                ? 'You do not own this event.'
                : 'You are not authorized to use AI for this event.',
          },
        } satisfies ErrorEnvelope,
        { status: guard.reason === 'NOT_OWNER' || guard.reason === 'NOT_ORGANIZER' || guard.reason === 'NO_ORGANIZER_PROFILE' ? 403 : 401 }
      );
    }
  } else {
    const ctx = await getCallerContext(authed, session.user);
    if (!ctx.ok) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
        { status: 401 }
      );
    }
    if (ctx.profileRole !== 'organizer' && ctx.profileRole !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Organizer or admin role required to use AI assist.' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
  }

  // Dispatch
  const handler = TASK_HANDLERS[task];
  const data = await handler({
    authed,
    service,
    eventId: event_id ?? '',
    input,
  });

  return NextResponse.json({ ok: true, task, data }, { headers: rateLimitHeaders(limit) });
}
