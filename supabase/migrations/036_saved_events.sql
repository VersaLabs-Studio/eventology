-- ============================================================================
-- Migration 036: Saved Events (attendee bookmarks)
-- Eventology V1.6 — HO-1 (Schema-First: Saved Events & Organizer Follows)
-- ============================================================================
-- Owner-scoped join table keyed by (profile_id, event_id), UNIQUE → idempotent
-- save. RLS is the authz source of truth; every row is scoped to auth.uid().
-- Insert/delete only — no updated_at, so no handle_updated_at trigger.
-- ============================================================================

CREATE TABLE public.saved_events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  event_id    UUID NOT NULL REFERENCES public.events(id)    ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, event_id)
);

CREATE INDEX idx_saved_events_profile ON public.saved_events(profile_id, created_at DESC);
CREATE INDEX idx_saved_events_event   ON public.saved_events(event_id);

ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_events_select_own" ON public.saved_events
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "saved_events_insert_own" ON public.saved_events
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "saved_events_delete_own" ON public.saved_events
  FOR DELETE USING (auth.uid() = profile_id);

-- Grant to authenticated only. NEVER grant to anon (matches 028 discipline).
GRANT SELECT, INSERT, DELETE ON public.saved_events TO authenticated;

-- Hardening: saved_events is strictly private (owner-scoped). RLS already
-- denies anon (no anon policy exists → auth.uid() is NULL → zero rows), but
-- 028's default privileges auto-grant anon SELECT on every new table. Revoke
-- it explicitly so \dp shows authenticated only, honoring "no grant to anon".
REVOKE ALL ON public.saved_events FROM anon;
