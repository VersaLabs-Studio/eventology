// ============================================================================
// @eventology/schemas — Review Zod Schemas
// Source: 010_reviews_ratings.sql
// ============================================================================

import { z } from 'zod';
import type { ReviewRow } from '../generated/database.types';

// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------

export const reviewSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).nullable(),
  content: z.string().max(5000).nullable(),
  is_approved: z.boolean(),
  is_flagged: z.boolean(),
  flag_reason: z.string().nullable(),
  moderated_by: z.string().uuid().nullable(),
  moderated_at: z.string().datetime().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}) satisfies z.ZodType<ReviewRow>;

// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------

export const createReviewSchema = reviewSchema
  .omit({
    id: true,
    is_approved: true, // Defaults to false (moderated)
    is_flagged: true,
    flag_reason: true,
    moderated_by: true,
    moderated_at: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    metadata: z.record(z.string(), z.unknown()).default({}),
  });

// ---------------------------------------------------------------------------
// Update schema (admin moderation only)
// ---------------------------------------------------------------------------

export const updateReviewSchema = z.object({
  is_approved: z.boolean().optional(),
  is_flagged: z.boolean().optional(),
  flag_reason: z.string().nullable().optional(),
  moderated_by: z.string().uuid().nullable().optional(),
  moderated_at: z.string().datetime().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type ReviewFormData = z.infer<typeof createReviewSchema>;
export type ReviewUpdateData = z.infer<typeof updateReviewSchema>;

