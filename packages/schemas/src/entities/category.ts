// ============================================================================
// @eventology/schemas — Category Zod Schemas
// Source: 005_categories_venues.sql
// ============================================================================

import { z } from 'zod';
import type { CategoryRow } from '../generated/database.types';

// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  icon: z.string().min(1, 'Icon name is required'), // Lucide icon name
  description: z.string().max(1000).nullable(),
  color: z.string().min(1, 'Color is required'), // Tailwind class
  event_count: z.number().int().min(0),
  sort_order: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}) satisfies z.ZodType<CategoryRow>;

// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------

export const createCategorySchema = categorySchema
  .omit({
    id: true,
    event_count: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    is_active: z.boolean().default(true),
    sort_order: z.number().int().default(0),
  });

// ---------------------------------------------------------------------------
// Update schema
// ---------------------------------------------------------------------------

export const updateCategorySchema = createCategorySchema.partial();

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CategoryFormData = z.infer<typeof createCategorySchema>;
export type CategoryUpdateData = z.infer<typeof updateCategorySchema>;

