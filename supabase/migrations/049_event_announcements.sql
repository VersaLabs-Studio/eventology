-- ============================================================================
-- Migration 049: Live Event Announcements (HO-M) — Realtime-backed
-- ============================================================================
-- The live layer's data surface: a host streams short announcements to
-- confirmed attendees of a currently-running event.
--
-- RLS model (LOCKED, reuses the 039/043 helper fns — do not redefine):
--   SELECT: fn_attended(event_id, auth.uid()) OR fn_is_event_host(event_id, auth.uid())
--           → confirmed attendees + host. Everyone else streams zero rows.
--   INSERT: fn_is_event_host(...) AND author_id = auth.uid()
--           → the author_id conjunct is REQUIRED: fn_is_event_host alone
--             would let a co-host forge another host's authorship.
--
-- Realtime: event_announcements is the FIRST and ONLY table added to the
-- supabase_realtime publication in this repo (least privilege — no tickets,
-- no registrations). The DO block guards the publication's existence since
-- this is its first use. REPLICA IDENTITY FULL lets Realtime evaluate the
-- RLS policy against the full row image.
--
-- Browser auth note (the Realtime auth blocker): this app uses better-auth,
-- so the browser has no Supabase JWT and auth.uid() is NULL on a raw socket.
-- The client therefore calls realtime.setAuth() with a SHORT-LIVED (10m)
-- HS256 token minted by /api/protected/realtime-token (signRealtimeJWT).
-- RLS still applies over Realtime — a signed-in non-attendee receives
-- nothing. Do not weaken RLS, ship the service key, or make this table
-- public to "fix" that.
--
-- 028's default privileges grant anon SELECT on new tables — announcements
-- are attendee-only; revoke explicitly (same hardening as 048).
-- ============================================================================

SET search_path = public;

CREATE TABLE public.event_announcements (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announce_event ON public.event_announcements(event_id, created_at DESC);

ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;

-- Confirmed attendees + the host may read; only the host may write.
CREATE POLICY "ann_select_attendee_or_host" ON public.event_announcements FOR SELECT
  USING (public.fn_attended(event_id, auth.uid())
      OR public.fn_is_event_host(event_id, auth.uid()));
CREATE POLICY "ann_insert_host" ON public.event_announcements FOR INSERT
  WITH CHECK (public.fn_is_event_host(event_id, auth.uid()) AND author_id = auth.uid());

GRANT SELECT, INSERT ON public.event_announcements TO authenticated;

-- 028's default privileges grant anon SELECT on every new table; announcements are
-- attendee-only. Revoke explicitly (defense-in-depth alongside RLS).
REVOKE ALL ON public.event_announcements FROM anon;

-- Realtime: guard the ALTER — this is the FIRST use of the publication in this repo.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_announcements;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE public.event_announcements;
  END IF;
END $$;

-- REPLICA IDENTITY so RLS-filtered realtime can evaluate the row.
ALTER TABLE public.event_announcements REPLICA IDENTITY FULL;
