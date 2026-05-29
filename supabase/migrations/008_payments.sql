-- ============================================================================
-- Migration 008: Payments & Payouts
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Payments track individual registration payments (V1: pay-at-door,
-- V2: Chapa/Telebirr). Payouts track organizer disbursements.
-- ============================================================================

-- Payments table
CREATE TABLE public.payments (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id   UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  event_id          UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Payment details
  amount            NUMERIC(10, 2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'ETB',
  method            public.payment_method NOT NULL DEFAULT 'pay_at_door',
  status            public.payment_status NOT NULL DEFAULT 'pending',

  -- External references (for V2 payment gateway integration)
  provider          TEXT,
  provider_ref      TEXT,
  provider_metadata JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  paid_at           TIMESTAMPTZ,
  refunded_at       TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payments_registration_id ON public.payments(registration_id);
CREATE INDEX idx_payments_event_id ON public.payments(event_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Payouts table (organizer disbursements)
CREATE TABLE public.payouts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id    UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  event_id        UUID REFERENCES public.events(id) ON DELETE SET NULL,

  -- Payout details
  amount          NUMERIC(10, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'ETB',
  status          public.payout_status NOT NULL DEFAULT 'pending',

  -- External references
  provider        TEXT,
  provider_ref    TEXT,
  bank_account    JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  processed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payouts_organizer_id ON public.payouts(organizer_id);
CREATE INDEX idx_payouts_event_id ON public.payouts(event_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_created_at ON public.payouts(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
