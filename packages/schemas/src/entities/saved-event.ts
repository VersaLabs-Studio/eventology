// ============================================================================
// @eventology/schemas — Saved Event Zod Schemas
// Source: 036_saved_events.sql
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `SavedEventRow` from database.types.ts).
export const savedEventSchema = z.object({
  id: pgUuid(),
  profile_id: pgUuid(),
  event_id: pgUuid(),
  created_at: z.string().datetime(),
});

// Create payload — only `event_id` is supplied by the client.
// `profile_id` is injected server-side from the session (never trusted from client).
export const createSavedEventSchema = z.object({
  event_id: pgUuid(),
});

// Inferred types
export type SavedEventFormData = z.infer<typeof createSavedEventSchema>;
