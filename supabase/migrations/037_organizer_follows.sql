-- ============================================================================
-- Migration 037: Organizer Follows (attendee follows an organizer)
-- Eventology V1.6 — HO-1 (Schema-First: Saved Events & Organizer Follows)
-- ============================================================================
-- Owner-scoped join table keyed by (profile_id, organizer_id), UNIQUE →
-- idempotent follow. Identical shape to saved_events. RLS scopes every row to
-- auth.uid(). Insert/delete only — no updated_at, so no handle_updated_at trigger.
-- ============================================================================

CREATE TABLE public.organizer_follows (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id   UUID NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id)   ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, organizer_id)
);

CREATE INDEX idx_org_follows_profile ON public.organizer_follows(profile_id, created_at DESC);
CREATE INDEX idx_org_follows_org     ON public.organizer_follows(organizer_id);

ALTER TABLE public.organizer_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizer_follows_select_own" ON public.organizer_follows
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "organizer_follows_insert_own" ON public.organizer_follows
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "organizer_follows_delete_own" ON public.organizer_follows
  FOR DELETE USING (auth.uid() = profile_id);

-- Grant to authenticated only. NEVER grant to anon (matches 028 discipline).
GRANT SELECT, INSERT, DELETE ON public.organizer_follows TO authenticated;

-- Hardening: organizer_follows is strictly private (owner-scoped). RLS already
-- denies anon (no anon policy exists → auth.uid() is NULL → zero rows), but
-- 028's default privileges auto-grant anon SELECT on every new table. Revoke
-- it explicitly so \dp shows authenticated only, honoring "no grant to anon".
REVOKE ALL ON public.organizer_follows FROM anon;
