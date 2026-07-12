-- ============================================================================
-- Migration 032: Seed event banner images
-- ============================================================================
-- Migration 017 seeded 55 events but left `events.banner_image` NULL, so every
-- event card and detail hero fell back to a grey "no image" placeholder. This
-- fills those gaps with real photography.
--
-- The images are 48 Creative-Commons photos (6 per category, 1600x900 JPEG)
-- downloaded from Unsplash and uploaded to the public `event-banners` bucket
-- created in migration 029, under the `seed/` prefix:
--
--     event-banners/seed/<category-slug>-<1..6>.jpg
--
-- ASSIGNMENT IS DETERMINISTIC, NOT RANDOM. Each event takes the pool entry at
-- (its ordinal within its category) % 6, ordered by (created_at, id). Two
-- consequences worth knowing:
--   • Re-running this migration is a no-op — it only ever touches rows where
--     banner_image IS NULL, so genuine organizer uploads are never clobbered.
--   • A fresh database seeded from 017 lands on the same banner for the same
--     event, so screenshots and demos are stable.
--
-- Events in a category with no pool entry (categories added after this
-- migration) fall back to the neutral `community` pool rather than staying
-- NULL — the UI's gradient placeholder still covers a genuinely missing image.
-- ============================================================================

DO $$
DECLARE
  base TEXT := 'https://dgpccoegetxwkabcujje.supabase.co/storage/v1/object/public/event-banners/seed';
BEGIN

  -- Per-category pools, resolved against the storage base URL.
  CREATE TEMP TABLE _banner_pool (category_slug TEXT PRIMARY KEY, urls TEXT[]) ON COMMIT DROP;

  INSERT INTO _banner_pool (category_slug, urls)
  SELECT
    slug,
    ARRAY(
      SELECT format('%s/%s-%s.jpg', base, slug, n)
      FROM generate_series(1, 6) AS n
    )
  FROM (
    VALUES ('tech'), ('business'), ('arts'), ('health'),
           ('education'), ('music'), ('food'), ('community')
  ) AS c(slug);

  -- Assign, cycling through each category's pool in a stable order.
  WITH ranked AS (
    SELECT
      e.id,
      COALESCE(c.slug, 'community') AS category_slug,
      ROW_NUMBER() OVER (PARTITION BY e.category_id ORDER BY e.created_at, e.id) - 1 AS idx
    FROM public.events e
    LEFT JOIN public.categories c ON c.id = e.category_id
    WHERE e.banner_image IS NULL
  )
  UPDATE public.events e
  SET banner_image = p.urls[(r.idx % array_length(p.urls, 1)) + 1]
  FROM ranked r
  JOIN _banner_pool p
    ON p.category_slug = (
      CASE WHEN EXISTS (SELECT 1 FROM _banner_pool bp WHERE bp.category_slug = r.category_slug)
           THEN r.category_slug
           ELSE 'community'
      END
    )
  WHERE e.id = r.id;

END $$;
