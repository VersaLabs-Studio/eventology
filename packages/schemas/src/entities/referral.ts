// ============================================================================
// @eventology/schemas — Referral Zod Schemas
// Source: 042_referrals.sql
// ============================================================================
// Codes are created server-side (fn_get_or_create_referral) and redemptions
// are system-written (fn_attribute_referral / fn_qualify_referral triggers) —
// there is intentionally NO create schema for either table.
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

// Full row shape (mirrors the generated `ReferralRow` from database.types.ts).
export const referralSchema = z.object({
  id: pgUuid(),
  profile_id: pgUuid(),
  code: z.string(),
  created_at: z.string().datetime(),
});
