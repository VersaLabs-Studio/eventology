// ============================================================================
// @eventology/schemas — Referral Redemption Zod Schemas
// Source: 042_referrals.sql
// ============================================================================
// Lifecycle rows are system-written via SECURITY DEFINER functions; callers
// only ever READ them (ref_red_select_involved).
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

export const referralStatusSchema = z.enum(['signed_up', 'qualified', 'rewarded']);

// Full row shape (mirrors the generated `ReferralRedemptionRow` from database.types.ts).
export const referralRedemptionSchema = z.object({
  id: pgUuid(),
  referrer_id: pgUuid(),
  invitee_id: pgUuid(),
  code: z.string(),
  status: referralStatusSchema,
  qualified_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

// Inferred types
export type ReferralStatusValue = z.infer<typeof referralStatusSchema>;
