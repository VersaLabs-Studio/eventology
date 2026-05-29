-- ============================================================================
-- Migration 005: Categories & Venues
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Categories organize events by domain (Tech, Business, Arts, etc.).
-- Venues represent physical locations in Addis Ababa with GIS coordinates
-- for proximity-based discovery.
-- ============================================================================

-- Categories table
CREATE TABLE public.categories (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  icon          TEXT NOT NULL,  -- Lucide icon name
  description   TEXT,
  color         TEXT NOT NULL,  -- Tailwind color class (e.g., 'bg-blue-500')
  event_count   INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_is_active ON public.categories(is_active);
CREATE INDEX idx_categories_sort_order ON public.categories(sort_order);

-- Auto-update updated_at
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Venues table with PostGIS geometry for location-based queries
CREATE TABLE public.venues (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  address       TEXT NOT NULL,
  sub_city      TEXT NOT NULL,
  city          TEXT NOT NULL DEFAULT 'Addis Ababa',
  country       TEXT NOT NULL DEFAULT 'Ethiopia',
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  location      GEOMETRY(Point, 4326),  -- PostGIS point (SRID 4326 = WGS84)
  capacity      INTEGER,
  description   TEXT,
  image_url     TEXT,
  amenities     TEXT[] DEFAULT '{}',
  contact_phone TEXT,
  contact_email TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_venues_slug ON public.venues(slug);
CREATE INDEX idx_venues_sub_city ON public.venues(sub_city);
CREATE INDEX idx_venues_is_active ON public.venues(is_active);
CREATE INDEX idx_venues_location ON public.venues USING GIST(location);

-- Auto-update updated_at
CREATE TRIGGER set_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to auto-populate PostGIS geometry from lat/lng
CREATE OR REPLACE FUNCTION public.update_venue_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_venue_location
  BEFORE INSERT OR UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_venue_location();
