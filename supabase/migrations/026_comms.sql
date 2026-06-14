-- ============================================================================
-- Migration 026: Communications + FIN-Block (Phase 3 Day 13)
-- ============================================================================
-- Two responsibilities in one schema-first migration:
--
--   1. FIN P0 block (carried forward from Day 12 audit). Latent behind the
--      stub boundary until live money moves. Must land BEFORE any live
--      payout/refund/Chapa-transfer config.
--        - FIN-1: payout balance-check + insert into SECURITY DEFINER RPC
--                 with FOR UPDATE locking; guarded pending→processing.
--                 (The aggregate SUM in the balance query runs inside the
--                 organizer-row lock — Postgres forbids FOR UPDATE on
--                 aggregate queries, and the lock is already serialized.)
--        - FIN-2: refund guarded state transition before provider call.
--                 completed → refund_pending → refunded (or back to
--                 completed on provider failure). The new 'refund_pending'
--                 enum value is the gate. Concurrent refund callers can
--                 never both win; only the first reaches provider.refund().
--        - FIN-3: promo_redemptions table keyed (promo_id, user_id) so the
--                 per-user cap is checked inside the locked RPC. Prevents
--                 used_count leak on failed registration insert. Cap is
--                 enforced via COUNT(*) (NOT UNIQUE) because max_uses_per_user
--                 is configurable and may exceed 1.
--        - FIN-3 (audit fix): the original UNIQUE(promo_id, user_id) was
--                 over-tight — it hard-capped per-user at 1, but the column
--                 default is 1 and can be raised to N. A 2nd legitimate
--                 redemption would have raised an unhandled unique-violation
--                 and 500'd the registration. The FOR UPDATE lock on the
--                 promo row already makes the in-lock COUNT(*) check
--                 race-free, so we replace the unique index with a
--                 non-unique lookup and let COUNT(*) enforce the cap.
--
--   2. COMM-001 (Day 13) delivery infrastructure.
--        - notification_deliveries — per-channel send tracking
--        - notification_preferences — per-user channel opt-in/out + locale
--        - push_tokens — Expo push tokens (web won't write; mobile V2)
--        - notification_channel enum
--        - extended notification_type enum (payment_completed,
--          refund_processed, payout_update)
-- ============================================================================

-- ============================================================================
-- FIN-2: Extend payment_status enum with 'refund_pending'
-- ============================================================================
-- Adds a transient 'refund_pending' state between 'completed' and 'refunded'.
-- Postgres 12+ allows ADD VALUE inside a transaction block AND makes the new
-- value visible to subsequent statements in the same transaction, so the
-- CREATE OR REPLACE FUNCTION below (which references 'refund_pending' as a
-- string literal against the enum type) parses correctly when applied.
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'refund_pending';

-- ============================================================================
-- FIN-1: Atomic payout request with balance-check + insert
-- ============================================================================
-- Concurrency: lock the organizer's pending/processing payouts so two
-- concurrent requests cannot both pass the balance check. Mirrors the
-- FOR UPDATE pattern from apply_promo_code (migration 025).
--
-- Returns: success bool + the new payout id, or an error_message.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.request_payout_atomic(
  p_organizer_id UUID,
  p_event_id UUID,
  p_amount NUMERIC,
  p_currency TEXT,
  p_bank_account JSONB
)
RETURNS TABLE(
  success BOOLEAN,
  payout_id UUID,
  error_message TEXT
) AS $$
DECLARE
  v_total_earned NUMERIC(10,2);
  v_total_paid_out NUMERIC(10,2);
  v_total_refunded NUMERIC(10,2);
  v_available NUMERIC(10,2);
  v_payout_id UUID;
BEGIN
  -- Acquire row-level lock on the organizer row first. This serializes
  -- concurrent payout requests for the same organizer. Safe under repeated
  -- calls — concurrent requests queue behind the lock.
  PERFORM 1
  FROM public.organizers
  WHERE id = p_organizer_id
  FOR UPDATE;

  -- Recompute balance INSIDE the lock window.
  -- earned: sum of organizer_amount on completed payments
  SELECT COALESCE(SUM(p.organizer_amount), 0) INTO v_total_earned
  FROM public.payments p
  JOIN public.events e ON e.id = p.event_id
  WHERE e.organizer_id = p_organizer_id
    AND p.status = 'completed';

  -- paidOut: sum of non-failed payouts (pending + processing + completed).
  -- Postgres forbids FOR UPDATE on aggregate queries (SELECT SUM(...) FOR
  -- UPDATE errors at parse/plan time). The organizer-row lock acquired
  -- above (PERFORM 1 FROM organizers ... FOR UPDATE) already serializes
  -- concurrent payout requests per-organizer, so this SUM is safe inside
  -- that lock window — no second lock is needed here.
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid_out
  FROM public.payouts
  WHERE organizer_id = p_organizer_id
    AND status IN ('pending', 'processing', 'completed');

  -- refunded: sum of refund_amount on refunded payments
  SELECT COALESCE(SUM(p.refund_amount), 0) INTO v_total_refunded
  FROM public.payments p
  JOIN public.events e ON e.id = p.event_id
  WHERE e.organizer_id = p_organizer_id
    AND p.status = 'refunded';

  v_available := GREATEST(0,
    ROUND((v_total_earned - v_total_paid_out - v_total_refunded)::NUMERIC, 2)
  );

  IF p_amount <= 0 THEN
    RETURN QUERY SELECT false, NULL::UUID, 'INVALID_AMOUNT'::TEXT;
    RETURN;
  END IF;

  IF p_amount > v_available THEN
    RETURN QUERY SELECT false, NULL::UUID, 'INSUFFICIENT_BALANCE'::TEXT;
    RETURN;
  END IF;

  -- Insert within the same transaction — either everything commits or
  -- nothing does, eliminating the over-disbursement window.
  INSERT INTO public.payouts (
    organizer_id, event_id, amount, currency, status, bank_account
  )
  VALUES (
    p_organizer_id, p_event_id, p_amount, p_currency, 'pending', p_bank_account
  )
  RETURNING id INTO v_payout_id;

  RETURN QUERY SELECT true, v_payout_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.request_payout_atomic IS
  'Atomically requests a payout: locks the organizer row, recomputes balance '
  'inside the lock, and inserts the pending payout in one transaction. '
  'Concurrent calls for the same organizer serialize, preventing over-disbursement.';

-- ============================================================================
-- FIN-1: Guarded pending→processing transition for payouts
-- ============================================================================
-- Returns 1 if the transition succeeded (status was 'pending'), 0 if not.
-- This makes the transition a guarded conditional update — concurrent
-- processPayout calls cannot both move the same row out of 'pending'.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.begin_payout_processing(
  p_payout_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.payouts
  SET status = 'processing',
      processed_at = now()
  WHERE id = p_payout_id
    AND status = 'pending';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.begin_payout_processing IS
  'Guarded pending→processing transition. Returns 1 if the caller won the '
  'race, 0 if another caller already moved the payout (or status is not pending).';

-- ============================================================================
-- FIN-2: Guarded state transition for refunds
-- ============================================================================
-- Flow: completed → refund_pending → refunded (or back to completed on
--       provider failure).
-- The transition completed → refund_pending is a guarded conditional update,
-- so two concurrent refund requests cannot both pass the gate. The provider
-- call happens AFTER the status is locked. If the provider fails, the caller
-- rolls the row back to 'completed' (only if still refund_pending) so a
-- retry can win the gate again. On success, refund_pending → 'refunded'.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.begin_refund(
  p_payment_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  -- Real guarded state transition: only flip completed → refund_pending.
  -- A second concurrent call sees status='refund_pending' (or 'refunded')
  -- and updates 0 rows — the caller must abort BEFORE the provider call.
  -- On provider failure, the caller rolls the row back to 'completed'.
  -- On provider success, the caller flips 'refund_pending' → 'refunded'.
  UPDATE public.payments
  SET status = 'refund_pending'
  WHERE id = p_payment_id
    AND status = 'completed';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.begin_refund IS
  'FIN-2: Guarded refund gate. Atomically flips a payment from completed '
  'to refund_pending IF AND ONLY IF its current status is completed. '
  'Returns 1 if the caller won the race and may proceed to the provider '
  'call, 0 if the payment is already refund_pending (concurrent refund) '
  'or refunded (idempotent no-op upstream). '
  'On provider failure, the caller rolls the row back to completed. '
  'Concurrent refund requests cannot both pass this gate.';

-- ============================================================================
-- FIN-3: Per-user promo usage tracking inside the locked RPC
-- ============================================================================
-- A new table promo_redemptions (promo_id, user_id, redeemed_at) replaces
-- the brittle metadata scan inside apply_promo_code. The per-user cap is
-- enforced via a COUNT(*) check on this table inside the locked RPC — the
-- FOR UPDATE lock on the promo row makes the count race-free. The
-- (promo_id, user_id) index is a NON-UNIQUE lookup (not a hard cap)
-- because max_uses_per_user is configurable and may legitimately exceed 1.
-- used_count is still incremented only after the redemption row commits;
-- on payment insert failure we compensate via a dedicated decrement
-- helper.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_id    UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  payment_id  UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- We do NOT enforce a hard UNIQUE on (promo_id, user_id) because
-- max_uses_per_user is configurable (DEFAULT 1, may be raised to N).
-- A second legitimate redemption by the same user must be allowed
-- without raising an unhandled unique-violation that 500s the
-- registration. The per-user cap is enforced via a COUNT(*) check
-- inside the locked RPC — the FOR UPDATE lock on the promo row makes
-- that count race-free.
--
-- Fast lookups for the per-user cap check (non-unique)
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_promo_user
  ON public.promo_redemptions(promo_id, user_id);

-- Fast lookups by user (for analytics)
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user
  ON public.promo_redemptions(user_id);

-- Auto-update updated_at is irrelevant here; we have redeemed_at instead.

-- New apply_promo_code: locks the promo row, counts per-user usage from
-- promo_redemptions (not metadata), inserts the redemption row, increments
-- used_count, and returns. The redemption row carries the promo+user link
-- so the per-user cap is race-free under concurrent submits.
--
-- The compensation helper (release_promo_code) reverses the increment + row
-- when the downstream payment insert fails, so used_count never leaks.
--
-- 026 changes this function's return type (adds redemption_id to the
-- RETURNS TABLE that 025 introduced), and CREATE OR REPLACE cannot change
-- a function's return signature (SQLSTATE 42P13). Drop the 025 version
-- first. IF EXISTS keeps this safe whether or not 025 ran on the target.
DROP FUNCTION IF EXISTS public.apply_promo_code(TEXT, UUID, UUID);
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
  redemption_id UUID,
  error_message TEXT
) AS $$
DECLARE
  v_promo RECORD;
  v_user_uses INTEGER;
  v_redemption_id UUID;
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
    RETURN QUERY SELECT false, NULL::UUID, NULL::public.promo_discount_type, 0::NUMERIC, 0::NUMERIC, NULL::UUID, 'Invalid or expired promo code'::TEXT;
    RETURN;
  END IF;

  -- Check max uses (global cap)
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::public.promo_discount_type, 0::NUMERIC, 0::NUMERIC, NULL::UUID, 'Promo code usage limit reached'::TEXT;
    RETURN;
  END IF;

  -- FIN-3: Count per-user usage from the redemption table (not metadata).
  -- The FOR UPDATE lock on the promo row makes this COUNT(*) check
  -- race-free — two concurrent submissions can never both see "user has
  -- N redemptions" and both pass. The (promo_id, user_id) index is a
  -- non-unique lookup; the cap is enforced HERE, not by a UNIQUE
  -- constraint, because max_uses_per_user is configurable and may
  -- legitimately exceed 1.
  SELECT COUNT(*) INTO v_user_uses
  FROM public.promo_redemptions
  WHERE promo_id = v_promo.id
    AND user_id = p_user_id;

  IF v_user_uses >= v_promo.max_uses_per_user THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::public.promo_discount_type, 0::NUMERIC, 0::NUMERIC, NULL::UUID, 'You have already used this promo code'::TEXT;
    RETURN;
  END IF;

  -- Insert the redemption row. The (promo_id, user_id) index is NOT
  -- unique, so this INSERT cannot fail with a unique-violation on a
  -- second legitimate redemption — the COUNT(*) check above already
  -- verified the user is under the cap. The FOR UPDATE lock on the
  -- promo row guarantees no concurrent submit can race past the count.
  INSERT INTO public.promo_redemptions (promo_id, user_id, event_id)
  VALUES (v_promo.id, p_user_id, p_event_id)
  RETURNING id INTO v_redemption_id;

  -- Atomic increment of used_count
  UPDATE public.promo_codes
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = v_promo.id;

  RETURN QUERY SELECT true, v_promo.id, v_promo.discount_type, v_promo.discount_value, v_promo.max_discount, v_redemption_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.apply_promo_code IS
  'FIN-3: Atomically validates, inserts a promo_redemptions row, and '
  'increments used_count. Locks the promo row (FOR UPDATE) and enforces '
  'the per-user cap via a COUNT(*) check inside the lock — NOT via a '
  'UNIQUE constraint on promo_redemptions, because max_uses_per_user is '
  'configurable and may legitimately exceed 1. used_count cannot leak on '
  'payment insert failure because release_promo_code compensates.';

-- Compensation helper: rolls back a redemption row + used_count decrement
-- when the downstream payment insert fails. Used by the registrations route
-- in the catch path. Idempotent — calling it twice is a no-op.
CREATE OR REPLACE FUNCTION public.release_promo_code(
  p_redemption_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_promo_id UUID;
  v_rows INTEGER;
BEGIN
  -- Fetch the redemption to find the promo_id
  SELECT promo_id INTO v_promo_id
  FROM public.promo_redemptions
  WHERE id = p_redemption_id
  FOR UPDATE;

  IF v_promo_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Delete the redemption row (idempotent on repeat call)
  DELETE FROM public.promo_redemptions
  WHERE id = p_redemption_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN 0;  -- already released
  END IF;

  -- Decrement used_count, floor at 0
  UPDATE public.promo_codes
  SET used_count = GREATEST(used_count - 1, 0),
      updated_at = now()
  WHERE id = v_promo_id;

  RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.release_promo_code IS
  'FIN-3: Compensating rollback for a failed downstream payment insert. '
  'Removes the redemption row and decrements used_count (floor 0). '
  'Idempotent — repeat calls return 0 with no side-effects.';

-- ============================================================================
-- COMM-001: notification_channel enum
-- ============================================================================
CREATE TYPE public.notification_channel AS ENUM ('email', 'sms', 'push');

-- Extend notification_type with new comms events
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payment_completed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'refund_processed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payout_update';

-- ============================================================================
-- COMM-001: notification_deliveries
-- ============================================================================
-- Per-channel send tracking. One row per (notification, channel) dispatch
-- attempt. Status: queued (about to send), sent (provider confirmed), failed
-- (provider errored), skipped (channel disabled or no contact method).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel         public.notification_channel NOT NULL,
  status          TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  provider        TEXT,                -- e.g. 'resend', 'africas_talking', 'expo_push', 'stub'
  provider_ref    TEXT,                -- provider's message/transaction ID
  error           TEXT,                -- last error message if status='failed'
  attempts        INTEGER NOT NULL DEFAULT 0,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One delivery row per (notification, channel)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_delivery_per_channel
  ON public.notification_deliveries(notification_id, channel);

CREATE INDEX IF NOT EXISTS idx_deliveries_notification
  ON public.notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status
  ON public.notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_channel
  ON public.notification_deliveries(channel);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at
  ON public.notification_deliveries(created_at DESC);

-- ============================================================================
-- COMM-001: notification_preferences
-- ============================================================================
-- Per-user channel opt-in/out + locale. Defaults: transactional channels
-- (email) ON, marketing OFF, locale = 'en'.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  profile_id          UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled       BOOLEAN NOT NULL DEFAULT true,
  sms_enabled         BOOLEAN NOT NULL DEFAULT false,
  push_enabled        BOOLEAN NOT NULL DEFAULT true,
  marketing_opt_in    BOOLEAN NOT NULL DEFAULT false,
  locale              TEXT NOT NULL DEFAULT 'en'
                      CHECK (locale IN ('en', 'am')),
  quiet_hours_start   TIME,
  quiet_hours_end     TIME,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prefs_locale
  ON public.notification_preferences(locale);

CREATE TRIGGER set_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMM-001: push_tokens
-- ============================================================================
-- Expo push tokens per device. Web won't write to this table; mobile V2
-- will. The table can exist now to avoid a future migration churn.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_profile
  ON public.push_tokens(profile_id);
