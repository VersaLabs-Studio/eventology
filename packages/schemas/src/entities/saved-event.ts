// ============================================================================
// @eventology/schemas — Saved Event Zod Schemas
// Source: 036_saved_events.sql
// ============================================================================

import { z } from 'zod';

// Full row shape (mirrors the generated `SavedEventRow` from database.types.ts).
export const savedEventSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  event_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

// Create payload — only `event_id` is supplied by the client.
// `profile_id` is injected server-side from the session (never trusted from client).
export const createSavedEventSchema = z.object({
  event_id: z.string().uuid(),
});

// Inferred types
export type SavedEventFormData = z.infer<typeof createSavedEventSchema>;
