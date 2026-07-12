-- ============================================================================
-- 033_seed_venue_images — give every seeded venue a real photo
-- ============================================================================
-- Migration 017 inserted 12 venues with image_url = NULL, so venue detail
-- pages and venue thumbnails fell back to a placeholder. The photos are
-- uploaded (by scratchpad/seed-venues.mjs) to the public `event-banners`
-- bucket under venues/<slug>.jpg — reusing that bucket avoids a new bucket +
-- RLS policy.
--
-- Idempotent and non-destructive: only fills rows where image_url IS NULL, so
-- a real venue photo uploaded later is never clobbered, and re-running is a
-- no-op. Keyed by slug (stable) rather than id.
-- ============================================================================

DO $$
DECLARE
  base TEXT := 'https://dgpccoegetxwkabcujje.supabase.co/storage/v1/object/public/event-banners/venues';
  v RECORD;
BEGIN
  FOR v IN
    SELECT slug FROM public.venues WHERE image_url IS NULL
  LOOP
    UPDATE public.venues
    SET image_url = base || '/' || v.slug || '.jpg',
        updated_at = now()
    WHERE slug = v.slug AND image_url IS NULL;
  END LOOP;
END $$;
