// ============================================================================
// @eventology/schemas — Calendar Feed Token Zod Schemas (HO-K)
// Source: 048_calendar_feed_tokens.sql
// ============================================================================
// The token is a server-generated bearer credential — NEVER client-supplied.
// The create schema therefore accepts `kind` only.
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `CalendarFeedTokenRow`).
export const calendarFeedTokenSchema = z.object({
  id: pgUuid(),
  profile_id: pgUuid(),
  token: z.string().min(1),
  kind: z.enum(['my_events', 'saved']),
  revoked: z.boolean(),
  created_at: z.string().datetime(),
});

// POST /api/protected/me/calendar-feed — token + profile_id are injected
// server-side (session + crypto). Kind only.
export const calendarFeedTokenCreateSchema = z.object({
  kind: z.enum(['my_events', 'saved']).default('my_events'),
});

export type CalendarFeedTokenCreateData = z.infer<typeof calendarFeedTokenCreateSchema>;
