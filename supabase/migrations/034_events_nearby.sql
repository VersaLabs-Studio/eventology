-- ============================================================================
-- 034_events_nearby.sql — proximity discovery ("Events Near Me", Part 2 §3.12)
-- ============================================================================
-- events.location is GEOMETRY(Point, 4326), kept in sync from latitude/longitude
-- by the trigger in 006_events.sql. This migration adds:
--   1. a GIST index so radius queries use the spatial index, and
--   2. events_nearby(lat, lng, radius_m, limit) — returns approved, upcoming
--      event ids ordered by distance. SECURITY INVOKER so row-level security
--      (approved-only for anon) is enforced against the caller, exactly like the
--      /api/public/events listing.
-- The API route resolves the returned ids back to full event cards and attaches
-- distance_m, so proximity reuses the same card shape as every other list.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_events_location_gist
  ON public.events USING GIST (location);

CREATE OR REPLACE FUNCTION public.events_nearby(
  p_lat      DOUBLE PRECISION,
  p_lng      DOUBLE PRECISION,
  p_radius_m DOUBLE PRECISION DEFAULT 10000,
  p_limit    INT DEFAULT 20
)
RETURNS TABLE (id UUID, distance_m DOUBLE PRECISION)
LANGUAGE sql
STABLE
SECURITY INVOKER
-- extensions schema holds PostGIS (geography type + ST_* functions) on Supabase.
SET search_path = public, extensions
AS $$
  SELECT
    e.id,
    ST_Distance(
      e.location::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m
  FROM public.events e
  WHERE e.status = 'approved'
    AND e.location IS NOT NULL
    AND e.start_date >= now()
    AND ST_DWithin(
      e.location::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_m
    )
  ORDER BY distance_m ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.events_nearby(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INT)
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.events_nearby IS
  'Approved upcoming events within p_radius_m of (p_lat,p_lng), nearest first. SECURITY INVOKER — RLS enforced.';
