-- ============================================================================
-- Migration 024: Payment commission split columns
-- Supports PAY-002: platform_fee + organizer_amount on payments table.
-- Per-organizer commission_rate is Day 12 scope — not added here.
-- ============================================================================

-- Add commission split columns
ALTER TABLE public.payments
  ADD COLUMN platform_fee   NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN organizer_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- DB-level invariant: fee + organizer_amount = amount
ALTER TABLE public.payments
  ADD CONSTRAINT payments_commission_check
  CHECK (platform_fee + organizer_amount = amount);
