// ============================================================================
// @eventology/schemas — Point Ledger Zod Schemas
// Source: 041_gamification.sql
// ============================================================================
// Append-only immutable ledger. Writes happen exclusively inside SECURITY
// DEFINER functions (fn_add_points / fn_award_badge) — no create schema.
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `PointLedgerRow` from database.types.ts).
export const pointLedgerSchema = z.object({
  id: pgUuid(),
  profile_id: pgUuid(),
  delta: z.number().int(),
  reason: z.string(),
  event_id: pgUuid().nullable(),
  created_at: z.string().datetime(),
});
