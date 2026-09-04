// ============================================================================
// @eventology/schemas — Wallet Pass Zod Schemas
// Source: 045_wallet_passes.sql
// ============================================================================
// Passes are issued/revoked by server routes with service context — there is
// intentionally NO create/update schema: no client or authed route writes
// pass rows directly.
// ============================================================================

import { z } from 'zod';
import { pgUuid } from '../primitives';

export const walletPlatformSchema = z.enum(['apple', 'google']);

// Full row shape (mirrors the generated `WalletPassRow` from database.types.ts).
export const walletPassSchema = z.object({
  id: pgUuid(),
  ticket_id: pgUuid(),
  profile_id: pgUuid(),
  platform: walletPlatformSchema,
  serial: z.string(),
  revoked: z.boolean(),
  created_at: z.string().datetime(),
});
