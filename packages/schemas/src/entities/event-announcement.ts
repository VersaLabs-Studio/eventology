// ============================================================================
// @eventology/schemas — Event Announcement Zod Schemas (HO-M)
// Source: 049_event_announcements.sql
// ============================================================================
// Live event announcements. Reads are RLS-scoped to confirmed attendees +
// host; writes are host-only with author_id = auth.uid() enforced by BOTH
// the policy and the route (server-injected — a co-host cannot forge
// another host's authorship).
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `EventAnnouncementRow`).
export const eventAnnouncementSchema = z.object({
  id: pgUuid(),
  event_id: pgUuid(),
  author_id: pgUuid(),
  body: z.string().min(1).max(500),
  created_at: z.string().datetime(),
});

// POST /api/protected/events/[id]/announcements — event_id comes from the
// route path, author_id from the session. Body only.
export const announcementCreateSchema = z.object({
  body: z.string().trim().min(1, 'Announcement text is required').max(500),
});

export type AnnouncementCreateData = z.infer<typeof announcementCreateSchema>;
