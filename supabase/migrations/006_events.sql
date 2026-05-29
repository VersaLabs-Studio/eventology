-- ============================================================================
-- Migration 006: Events
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- The central table for the platform. Events belong to an organizer and
-- a category, take place at a venue, and have full-text search enabled
-- on title + description. GIS index supports "events near me" queries.
-- ============================================================================

-- Events table
CREATE TABLE public.events (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id      UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  category_id       UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  venue_id          UUID REFERENCES public.venues(id) ON DELETE SET NULL,

  -- Core fields
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT,  -- Rich text HTML
  short_description TEXT,
  banner_image      TEXT,
  gallery           TEXT[] DEFAULT '{}',

  -- Classification
  event_type        public.event_type NOT NULL,
  ticket_type       public.ticket_type NOT NULL DEFAULT 'free',
  tags              TEXT[] DEFAULT '{}',

  -- Scheduling
  start_date        TIMESTAMPTZ NOT NULL,
  end_date          TIMESTAMPTZ NOT NULL,
  timezone          TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',

  -- Location (denormalized for display even if venue is deleted)
  venue_name        TEXT,
  venue_address     TEXT,
  sub_city          TEXT,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  location          GEOMETRY(Point, 4326),

  -- Status & moderation
  status            public.event_status NOT NULL DEFAULT 'draft',
  rejection_reason  TEXT,
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  featured_until    TIMESTAMPTZ,

  -- Capacity & counts
  capacity          INTEGER NOT NULL DEFAULT 0,
  registrations_count INTEGER NOT NULL DEFAULT 0,
  views_count       INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX idx_events_category_id ON public.events(category_id);
CREATE INDEX idx_events_venue_id ON public.events(venue_id);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_is_featured ON public.events(is_featured);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_sub_city ON public.events(sub_city);
CREATE INDEX idx_events_created_at ON public.events(created_at DESC);

-- GIS index for location-based queries
CREATE INDEX idx_events_location ON public.events USING GIST(location);

-- Full-text search index on title + description
CREATE INDEX idx_events_fts ON public.events USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(short_description, ''))
);

-- Trigram index for fuzzy search
CREATE INDEX idx_events_title_trgm ON public.events USING GIN (title gin_trgm_ops);

-- Auto-update updated_at
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to auto-populate PostGIS geometry from lat/lng
CREATE OR REPLACE FUNCTION public.update_event_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_location
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_location();
