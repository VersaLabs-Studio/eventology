-- ============================================================================
-- Migration 044: Ticket Transfers & Resale
-- Eventology V2.0 — HO-G (security-critical)
-- ============================================================================
-- ticket_transfers = full audit trail (from→to, kind, status). ALL mutations
-- happen inside SECURITY DEFINER functions — the table has SELECT-only RLS
-- for involved parties and no client write grants.
--
-- QR ROTATION (VERIFY-driven correction of the handoff's proposed body):
-- The live QR is HMAC-COMPUTED — `EVT-{ticketId}-{registrationId}-hmac(...)` —
-- deterministic from ids, and tickets.registration_id is UNIQUE (022), so the
-- package's gen_random_bytes replacement would be unscannable and cancel+reissue
-- is impossible. Rotation is therefore IN-PLACE via a version bump:
--   • tickets.qr_version (added here, default 0) becomes part of the HMAC
--     message; the route pre-signs the new payload with the server util and
--     passes it in (secret never enters the DB).
--   • The fn verifies p_expected_version under lock (concurrency guard),
--     stores the new payload, and bumps the version — the OLD QR dies the
--     instant the fn commits (check-in compares scanned version).
-- Owner columns corrected per VERIFY: tickets.user_id / registrations.user_id
-- (the handoff body said profile_id on both).
--
-- kind = 'resale' hands the ticket to the NEXT WAITLISTED registration
-- (035 promotion order); face value only — no P2P pricing, no payment seam
-- changes. kind = 'transfer' targets an email; pending rows complete via the
-- accept route or the signup databaseHook.
-- ============================================================================

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS qr_version INTEGER NOT NULL DEFAULT 0;

CREATE TYPE public.transfer_status AS ENUM ('pending', 'completed', 'cancelled');

CREATE TABLE public.ticket_transfers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id    UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  from_profile UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_profile   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_email     TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'transfer',   -- 'transfer' | 'resale'
  status       public.transfer_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_transfers_ticket ON public.ticket_transfers(ticket_id, created_at DESC);
CREATE INDEX idx_transfers_from   ON public.ticket_transfers(from_profile, created_at DESC);

ALTER TABLE public.ticket_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tt_select_involved" ON public.ticket_transfers FOR SELECT
  USING (from_profile = auth.uid() OR to_profile = auth.uid());
GRANT SELECT ON public.ticket_transfers TO authenticated;

-- Hardening (mirrors 036/037): 028 default privileges auto-grant anon SELECT
-- on every new table. Transfer audit rows are involved-private → revoke.
REVOKE ALL ON public.ticket_transfers FROM anon;

-- Shared eligibility checks for transfer + accept.
CREATE OR REPLACE FUNCTION public.fn_assert_transferable_ticket(
  p_ticket RECORD
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_start TIMESTAMPTZ;
BEGIN
  IF p_ticket.status <> 'valid' THEN
    RAISE EXCEPTION 'invalid_ticket';
  END IF;
  SELECT start_date INTO v_start FROM public.events WHERE id = p_ticket.event_id;
  IF v_start IS NULL OR v_start <= now() THEN
    RAISE EXCEPTION 'event_started';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- fn_transfer_ticket — the LOCKED single-transaction core.
-- Called from the transfer route with a PRE-SIGNED payload (route-side server
-- util signQRPayload(id, registration_id, expected_version + 1)).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_transfer_ticket(
  p_ticket           UUID,
  p_to_email         TEXT,
  p_kind             TEXT,      -- 'transfer' | 'resale'
  p_new_qr_data      TEXT,
  p_expected_version INTEGER
)
  RETURNS UUID
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ticket   RECORD;
  v_to       UUID;
  v_email    TEXT;
  v_transfer UUID;
BEGIN
  IF p_kind NOT IN ('transfer', 'resale') THEN
    RAISE EXCEPTION 'invalid_kind';
  END IF;

  SELECT t.id, t.user_id, t.status, t.event_id, t.registration_id, t.qr_version
    INTO v_ticket
    FROM public.tickets t
    WHERE t.id = p_ticket
    FOR UPDATE OF t;

  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_ticket.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  PERFORM public.fn_assert_transferable_ticket(v_ticket);
  IF v_ticket.qr_version <> p_expected_version THEN
    RAISE EXCEPTION 'version_conflict';
  END IF;

  IF p_kind = 'resale' THEN
    -- Face-value seat handoff to the NEXT WAITLISTED registration (035 order).
    SELECT r.user_id, r.attendee_email INTO v_to, v_email
      FROM public.registrations r
      WHERE r.event_id = v_ticket.event_id AND r.status = 'waitlisted'
      ORDER BY r.waitlist_position ASC NULLS LAST, r.created_at ASC
      LIMIT 1;
    IF v_to IS NULL THEN
      RAISE EXCEPTION 'no_waitlist';
    END IF;
  ELSE
    SELECT id INTO v_to FROM public.profiles WHERE lower(email) = lower(p_to_email);
    IF v_to = auth.uid() THEN
      RAISE EXCEPTION 'self_transfer';
    END IF;
    v_email := p_to_email;
  END IF;

  INSERT INTO public.ticket_transfers
    (ticket_id, from_profile, to_profile, to_email, kind, status, completed_at)
  VALUES
    (p_ticket, auth.uid(), v_to, v_email, p_kind,
     CASE WHEN v_to IS NULL THEN 'pending' ELSE 'completed' END,
     CASE WHEN v_to IS NULL THEN NULL ELSE now() END)
  RETURNING id INTO v_transfer;

  IF v_to IS NOT NULL THEN
    -- Reassign ownership + rotate the QR in place (old code dies via the
    -- version bump; check-in rejects version mismatches).
    UPDATE public.tickets
      SET user_id = v_to,
          qr_data = p_new_qr_data,
          qr_version = p_expected_version + 1,
          updated_at = now()
      WHERE id = p_ticket;

    UPDATE public.registrations
      SET user_id = v_to,
          attendee_name = (SELECT full_name FROM public.profiles WHERE id = v_to),
          attendee_email = (SELECT email FROM public.profiles WHERE id = v_to)
      WHERE id = v_ticket.registration_id;
  END IF;

  RETURN v_transfer;
END $$;

-- ---------------------------------------------------------------------------
-- fn_accept_transfer — recipient completes a PENDING transfer addressed to
-- their email (explicit accept route or the signup databaseHook). Same
-- reassignment + rotation mechanics as the direct transfer.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_accept_transfer(
  p_transfer         UUID,
  p_user             UUID,
  p_new_qr_data      TEXT,
  p_expected_version INTEGER
)
  RETURNS UUID
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_transfer RECORD;
  v_ticket   RECORD;
  v_email    TEXT;
BEGIN
  SELECT * INTO v_transfer
    FROM public.ticket_transfers
    WHERE id = p_transfer
    FOR UPDATE;

  IF v_transfer.id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_transfer.status <> 'pending' THEN
    RAISE EXCEPTION 'not_pending';
  END IF;

  SELECT email INTO v_email FROM public.profiles WHERE id = p_user;
  IF v_email IS NULL OR lower(v_email) <> lower(v_transfer.to_email) THEN
    RAISE EXCEPTION 'not_recipient';
  END IF;

  SELECT t.id, t.user_id, t.status, t.event_id, t.registration_id, t.qr_version
    INTO v_ticket
    FROM public.tickets t
    WHERE t.id = v_transfer.ticket_id
    FOR UPDATE OF t;

  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  PERFORM public.fn_assert_transferable_ticket(v_ticket);
  IF v_ticket.qr_version <> p_expected_version THEN
    RAISE EXCEPTION 'version_conflict';
  END IF;

  UPDATE public.ticket_transfers
    SET status = 'completed', to_profile = p_user, completed_at = now()
    WHERE id = p_transfer;

  UPDATE public.tickets
    SET user_id = p_user,
        qr_data = p_new_qr_data,
        qr_version = p_expected_version + 1,
        updated_at = now()
    WHERE id = v_transfer.ticket_id;

  UPDATE public.registrations
    SET user_id = p_user,
        attendee_name = (SELECT full_name FROM public.profiles WHERE id = p_user),
        attendee_email = v_email
    WHERE id = v_ticket.registration_id;

  RETURN v_transfer.id;
END $$;

-- ---------------------------------------------------------------------------
-- fn_cancel_transfer — the SENDER cancels a pending transfer (nothing has
-- moved yet, so no QR change).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_cancel_transfer(p_transfer UUID)
  RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_transfer RECORD;
BEGIN
  SELECT * INTO v_transfer
    FROM public.ticket_transfers
    WHERE id = p_transfer
    FOR UPDATE;

  IF v_transfer.id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_transfer.from_profile <> auth.uid() THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  IF v_transfer.status <> 'pending' THEN
    RAISE EXCEPTION 'not_pending';
  END IF;

  UPDATE public.ticket_transfers SET status = 'cancelled' WHERE id = p_transfer;
END $$;
