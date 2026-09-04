// ============================================================================
// @eventology/schemas — Badge Zod Schemas
// Source: 041_gamification.sql
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

export const badgeTierSchema = z.enum(['bronze', 'silver', 'gold']);

// Full row shape (mirrors the generated `BadgeRow` from database.types.ts).
export const badgeSchema = z.object({
  id: pgUuid(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  tier: badgeTierSchema,
  points: z.number().int().min(0),
});

// Catalog mutations are admin-only via the service-role route — this schema
// is consumed there; no user-facing create path exists.
export const adminBadgeUpsertSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(64),
  tier: badgeTierSchema.optional(),
  points: z.number().int().min(0).optional(),
});

// Inferred types
export type AdminBadgeUpsertData = z.infer<typeof adminBadgeUpsertSchema>;
