// ============================================================================
// @eventology/schemas — Collection Zod Schemas
// Source: 040_collections.sql
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

export const collectionVisibilitySchema = z.enum(['public', 'unlisted', 'private']);

// Full row shape (mirrors the generated `CollectionRow` from database.types.ts).
export const collectionSchema = z.object({
  id: pgUuid(),
  owner_id: pgUuid().nullable(),
  title: z.string().min(1).max(120),
  description: z.string().nullable(),
  slug: z.string(),
  cover_url: z.string().nullable(),
  is_editorial: z.boolean(),
  is_featured: z.boolean(),
  visibility: collectionVisibilitySchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Create payload — user lists only. `owner_id` is session-injected; slug is
// generated server-side (title→slug + short id); `is_editorial`/`is_featured`
// are NEVER client-settable (RLS + route enforce; admin route owns editorial).
export const createCollectionSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  visibility: collectionVisibilitySchema.optional(),
});

// Update payload — rename / visibility / cover. is_editorial/is_featured are
// deliberately absent (admin-only, via the service-role admin route).
export const updateCollectionSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  visibility: collectionVisibilitySchema.optional(),
  cover_url: z.string().nullable().optional(),
});

// Inferred types
export type CollectionFormData = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionData = z.infer<typeof updateCollectionSchema>;
