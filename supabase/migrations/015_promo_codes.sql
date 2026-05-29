-- ============================================================================
-- Migration 015: Promo Codes
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Promo codes provide discounts on paid event tickets.
-- Supports percentage and fixed-amount discounts with usage limits.
-- ============================================================================

-- Promo codes table
CREATE TABLE public.promo_codes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id          UUID REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id      UUID REFERENCES public.organizers(id) ON DELETE CASCADE,

  -- Code details
  code              TEXT NOT NULL UNIQUE,
  description       TEXT,

  -- Discount
  discount_type     public.promo_discount_type NOT NULL DEFAULT 'percentage',
  discount_value    NUMERIC(10, 2) NOT NULL,
  max_discount      NUMERIC(10, 2),  -- Cap for percentage discounts

  -- Usage limits
  max_uses          INTEGER,  -- NULL = unlimited
  used_count        INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user INTEGER NOT NULL DEFAULT 1,

  -- Validity
  is_active         BOOLEAN NOT NULL DEFAULT true,
  starts_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ,

  -- Applicable tiers (NULL = all tiers)
  applicable_tiers  UUID[] DEFAULT NULL,

  -- Metadata
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_event_id ON public.promo_codes(event_id);
CREATE INDEX idx_promo_codes_organizer_id ON public.promo_codes(organizer_id);
CREATE INDEX idx_promo_codes_is_active ON public.promo_codes(is_active);
CREATE INDEX idx_promo_codes_expires_at ON public.promo_codes(expires_at);

-- Auto-update updated_at
CREATE TRIGGER set_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Helper function: validate and apply promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code TEXT,
  p_event_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  is_valid BOOLEAN,
  discount_type public.promo_discount_type,
  discount_value NUMERIC,
  max_discount NUMERIC,
  error_message TEXT
) AS $$
DECLARE
  v_promo RECORD;
  v_user_uses INTEGER;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = p_code
    AND (event_id = p_event_id OR event_id IS NULL)
    AND is_active = true
    AND (starts_at <= now())
    AND (expires_at IS NULL OR expires_at >= now());

  IF v_promo IS NULL THEN
    RETURN QUERY SELECT false, NULL::public.promo_discount_type, 0::NUMERIC, 0::NUMERIC, 'Invalid or expired promo code'::TEXT;
    RETURN;
  END IF;

  -- Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, NULL::public.promo_discount_type, 0::NUMERIC, 0::NUMERIC, 'Promo code usage limit reached'::TEXT;
    RETURN;
  END IF;

  -- Check per-user limit
  SELECT COUNT(*) INTO v_user_uses
  FROM public.registrations
  WHERE user_id = p_user_id
    AND metadata->>'promo_code' = p_code;

  IF v_user_uses >= v_promo.max_uses_per_user THEN
    RETURN QUERY SELECT false, NULL::public.promo_discount_type, 0::NUMERIC, 0::NUMERIC, 'You have already used this promo code'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_promo.discount_type, v_promo.discount_value, v_promo.max_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
