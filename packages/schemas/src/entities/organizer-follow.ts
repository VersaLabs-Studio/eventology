// ============================================================================
// @eventology/schemas — Organizer Follow Zod Schemas
// Source: 037_organizer_follows.sql
// ============================================================================

import { z } from 'zod';

// Full row shape (mirrors the generated `OrganizerFollowRow` from database.types.ts).
export const organizerFollowSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  organizer_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

// Create payload — only `organizer_id` is supplied by the client.
// `profile_id` is injected server-side from the session (never trusted from client).
export const createOrganizerFollowSchema = z.object({
  organizer_id: z.string().uuid(),
});

// Inferred types
export type OrganizerFollowFormData = z.infer<typeof createOrganizerFollowSchema>;
