// ============================================================================
// @eventology/schemas — User Follow Zod Schemas
// Source: 038_social_graph.sql
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `UserFollowRow` from database.types.ts).
export const userFollowSchema = z.object({
  id: pgUuid(),
  follower_id: pgUuid(),
  following_id: pgUuid(),
  created_at: z.string().datetime(),
});

// Create payload — only `following_id` is supplied by the client.
// `follower_id` is injected server-side from the session (never trusted from client).
export const createUserFollowSchema = z.object({
  following_id: pgUuid(),
});

// Inferred types
export type UserFollowFormData = z.infer<typeof createUserFollowSchema>;
