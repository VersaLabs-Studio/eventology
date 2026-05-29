-- ============================================================================
-- Migration 011: Sponsors
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Sponsors are linked to events with tier levels (platinum, gold, etc.).
-- Displayed on event detail pages and marketing materials.
-- ============================================================================

-- Sponsors table
CREATE TABLE public.sponsors (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Sponsor info
  name          TEXT NOT NULL,
  logo_url      TEXT,
  website       TEXT,
  description   TEXT,
  tier          public.sponsor_tier NOT NULL DEFAULT 'bronze',

  -- Display
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,

  -- Contact
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Metadata
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sponsors_event_id ON public.sponsors(event_id);
CREATE INDEX idx_sponsors_tier ON public.sponsors(tier);
CREATE INDEX idx_sponsors_is_active ON public.sponsors(is_active);

-- Auto-update updated_at
CREATE TRIGGER set_sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
