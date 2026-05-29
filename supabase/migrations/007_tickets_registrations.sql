-- ============================================================================
-- Migration 007: Tickets & Registrations
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Ticket tiers define pricing/capacity for each event.
-- Registrations link users to events with a specific ticket tier.
-- Tickets are generated QR-code-backed entries for check-in.
-- ============================================================================

-- Ticket tiers (e.g., General, VIP, Early Bird)
CREATE TABLE public.ticket_tiers (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'ETB',
  capacity      INTEGER NOT NULL DEFAULT 0,
  sold_count    INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ticket_tiers_event_id ON public.ticket_tiers(event_id);
CREATE INDEX idx_ticket_tiers_is_active ON public.ticket_tiers(is_active);

-- Auto-update updated_at
CREATE TRIGGER set_ticket_tiers_updated_at
  BEFORE UPDATE ON public.ticket_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Registrations (user registers for an event with a specific ticket tier)
CREATE TABLE public.registrations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_tier_id  UUID NOT NULL REFERENCES public.ticket_tiers(id) ON DELETE RESTRICT,

  -- Attendee info (denormalized for quick access)
  attendee_name   TEXT NOT NULL,
  attendee_email  TEXT NOT NULL,
  attendee_phone  TEXT,

  -- Status
  status          public.registration_status NOT NULL DEFAULT 'confirmed',
  checked_in_at   TIMESTAMPTZ,

  -- QR code data
  qr_data         TEXT NOT NULL UNIQUE,

  -- Metadata
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX idx_registrations_ticket_tier_id ON public.registrations(ticket_tier_id);
CREATE INDEX idx_registrations_status ON public.registrations(status);
CREATE INDEX idx_registrations_qr_data ON public.registrations(qr_data);
CREATE INDEX idx_registrations_created_at ON public.registrations(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tickets (generated from registrations, used for check-in)
CREATE TABLE public.tickets (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id   UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  event_id          UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Ticket details
  ticket_number     TEXT NOT NULL UNIQUE,
  qr_data           TEXT NOT NULL UNIQUE,
  tier_name         TEXT NOT NULL,

  -- Status
  status            public.ticket_status NOT NULL DEFAULT 'valid',
  used_at           TIMESTAMPTZ,

  -- Metadata
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tickets_registration_id ON public.tickets(registration_id);
CREATE INDEX idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_qr_data ON public.tickets(qr_data);
CREATE INDEX idx_tickets_ticket_number ON public.tickets(ticket_number);

-- Auto-update updated_at
CREATE TRIGGER set_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Helper function: increment sold_count on a ticket tier
CREATE OR REPLACE FUNCTION public.increment_sold_count(tier_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.ticket_tiers
  SET sold_count = sold_count + 1
  WHERE id = tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: decrement sold_count on a ticket tier
CREATE OR REPLACE FUNCTION public.decrement_sold_count(tier_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.ticket_tiers
  SET sold_count = GREATEST(sold_count - 1, 0)
  WHERE id = tier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: update event registrations count
CREATE OR REPLACE FUNCTION public.update_event_registrations_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE public.events SET registrations_count = registrations_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
    UPDATE public.events SET registrations_count = GREATEST(registrations_count - 1, 0) WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    UPDATE public.events SET registrations_count = registrations_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE public.events SET registrations_count = GREATEST(registrations_count - 1, 0) WHERE id = OLD.event_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_event_registrations_count
  AFTER INSERT OR UPDATE OR DELETE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_registrations_count();
