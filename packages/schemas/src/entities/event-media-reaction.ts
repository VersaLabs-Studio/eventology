// ============================================================================
// @eventology/schemas — Event Media Reaction Zod Schemas
// Source: 043_event_media.sql
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `EventMediaReactionRow` from database.types.ts).
export const eventMediaReactionSchema = z.object({
  id: pgUuid(),
  media_id: pgUuid(),
  profile_id: pgUuid(),
  created_at: z.string().datetime(),
});
