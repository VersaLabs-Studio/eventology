-- ============================================================================
-- Migration 039: Event Q&A / Discussion
-- Eventology V2.0 — HO-B (Event Q&A)
-- ============================================================================
-- event_questions (top-level) + event_answers (replies), both owner-writable
-- and public-readable. event_question_votes (owner-scoped, idempotent) drive
-- ranking via a counter trigger (handoff: "prefer the trigger").
--
-- Hosts (organizer owner or team members) pin/soft-hide questions via
-- fn_is_event_host. Attendees edit/delete only their own. Hidden rows stay
-- visible to their author (+ host for questions, per the LOCKED policies).
--
-- New questions enqueue to the existing content_moderation pipeline: the CHECK
-- on content_type is extended additively with 'event_question' (the admin AI
-- queue reads rows generically — verified), and the ask-route calls the
-- existing aiModerateContent + writeModeration seam. No cron/AI logic changed.
-- ============================================================================

CREATE TABLE public.event_questions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 3 AND 1000),
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  is_hidden   BOOLEAN NOT NULL DEFAULT false,
  upvotes     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_eq_event ON public.event_questions(event_id, is_pinned DESC, upvotes DESC, created_at DESC);

CREATE TABLE public.event_answers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id  UUID NOT NULL REFERENCES public.event_questions(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body         TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  is_official  BOOLEAN NOT NULL DEFAULT false,  -- set true when author is event organizer/team
  is_hidden    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ea_question ON public.event_answers(question_id, is_official DESC, created_at);

CREATE TABLE public.event_question_votes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id  UUID NOT NULL REFERENCES public.event_questions(id) ON DELETE CASCADE,
  profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, profile_id)
);
CREATE INDEX idx_eqv_question ON public.event_question_votes(question_id);

-- updated_at triggers (reuse handle_updated_at from 003, as 010 does)
CREATE TRIGGER trg_eq_updated BEFORE UPDATE ON public.event_questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_ea_updated BEFORE UPDATE ON public.event_answers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Upvote counter: INSERT +1 / DELETE -1, floored at 0. No recursion (the
-- counter UPDATE touches event_questions, which has no votes-side trigger).
CREATE OR REPLACE FUNCTION public.fn_sync_question_upvotes() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.event_questions SET upvotes = upvotes + 1 WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.event_questions SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_question_upvotes
  AFTER INSERT OR DELETE ON public.event_question_votes
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_question_upvotes();

-- Helper: is caller the organizer/team of the event behind a question?
-- (organizers.profile_id + organizer_team_members verified against 004/team tables)
CREATE OR REPLACE FUNCTION public.fn_is_event_host(p_event_id UUID, p_user UUID)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    LEFT JOIN public.organizer_team_members tm ON tm.organizer_id = o.id AND tm.profile_id = p_user
    WHERE e.id = p_event_id AND (o.profile_id = p_user OR tm.profile_id = p_user)
  );
$$;

ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_answers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_question_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eq_select_visible" ON public.event_questions FOR SELECT
  USING (is_hidden = false OR author_id = auth.uid() OR public.fn_is_event_host(event_id, auth.uid()));
CREATE POLICY "eq_insert_own" ON public.event_questions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "eq_update_own_or_host" ON public.event_questions FOR UPDATE
  USING (author_id = auth.uid() OR public.fn_is_event_host(event_id, auth.uid()));
CREATE POLICY "eq_delete_own_or_host" ON public.event_questions FOR DELETE
  USING (author_id = auth.uid() OR public.fn_is_event_host(event_id, auth.uid()));

CREATE POLICY "ea_select_visible" ON public.event_answers FOR SELECT
  USING (is_hidden = false OR author_id = auth.uid());
CREATE POLICY "ea_insert_own" ON public.event_answers FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "ea_modify_own" ON public.event_answers FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "ea_delete_own" ON public.event_answers FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "eqv_select_own" ON public.event_question_votes FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "eqv_insert_own" ON public.event_question_votes FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "eqv_delete_own" ON public.event_question_votes FOR DELETE USING (profile_id = auth.uid());

GRANT SELECT ON public.event_questions, public.event_answers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_questions, public.event_answers TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.event_question_votes TO authenticated;

-- Hardening (mirrors 036/037): 028 default privileges auto-grant anon SELECT
-- on every new table. Votes are per-user private → revoke anon explicitly.
REVOKE ALL ON public.event_question_votes FROM anon;

-- ---------------------------------------------------------------------------
-- AI moderation seam (consume, don't modify): additively allow questions in
-- the existing content_moderation queue. The admin AI queue reads rows
-- generically (verified: no content_type filter), and the cron is untouched.
-- ---------------------------------------------------------------------------
ALTER TABLE public.content_moderation
  DROP CONSTRAINT IF EXISTS content_moderation_content_type_check;
ALTER TABLE public.content_moderation
  ADD CONSTRAINT content_moderation_content_type_check
  CHECK (content_type IN ('event_description', 'review', 'message', 'profile_bio', 'event_question'));
