// ============================================================================
// @eventology/schemas — Collection Item Zod Schemas
// Source: 040_collections.sql
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `CollectionItemRow` from database.types.ts).
export const collectionItemSchema = z.object({
  id: pgUuid(),
  collection_id: pgUuid(),
  event_id: pgUuid(),
  position: z.number().int().min(0),
  created_at: z.string().datetime(),
});

// Add-event payload — `collection_id` comes from the URL path; `position` is
// optional (appends at the end when omitted). Idempotent via
// UNIQUE(collection_id, event_id) → 23505 → 200 already.
export const createCollectionItemSchema = z.object({
  event_id: pgUuid(),
  position: z.number().int().min(0).optional(),
});

// Inferred types
export type CollectionItemFormData = z.infer<typeof createCollectionItemSchema>;
