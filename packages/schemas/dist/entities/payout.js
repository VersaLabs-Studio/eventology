// ============================================================================
// @eventology/schemas — Payout Zod Schemas
// Source: 008_payments.sql
// ============================================================================
import { z } from 'zod';
import { PAYOUT_STATUSES } from '../enums';
// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------
export const payoutSchema = z.object({
    id: z.string().uuid(),
    organizer_id: z.string().uuid(),
    event_id: z.string().uuid().nullable(),
    amount: z.number().min(0),
    currency: z.string().min(3).max(3),
    status: z.enum(PAYOUT_STATUSES),
    provider: z.string().nullable(),
    provider_ref: z.string().nullable(),
    bank_account: z.record(z.string(), z.unknown()).default({}),
    processed_at: z.string().datetime().nullable(),
    completed_at: z.string().datetime().nullable(),
    notes: z.string().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------
export const createPayoutSchema = payoutSchema
    .omit({
    id: true,
    status: true, // Defaults to 'pending'
    processed_at: true,
    completed_at: true,
    created_at: true,
    updated_at: true,
})
    .extend({
    currency: z.string().min(3).max(3).default('ETB'),
    bank_account: z.record(z.string(), z.unknown()).default({}),
});
// ---------------------------------------------------------------------------
// Update schema
// ---------------------------------------------------------------------------
export const updatePayoutSchema = createPayoutSchema.partial();
//# sourceMappingURL=payout.js.map