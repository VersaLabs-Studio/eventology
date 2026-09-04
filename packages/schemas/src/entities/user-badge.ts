// ============================================================================
// @eventology/schemas — User Badge Zod Schemas
// Source: 041_gamification.sql
// ============================================================================
// Awards are system-written (fn_award_badge) — there is intentionally no
// create schema: no client, route, or admin can insert an award directly.
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';
import { badgeSchema } from './badge';

// Full row shape (mirrors the generated `UserBadgeRow` from database.types.ts).
export const userBadgeSchema = z.object({
  id: pgUuid(),
  profile_id: pgUuid(),
  badge_id: pgUuid(),
  awarded_at: z.string().datetime(),
});

/** Trophy-case entry: the award joined with its badge catalog row. */
export const earnedBadgeSchema = z.object({
  id: pgUuid(),
  awarded_at: z.string().datetime(),
  badge: badgeSchema,
});

export type EarnedBadge = z.infer<typeof earnedBadgeSchema>;
