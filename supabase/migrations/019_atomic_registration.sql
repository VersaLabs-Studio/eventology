-- ============================================================================
-- Migration 019: Atomic Registration Function
-- Prevents oversell by checking capacity and incrementing sold_count
-- in a single atomic operation.
-- ============================================================================

-- Atomic registration function: checks capacity, creates registration,
-- increments sold_count, all in one transaction.
CREATE OR REPLACE FUNCTION public.create_registration_atomic(
  p_event_id UUID,
  p_user_id UUID,
  p_ticket_tier_id UUID,
  p_attendee_name TEXT,
  p_attendee_email TEXT,
  p_attendee_phone TEXT DEFAULT NULL,
  p_qr_data TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_tier RECORD;
  v_event RECORD;
  v_registration RECORD;
  v_ticket RECORD;
  v_ticket_number TEXT;
  v_qr_data TEXT;
BEGIN
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
    WHERE event_id = p_event_id AND user_id = p_user_id AND status != 'cancelled'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_REGISTERED',
      'message', 'You are already registered for this event'
    );
  END IF;

  -- Generate QR data if not provided
  v_qr_data := COALESCE(p_qr_data, gen_random_uuid()::text);

  -- Create the registration
  INSERT INTO public.registrations (
    event_id,
    user_id,
    ticket_tier_id,
    attendee_name,
    attendee_email,
    attendee_phone,
    qr_data,
    status,
    metadata
  ) VALUES (
    p_event_id,
    p_user_id,
    p_ticket_tier_id,
    p_attendee_name,
    p_attendee_email,
    p_attendee_phone,
    v_qr_data,
    CASE WHEN v_tier.price > 0 THEN 'pending_payment'::public.registration_status ELSE 'confirmed'::public.registration_status END,
    p_metadata
  )
  RETURNING * INTO v_registration;

  -- Increment sold_count
  UPDATE public.ticket_tiers
  SET sold_count = sold_count + 1
  WHERE id = p_ticket_tier_id;

  -- Generate ticket number
  v_ticket_number := 'TKT-' || UPPER(SUBSTRING(v_registration.id::text FROM 1 FOR 8));

  -- Create the ticket (only for confirmed registrations)
  IF v_registration.status = 'confirmed' THEN
    INSERT INTO public.tickets (
      registration_id,
      event_id,
      user_id,
      ticket_number,
      qr_data,
      tier_name
    ) VALUES (
      v_registration.id,
      p_event_id,
      p_user_id,
      v_ticket_number,
      v_qr_data || '.' || v_registration.id::text,
      v_tier.name
    )
    RETURNING * INTO v_ticket;
  END IF;

  -- Return success
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
      'qr_data', v_registration.qr_data,
      'created_at', v_registration.created_at
    ),
    'ticket', CASE
      WHEN v_ticket IS NOT NULL THEN jsonb_build_object(
        'id', v_ticket.id,
        'ticket_number', v_ticket.ticket_number,
        'qr_data', v_ticket.qr_data,
        'tier_name', v_ticket.tier_name,
        'status', v_ticket.status
      )
      ELSE NULL
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_registration_atomic TO authenticated;
