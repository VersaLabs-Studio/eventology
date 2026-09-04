-- ============================================================================
-- Migration 043: Post-Event Galleries (UGC)
-- Eventology V2.0 — HO-F (Event Media)
-- ============================================================================
-- event_media: attendee photos, gated so ONLY confirmed attendees can upload
-- (fn_attended policy check). status lifecycle ('pending' → 'approved' /
-- 'hidden') keeps the public gallery clean; the public sees approved rows
-- only, uploaders/hosts also see their own/pending rows (RLS).
--
-- event_media_reactions: owner-scoped idempotent join (UNIQUE media+profile).
--
-- Files land in the 'event-media' storage bucket (public read, authenticated
-- write into the caller's own '<uid>/...' folder) via the EXISTING
-- /api/protected/upload seam — no new upload path. storage_path holds the
-- public URL the seam returns.
--
-- New uploads enqueue to the existing content_moderation pipeline: the CHECK
-- on content_type is extended additively with 'event_photo' (same pattern as
-- 039 for 'event_question'). No cron/AI logic changed.
-- ============================================================================

CREATE TYPE public.media_status AS ENUM ('pending', 'approved', 'hidden');

CREATE TABLE public.event_media (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id     UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  uploader_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption      TEXT CHECK (caption IS NULL OR char_length(caption) <= 280),
  status       public.media_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_media_event ON public.event_media(event_id, status, created_at DESC);

CREATE TABLE public.event_media_reactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id   UUID NOT NULL REFERENCES public.event_media(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (media_id, profile_id)
);

-- Confirmed-attendee gate (check-in keeps status 'confirmed' in this codebase,
-- so status='confirmed' covers checked-in attendees too).
CREATE OR REPLACE FUNCTION public.fn_attended(p_event UUID, p_user UUID)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.registrations r
    WHERE r.event_id = p_event AND r.user_id = p_user AND r.status = 'confirmed');
$$;

ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "em_select_visible" ON public.event_media FOR SELECT
  USING (status = 'approved' OR uploader_id = auth.uid() OR public.fn_is_event_host(event_id, auth.uid()));
CREATE POLICY "em_insert_attendee" ON public.event_media FOR INSERT
  WITH CHECK (auth.uid() = uploader_id AND public.fn_attended(event_id, auth.uid()));
CREATE POLICY "em_update_own_or_host" ON public.event_media FOR UPDATE
  USING (uploader_id = auth.uid() OR public.fn_is_event_host(event_id, auth.uid()));
CREATE POLICY "em_delete_own_or_host" ON public.event_media FOR DELETE
  USING (uploader_id = auth.uid() OR public.fn_is_event_host(event_id, auth.uid()));

CREATE POLICY "emr_select_all" ON public.event_media_reactions FOR SELECT USING (true);
CREATE POLICY "emr_write_own" ON public.event_media_reactions FOR ALL
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

GRANT SELECT ON public.event_media, public.event_media_reactions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_media TO authenticated;
GRANT INSERT, DELETE ON public.event_media_reactions TO authenticated;

-- Hardening (mirrors 036/037): 028 default privileges auto-grant anon SELECT
-- on every new table. Reactions are per-user social data → revoke explicitly.
REVOKE ALL ON public.event_media_reactions FROM anon;

-- ---------------------------------------------------------------------------
-- Storage: 'event-media' bucket, mirroring 029 (public read; authenticated
-- write only inside the caller's own '<uid>/...' folder).
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-media', 'event-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "event-media_public_read" ON storage.objects;
CREATE POLICY "event-media_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'event-media');

DROP POLICY IF EXISTS "event-media_own_insert" ON storage.objects;
CREATE POLICY "event-media_own_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "event-media_own_update" ON storage.objects;
CREATE POLICY "event-media_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-media' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'event-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "event-media_own_delete" ON storage.objects;
CREATE POLICY "event-media_own_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- AI moderation seam (consume, don't modify): additively allow photos in the
-- existing content_moderation queue. The admin AI queue reads rows
-- generically; the cron is untouched.
-- ---------------------------------------------------------------------------
ALTER TABLE public.content_moderation
  DROP CONSTRAINT IF EXISTS content_moderation_content_type_check;
ALTER TABLE public.content_moderation
  ADD CONSTRAINT content_moderation_content_type_check
  CHECK (content_type IN ('event_description', 'review', 'message', 'profile_bio', 'event_question', 'event_photo'));
