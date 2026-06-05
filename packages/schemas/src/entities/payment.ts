// ============================================================================
// @eventology/schemas — Payment Zod Schemas
// Source: 008_payments.sql
// ============================================================================

import { z } from 'zod';
import { PAYMENT_STATUSES, PAYMENT_METHODS } from '../enums';

// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------

export const paymentSchema = z.object({
  id: z.string().uuid(),
  registration_id: z.string().uuid(),
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().min(0),
  currency: z.string().min(3).max(3),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES),
  provider: z.string().nullable(),
  provider_ref: z.string().nullable(),
  provider_metadata: z.record(z.string(), z.unknown()).default({}),
  paid_at: z.string().datetime().nullable(),
  refunded_at: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------

export const createPaymentSchema = paymentSchema
  .omit({
    id: true,
    status: true, // Defaults to 'pending'
    paid_at: true,
    refunded_at: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    currency: z.string().min(3).max(3).default('ETB'),
    method: z.enum(PAYMENT_METHODS).default('pay_at_door'),
    provider_metadata: z.record(z.string(), z.unknown()).default({}),
  });

// ---------------------------------------------------------------------------
// Update schema
// ---------------------------------------------------------------------------

export const updatePaymentSchema = createPaymentSchema.partial();

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type PaymentFormData = z.infer<typeof createPaymentSchema>;
export type PaymentUpdateData = z.infer<typeof updatePaymentSchema>;

