-- ============================================================================
-- Migration 021: Fix create_registration_atomic
-- FIX-001: Remove ticket creation from RPC (ticket issuance lives in Node now)
-- FIX-003: Bind ticket_tier ↔ event (reject tier from wrong event)
-- FIX-004: Drop p_user_id param — derive caller from auth.uid()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_registration_atomic(
  p_event_id UUID,
  p_ticket_tier_id UUID,
  p_attendee_name TEXT,
  p_attendee_email TEXT,
  p_attendee_phone TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_tier RECORD;
  v_event RECORD;
  v_registration RECORD;
  v_caller_id UUID;
BEGIN
  -- FIX-004: Derive user from auth.uid() — never trust a client-supplied ID
  v_caller_id := (SELECT auth.uid());
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Authentication required'
    );
  END IF;

  -- Lock the ticket tier row to prevent concurrent oversell
  SELECT * INTO v_tier
  FROM public.ticket_tiers
  WHERE id = p_ticket_tier_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TIER_NOT_FOUND',
      'message', 'Ticket tier not found'
    );
  END IF;

  -- FIX-003: Bind tier ↔ event — reject tier from wrong event
  IF v_tier.event_id != p_event_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'TIER_EVENT_MISMATCH',
      'message', 'Ticket tier does not belong to this event'
    );
  END IF;

  -- Check capacity (0 = unlimited)
  IF v_tier.capacity > 0 AND v_tier.sold_count >= v_tier.capacity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SOLD_OUT',
      'message', 'This ticket tier is sold out'
    );
  END IF;

  -- Verify event is approved
  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EVENT_NOT_AVAILABLE',
      'message', 'Event is not available for registration'
    );
  END IF;

  -- Check if user already registered for this event
  IF EXISTS (
    SELECT 1 FROM public.registrations
    WHERE event_id = p_event_id AND user_id = v_caller_id AND status != 'cancelled'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_REGISTERED',
      'message', 'You are already registered for this event'
    );
  END IF;

  -- Create the registration
  INSERT INTO public.registrations (
    event_id,
    user_id,
    ticket_tier_id,
    attendee_name,
    attendee_email,
    attendee_phone,
    status,
    metadata
  ) VALUES (
    p_event_id,
    v_caller_id,
    p_ticket_tier_id,
    p_attendee_name,
    p_attendee_email,
    p_attendee_phone,
    CASE WHEN v_tier.price > 0 THEN 'pending_payment'::public.registration_status ELSE 'confirmed'::public.registration_status END,
    p_metadata
  )
  RETURNING * INTO v_registration;

  -- Increment sold_count
  UPDATE public.ticket_tiers
  SET sold_count = sold_count + 1
  WHERE id = p_ticket_tier_id;

  -- Return success — ticket issuance is handled app-side (see issueTicket helper)
  RETURN jsonb_build_object(
    'success', true,
    'registration', jsonb_build_object(
      'id', v_registration.id,
      'event_id', v_registration.event_id,
      'user_id', v_registration.user_id,
      'ticket_tier_id', v_registration.ticket_tier_id,
      'attendee_name', v_registration.attendee_name,
      'attendee_email', v_registration.attendee_email,
      'attendee_phone', v_registration.attendee_phone,
      'status', v_registration.status,
      'created_at', v_registration.created_at
    ),
    'ticket', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the OLD 8-arg signature created in migration 019 (with p_user_id +
-- p_qr_data). CREATE OR REPLACE above only adds the new 6-arg overload, so
-- the old one must be removed explicitly. DROP ... IF EXISTS is idempotent
-- and cascades the old grants, so this is safe whether or not the old
-- overload is present on the target DB.
-- (Fix: the prior REVOKE referenced a 7-arg signature that never existed,
--  which fails on a clean remote — SQLSTATE 42883.)
DROP FUNCTION IF EXISTS public.create_registration_atomic(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB);
GRANT EXECUTE ON FUNCTION public.create_registration_atomic(UUID, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
