// ============================================================================
// @eventology/schemas — Organizer Follow Zod Schemas
// Source: 037_organizer_follows.sql
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `OrganizerFollowRow` from database.types.ts).
export const organizerFollowSchema = z.object({
  id: pgUuid(),
  profile_id: pgUuid(),
  organizer_id: pgUuid(),
  created_at: z.string().datetime(),
});

// Create payload — only `organizer_id` is supplied by the client.
// `profile_id` is injected server-side from the session (never trusted from client).
export const createOrganizerFollowSchema = z.object({
  organizer_id: pgUuid(),
});

// Inferred types
export type OrganizerFollowFormData = z.infer<typeof createOrganizerFollowSchema>;
