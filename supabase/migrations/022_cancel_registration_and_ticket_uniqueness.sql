-- ============================================================================
-- Migration 022: cancel_registration RPC + ticket uniqueness
-- FIX-005: Unique constraint on tickets.registration_id (prevents double-issue)
-- FIX-006: Atomic cancel — decrements sold_count, voids ticket
-- ============================================================================

-- FIX-005: Prevent duplicate tickets per registration
-- Adding with IF NOT EXISTS so it's safe to run multiple times
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_registration_id_key'
      AND conrelid = 'public.tickets'::regclass
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_registration_id_key UNIQUE (registration_id);
  END IF;
END $$;

-- FIX-006: Atomic cancel — decrements sold_count, voids ticket
CREATE OR REPLACE FUNCTION public.cancel_registration(
  p_registration_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_registration RECORD;
  v_caller_id UUID;
BEGIN
  -- Derive caller from auth.uid()
  v_caller_id := (SELECT auth.uid());
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Authentication required'
    );
  END IF;

  -- Fetch the registration and lock it
  SELECT * INTO v_registration
  FROM public.registrations
  WHERE id = p_registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NOT_FOUND',
      'message', 'Registration not found'
    );
  END IF;

  -- Verify ownership
  IF v_registration.user_id != v_caller_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'FORBIDDEN',
      'message', 'Not authorized to cancel this registration'
    );
  END IF;

  -- Only allow cancelling from confirmed or pending_payment
  IF v_registration.status NOT IN ('confirmed', 'pending_payment') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_STATUS',
      'message', 'Registration cannot be cancelled from status: ' || v_registration.status
    );
  END IF;

  -- Set status to cancelled
  UPDATE public.registrations
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_registration_id;

  -- Atomically decrement sold_count (floor at 0)
  IF v_registration.ticket_tier_id IS NOT NULL THEN
    UPDATE public.ticket_tiers
    SET sold_count = GREATEST(sold_count - 1, 0)
    WHERE id = v_registration.ticket_tier_id;
  END IF;

  -- Void any issued ticket
  UPDATE public.tickets
  SET status = 'cancelled'
  WHERE registration_id = p_registration_id
    AND status = 'valid';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Registration cancelled successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cancel_registration(UUID) TO authenticated;
