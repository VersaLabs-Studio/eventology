-- ============================================================================
-- Migration 025: Revenue Operations — Phase 3 Day 12
-- ============================================================================
-- Per-organizer commission rate, provider amount cross-check, refund audit
-- columns, and atomic promo code usage increment.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Per-organizer commission rate override
-- ---------------------------------------------------------------------------
-- NULL = use PLATFORM_COMMISSION_RATE (platform default).
-- Non-NULL = organizer's negotiated rate (percentage, e.g. 8.0 = 8%).
ALTER TABLE public.organizers
  ADD COLUMN commission_rate NUMERIC(5,2) DEFAULT NULL;

COMMENT ON COLUMN public.organizers.commission_rate IS
  'Per-organizer commission rate percentage (e.g. 8.0 = 8%). NULL = use PLATFORM_COMMISSION_RATE.';

-- ---------------------------------------------------------------------------
-- 2. Provider amount for S6 webhook cross-check
-- ---------------------------------------------------------------------------
-- Populated by the Chapa webhook after provider.verify() to allow server-side
-- cross-check against the local payments.amount (defense against spoofed webhooks).
ALTER TABLE public.payments
  ADD COLUMN provider_amount NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN public.payments.provider_amount IS
  'Amount reported by the payment provider after verify. NULL for non-online methods (pay_at_door).';

-- ---------------------------------------------------------------------------
-- 3. Refund audit columns (V1: full refund only)
-- ---------------------------------------------------------------------------
-- Partial refunds are V2 — not implemented in V1.
ALTER TABLE public.payments
  ADD COLUMN refund_amount  NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN refund_reason  TEXT DEFAULT NULL,
  ADD COLUMN refunded_by    UUID DEFAULT NULL REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.payments.refund_amount IS
  'Amount refunded. V1: always equals payments.amount (full refund only).';
COMMENT ON COLUMN public.payments.refund_reason IS
  'Organizer/admin-provided reason for the refund. Required for organizer/admin-initiated refunds.';
COMMENT ON COLUMN public.payments.refunded_by IS
  'Profile UUID of the organizer/admin who issued the refund.';

-- ---------------------------------------------------------------------------
-- 4. Atomic promo code usage increment
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so it can increment used_count even when the caller does
-- not have direct UPDATE on the promo_codes table. Returns the updated row
-- so the caller can persist the code on the registration/payment metadata.
-- Idempotent at the row level — the increment is atomic.
CREATE OR REPLACE FUNCTION public.apply_promo_code(
  p_code TEXT,
  p_event_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  promo_id UUID,
  discount_type public.promo_discount_type,
  discount_value NUMERIC,
  max_discount NUMERIC,
  error_message TEXT
) AS $$
DECLARE
  v_promo RECORD;
  v_user_uses INTEGER;
BEGIN
  -- Lock the promo row to prevent concurrent double-spend
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = p_code
    AND (event_id = p_event_id OR event_id IS NULL)
    AND is_active = true
    AND (starts_at <= now())
    AND (expires_at IS NULL OR expires_at >= now())
  FOR UPDATE;

  IF v_promo IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::public.promo_discount_type, 0::NUMERIC, 0::NUMERIC, 'Invalid or expired promo code'::TEXT;
    RETURN;
  END IF;

  -- Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::public.promo_discount_type, 0::NUMERIC, 0::NUMERIC, 'Promo code usage limit reached'::TEXT;
    RETURN;
  END IF;

  -- Check per-user limit (scan registrations with this promo in metadata)
  SELECT COUNT(*) INTO v_user_uses
  FROM public.registrations
  WHERE user_id = p_user_id
    AND metadata->>'promo_code' = p_code;

  IF v_user_uses >= v_promo.max_uses_per_user THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::public.promo_discount_type, 0::NUMERIC, 0::NUMERIC, 'You have already used this promo code'::TEXT;
    RETURN;
  END IF;

  -- Atomic increment
  UPDATE public.promo_codes
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = v_promo.id;

  RETURN QUERY SELECT true, v_promo.id, v_promo.discount_type, v_promo.discount_value, v_promo.max_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.apply_promo_code IS
  'Atomically validates and increments a promo code usage. Locks the row via FOR UPDATE to prevent concurrent double-spend.';

-- ---------------------------------------------------------------------------
-- 5. Safe ticket tier sold_count decrement (for refund/cancellation paths)
-- ---------------------------------------------------------------------------
-- Atomic decrement with floor-at-0 guard. Used by organizer/admin-initiated
-- refunds where auth.uid() != registration owner.
CREATE OR REPLACE FUNCTION public.decrement_ticket_tier_sold_count(
  p_tier_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.ticket_tiers
  SET sold_count = GREATEST(sold_count - 1, 0)
  WHERE id = p_tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.decrement_ticket_tier_sold_count IS
  'Atomically decrements ticket_tiers.sold_count by 1, floored at 0. Used for capacity release on refund/cancellation.';
