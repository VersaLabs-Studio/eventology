-- ============================================================================
-- Migration 028: API-role grants + RLS on the four remaining tables
-- ============================================================================
-- DISCOVERY (2026-06-13, Phase 3 Rotation 2 infra readiness):
--   The remote DB's public tables had NO privileges granted to the PostgREST
--   API roles (anon / authenticated / service_role). Every REST query returned
--   SQLSTATE 42501 "permission denied for table ...". The baseline Supabase
--   grants (which the dashboard would normally establish) were never applied,
--   because the schema was built entirely from raw-SQL migrations.
--
--   This never surfaced before R2 because the public pages used in-repo
--   mock-data until R2 de-mocked them, and the app had not yet been run live
--   against this database. The web public routes read via the anon client and
--   protected routes via authenticated/service — all of which need table grants.
--
-- SAFETY MODEL:
--   A blanket `GRANT SELECT ... TO anon` is safe ONLY when every table has RLS
--   enabled, because RLS then filters anon down to rows a public-read policy
--   explicitly permits. Four tables were missing RLS — they are enabled here
--   FIRST, with owner/admin-only policies (no public/anon read), and ONLY THEN
--   are the grants applied. supabase db push runs this file in a single
--   transaction, so RLS is active before anon ever receives SELECT — there is
--   no exposure window.
--
--   Role intent after this migration:
--     • anon          → SELECT only; RLS limits it to public rows.
--     • authenticated → SELECT/INSERT/UPDATE/DELETE; RLS limits to own rows.
--     • service_role  → ALL (server-only secret; also BYPASSRLS).
--   Function EXECUTE grants are intentionally NOT touched here — privileged
--   SECURITY DEFINER RPCs keep their explicit per-function grants from earlier
--   migrations; anon must not gain blanket EXECUTE.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enable RLS + owner/admin policies on the four tables that lacked it.
--    All four are user-owned / PII. None is public. Server writes happen via
--    the service role (BYPASSRLS) or SECURITY DEFINER functions, so enabling
--    RLS does not break the existing fan-out / redemption / delivery writes.
-- ---------------------------------------------------------------------------

-- push_tokens: a device push token belongs to exactly one profile.
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Push tokens: own manage"
  ON public.push_tokens FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Push tokens: admin full access"
  ON public.push_tokens FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- notification_preferences: one row per profile; the user manages their own.
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notif prefs: own manage"
  ON public.notification_preferences FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Notif prefs: admin full access"
  ON public.notification_preferences FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- notification_deliveries: per-channel delivery audit. Owned transitively via
-- the parent notification; server-written only. Users may read the delivery
-- status of their own notifications; admins see all.
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notif deliveries: own read"
  ON public.notification_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.id = notification_deliveries.notification_id
        AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "Notif deliveries: admin full access"
  ON public.notification_deliveries FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- promo_redemptions: a user's promo redemption history. Written by the
-- SECURITY DEFINER apply_promo_code RPC; the user reads their own, admins all.
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo redemptions: own read"
  ON public.promo_redemptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Promo redemptions: admin full access"
  ON public.promo_redemptions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Baseline API-role grants (the missing Supabase defaults).
--    RLS is now enabled on every public table, so these grants are safe:
--    rows are still gated row-by-row by the policies above and in 016/027.
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- service_role: full access (server-only secret).
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- authenticated: full DML; RLS limits to the caller's own rows.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon: read-only; RLS limits to rows a public-read policy permits.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ---------------------------------------------------------------------------
-- 3. Default privileges so future tables/sequences inherit the same grants
--    and this class of 42501 bug cannot recur on the next migration.
-- ---------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
