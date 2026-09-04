// ============================================================================
// @eventology/schemas — Event Media Zod Schemas
// Source: 043_event_media.sql
// ============================================================================
// Uploads: the file itself goes through the EXISTING /api/protected/upload
// seam (bucket 'event-media'); this schema validates the metadata row the
// client then registers. Moderation status is server-controlled.
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

export const mediaStatusSchema = z.enum(['pending', 'approved', 'hidden']);

// Full row shape (mirrors the generated `EventMediaRow` from database.types.ts).
export const eventMediaSchema = z.object({
  id: pgUuid(),
  event_id: pgUuid(),
  uploader_id: pgUuid(),
  storage_path: z.string().min(1).max(2048),
  caption: z.string().max(280).nullable(),
  status: mediaStatusSchema,
  created_at: z.string().datetime(),
});

// Register payload (after the upload seam has returned the public URL).
// `uploader_id` and `status` are server-controlled.
export const createEventMediaSchema = z.object({
  event_id: pgUuid(),
  storage_path: z.string().min(1).max(2048),
  caption: z.string().max(280).optional(),
});

// Update payload — caption edits (own or host) and status transitions
// (HOST ONLY at the route level; RLS em_update_own_or_host backstops).
export const updateEventMediaSchema = z.object({
  caption: z.string().max(280).nullable().optional(),
  status: mediaStatusSchema.optional(),
});

// Inferred types
export type EventMediaFormData = z.infer<typeof createEventMediaSchema>;
export type UpdateEventMediaData = z.infer<typeof updateEventMediaSchema>;
