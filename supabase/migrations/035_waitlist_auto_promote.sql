-- ============================================================================
-- 035_waitlist_auto_promote.sql — Waitlist auto-promotion (Part 2 §3.9)
-- ============================================================================
-- When a confirmed registration is cancelled and a seat frees up, promote the
-- next person on that event's waitlist: flip them to 'confirmed', re-take the
-- seat (sold_count++), issue a ticket, and drop them a notification.
--
-- This is folded into cancel_registration (migration 022) rather than a bare
-- trigger so it runs in the same atomic, SECURITY DEFINER transaction as the
-- cancel. Ticket issuance mirrors create_registration_atomic (019): a UUID
-- qr_data with the "<qr>.<registration_id>" ticket form — the exact fallback the
-- normal SQL registration path already uses, so no ticket invariant changes.
-- Selection order: lowest waitlist_position first (NULLs last), then oldest.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_registration(
  p_registration_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_registration RECORD;
  v_caller_id    UUID;
  v_next         RECORD;
  v_tier_name    TEXT;
  v_qr_data      TEXT;
  v_ticket_number TEXT;
  v_promoted     JSONB := NULL;
BEGIN
  v_caller_id := (SELECT auth.uid());
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Authentication required');
  END IF;

  SELECT * INTO v_registration
  FROM public.registrations
  WHERE id = p_registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Registration not found');
  END IF;

  IF v_registration.user_id != v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Not authorized to cancel this registration');
  END IF;

  IF v_registration.status NOT IN ('confirmed', 'pending_payment') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATUS',
      'message', 'Registration cannot be cancelled from status: ' || v_registration.status);
  END IF;

  UPDATE public.registrations
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_registration_id;

  IF v_registration.ticket_tier_id IS NOT NULL THEN
    UPDATE public.ticket_tiers
    SET sold_count = GREATEST(sold_count - 1, 0)
    WHERE id = v_registration.ticket_tier_id;
  END IF;

  UPDATE public.tickets
  SET status = 'cancelled'
  WHERE registration_id = p_registration_id
    AND status = 'valid';

  -- ── Auto-promote the next waitlisted registration for this event ──────────
  SELECT * INTO v_next
  FROM public.registrations
  WHERE event_id = v_registration.event_id
    AND status = 'waitlisted'
  ORDER BY waitlist_position ASC NULLS LAST, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    -- Re-take the seat on the promoted registration's tier.
    IF v_next.ticket_tier_id IS NOT NULL THEN
      SELECT name INTO v_tier_name FROM public.ticket_tiers WHERE id = v_next.ticket_tier_id;
      UPDATE public.ticket_tiers SET sold_count = sold_count + 1 WHERE id = v_next.ticket_tier_id;
    END IF;
    v_tier_name := COALESCE(v_tier_name, 'General');

    UPDATE public.registrations
    SET status = 'confirmed', waitlist_position = NULL, updated_at = now()
    WHERE id = v_next.id;

    -- Issue a ticket (same UUID qr_data form as create_registration_atomic).
    v_qr_data := COALESCE(v_next.qr_data, gen_random_uuid()::text);
    v_ticket_number := 'TKT-' || UPPER(SUBSTRING(v_next.id::text FROM 1 FOR 8));

    INSERT INTO public.tickets (registration_id, event_id, user_id, ticket_number, qr_data, tier_name)
    VALUES (v_next.id, v_next.event_id, v_next.user_id, v_ticket_number,
            v_qr_data || '.' || v_next.id::text, v_tier_name)
    ON CONFLICT (registration_id) DO NOTHING;

    -- Notify the promoted attendee.
    INSERT INTO public.notifications (user_id, type, title, message, action_url, reference_type, reference_id)
    VALUES (
      v_next.user_id,
      'registration_confirmed',
      'You''re in! A spot opened up',
      'A seat freed up and you''ve been moved off the waitlist. Your ticket is ready.',
      '/my-events',
      'registration',
      v_next.id
    );

    v_promoted := jsonb_build_object('registration_id', v_next.id, 'user_id', v_next.user_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Registration cancelled successfully',
    'promoted', v_promoted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cancel_registration(UUID) TO authenticated;
