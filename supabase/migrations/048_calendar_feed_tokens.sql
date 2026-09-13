-- ============================================================================
-- Migration 048: Tokenized, Revocable ICS Subscribe Feeds (HO-K)
-- ============================================================================
-- Live-updating calendar feeds: a calendar app polls a PUBLIC URL containing
-- an opaque bearer token; the feed resolves the user via a service-role read
-- of this table, then reads that user's events with the authed client so RLS
-- still applies to the data.
--
-- Token rules (LOCKED):
--   - opaque + unguessable (32 random bytes, base64url) — never client-supplied
--   - never encodes identity (no profile id / email / slug in the URL)
--   - rotation revokes the prior row (append-only history, no UPDATE of token)
--
-- The REVOKE ... FROM anon below is the single most important line in this
-- migration: 028's ALTER DEFAULT PRIVILEGES grants anon SELECT on every new
-- public table, and a feed token is a bearer credential — anon must not be
-- able to enumerate them (the exact mistake 041 made for point_ledger).
-- ============================================================================

SET search_path = public;

CREATE TABLE public.calendar_feed_tokens (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  kind       TEXT NOT NULL DEFAULT 'my_events' CHECK (kind IN ('my_events','saved')),
  revoked    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cft_profile ON public.calendar_feed_tokens(profile_id, kind, revoked);
CREATE INDEX idx_cft_token   ON public.calendar_feed_tokens(token) WHERE revoked = false;

ALTER TABLE public.calendar_feed_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cft_select_own" ON public.calendar_feed_tokens FOR SELECT
  USING (profile_id = auth.uid());
CREATE POLICY "cft_write_own" ON public.calendar_feed_tokens FOR ALL
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_feed_tokens TO authenticated;

-- REQUIRED (see header): kill the 028 default-privilege anon grant.
REVOKE ALL ON public.calendar_feed_tokens FROM anon;
