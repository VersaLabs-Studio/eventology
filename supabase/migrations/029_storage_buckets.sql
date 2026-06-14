-- ============================================================================
-- Migration 029: Storage buckets + policies (final schema piece)
-- ============================================================================
-- The schema has several image/asset URL columns that, until now, only ever
-- held seeded external URLs. To support real uploads (profile + organizer
-- avatars, organizer logos, event banners, sponsor logos) the app needs
-- Supabase Storage buckets with public read + scoped authenticated write.
--
--   Columns served:
--     profiles.avatar_url     → 'avatars'
--     organizers.avatar_url   → 'avatars'
--     organizers.logo_url     → 'organizer-logos'
--     events.banner_image     → 'event-banners'
--     sponsors.logo_url       → 'sponsor-logos'
--
-- SECURITY MODEL:
--   • Buckets are public=true → files are readable via the public CDN URL
--     (the URLs stored in the columns above resolve without a session).
--   • Writes are restricted to authenticated users, and only inside a folder
--     named after their own auth.uid(): path = '<uid>/<filename>'. This stops
--     one user from overwriting another's assets while keeping upload logic
--     simple (the client always prefixes the path with its own id).
--   • Idempotent: buckets use ON CONFLICT DO NOTHING; each policy is dropped
--     IF EXISTS before being (re)created, so the migration is safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars',         'avatars',         true),
  ('organizer-logos', 'organizer-logos', true),
  ('event-banners',   'event-banners',   true),
  ('sponsor-logos',   'sponsor-logos',   true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Policies on storage.objects, generated per bucket:
--      • public SELECT
--      • authenticated INSERT/UPDATE/DELETE within own '<uid>/...' folder
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  b TEXT;
  buckets TEXT[] := ARRAY['avatars','organizer-logos','event-banners','sponsor-logos'];
BEGIN
  FOREACH b IN ARRAY buckets LOOP
    -- public read
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_public_read');
    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects FOR SELECT
      USING (bucket_id = %L)
    $p$, b || '_public_read', b);

    -- authenticated insert into own folder
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_insert');
    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
    $p$, b || '_own_insert', b);

    -- authenticated update own
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_update');
    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
    $p$, b || '_own_update', b, b);

    -- authenticated delete own
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b || '_own_delete');
    EXECUTE format($p$
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
    $p$, b || '_own_delete', b);
  END LOOP;
END $$;
