// ============================================================================
// @eventology/schemas — Feed Activity Zod Schemas
// Source: 038_social_graph.sql
// ============================================================================
// `feedActivitySchema` mirrors the raw row. `FeedItem` is the derived,
// endpoint-joined shape served by GET /api/protected/feed (actor + event +
// target user/organizer resolved). Rows are written exclusively by DB
// triggers — there is no client create schema by design.
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

export const feedVerbSchema = z.enum([
  'saved_event',
  'registered_event',
  'reviewed_event',
  'followed_user',
  'followed_organizer',
]);

// Full row shape (mirrors the generated `FeedActivityRow` from database.types.ts).
export const feedActivitySchema = z.object({
  id: pgUuid(),
  actor_id: pgUuid(),
  verb: feedVerbSchema,
  event_id: pgUuid().nullable(),
  target_user_id: pgUuid().nullable(),
  target_organizer_id: pgUuid().nullable(),
  created_at: z.string().datetime(),
});

// Minimal actor/target profile projection used in feed items.
export const feedActorSchema = z.object({
  id: pgUuid(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
});

// Minimal event projection used in feed items.
export const feedEventSchema = z.object({
  id: pgUuid(),
  title: z.string(),
  slug: z.string(),
  banner_image: z.string().nullable(),
});

// Minimal organizer projection used in feed items.
export const feedOrganizerSchema = z.object({
  id: pgUuid(),
  name: z.string(),
  slug: z.string(),
  avatar_url: z.string().nullable(),
});

/**
 * Derived application shape returned by the feed endpoint:
 * the raw activity with its joined actor, event, and targets.
 */
export const feedItemSchema = feedActivitySchema.extend({
  actor: feedActorSchema.nullable(),
  event: feedEventSchema.nullable(),
  target_user: feedActorSchema.nullable(),
  target_organizer: feedOrganizerSchema.nullable(),
});

// Inferred types
// NOTE: `FeedVerb` is intentionally NOT re-exported here — the canonical
// `FeedVerb` enum alias lives in generated/database.types.ts.
export type FeedItem = z.infer<typeof feedItemSchema>;
