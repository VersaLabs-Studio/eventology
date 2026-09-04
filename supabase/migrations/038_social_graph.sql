-- ============================================================================
-- Migration 038: User-to-User Social Graph + Activity Feed
-- Eventology V2.0 — HO-A (Social Graph & Activity Feed)
-- ============================================================================
-- user_follows: owner-scoped join keyed by (follower_id, following_id),
-- UNIQUE → idempotent follow. Public-readable (social proof: counts,
-- "friends attending"); writes owner-only (matches 036/037 shape).
--
-- feed_activities: materialized activity rows appended by SECURITY DEFINER
-- triggers on owned-table writes (save / register / review / follow-user /
-- follow-organizer). No direct client writes: SELECT grant only, no INSERT
-- policy. Read policy = I am the actor, OR I follow the actor and the actor
-- is not activity_private.
--
-- VERIFY results baked in (per handoff note):
--   - saved_events owner column is `profile_id`      (036_saved_events.sql)
--   - registrations owner column is `user_id`        (007_tickets_registrations.sql)
--   - reviews owner column is `user_id`              (010_reviews_ratings.sql)
--   - confirmed registration status value 'confirmed' (002_enums.sql)
--   - paid registrations INSERT as 'pending_payment' and become 'confirmed'
--     via UPDATE (019/021 + payment webhook) → extra transition trigger
--     trg_feed_on_register_confirmed so paid attendance still feeds.
-- ============================================================================

-- Privacy flag: when true, the user's actions never enter followers' feeds.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activity_private BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- user_follows (user ↔ user social graph; distinct from organizer_follows)
-- ---------------------------------------------------------------------------

CREATE TABLE public.user_follows (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_user_follows_follower  ON public.user_follows(follower_id, created_at DESC);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Follow is public-readable social proof (follower/following counts).
CREATE POLICY "user_follows_select_all" ON public.user_follows
  FOR SELECT USING (true);

-- Writes are strictly owner-scoped: I can only follow AS myself / unfollow MY follows.
CREATE POLICY "user_follows_insert_own" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "user_follows_delete_own" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

GRANT SELECT ON public.user_follows TO anon, authenticated;
GRANT INSERT, DELETE ON public.user_follows TO authenticated;

-- ---------------------------------------------------------------------------
-- feed_verb enum + feed_activities (materialized feed)
-- ---------------------------------------------------------------------------

CREATE TYPE public.feed_verb AS ENUM (
  'saved_event', 'registered_event', 'reviewed_event',
  'followed_user', 'followed_organizer'
);

CREATE TABLE public.feed_activities (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id            UUID NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  verb                public.feed_verb NOT NULL,
  event_id            UUID REFERENCES public.events(id)             ON DELETE CASCADE,
  target_user_id      UUID REFERENCES public.profiles(id)           ON DELETE CASCADE,
  target_organizer_id UUID REFERENCES public.organizers(id)         ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hot path: fan-out-on-read joins on (actor ∈ people-I-follow), newest first.
CREATE INDEX idx_feed_actor_time ON public.feed_activities(actor_id, created_at DESC);
CREATE INDEX idx_feed_time       ON public.feed_activities(created_at DESC);

ALTER TABLE public.feed_activities ENABLE ROW LEVEL SECURITY;

-- I can read an activity iff I am the actor, OR I follow the actor AND the
-- actor is not private.
CREATE POLICY "feed_select_followed" ON public.feed_activities
  FOR SELECT USING (
    actor_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_follows uf
      JOIN public.profiles p ON p.id = feed_activities.actor_id
      WHERE uf.follower_id = auth.uid()
        AND uf.following_id = feed_activities.actor_id
        AND p.activity_private = false
    )
  );

-- No direct client writes: rows are inserted by SECURITY DEFINER triggers only.
GRANT SELECT ON public.feed_activities TO authenticated;

-- Hardening (mirrors 036/037): 028's default privileges auto-grant anon SELECT
-- on every new table. Revoke explicitly so \dp shows authenticated only.
REVOKE ALL ON public.feed_activities FROM anon;

-- ---------------------------------------------------------------------------
-- Trigger functions — append feed rows on owned-table writes.
-- SECURITY DEFINER so the insert bypasses RLS on feed_activities (which has
-- no client INSERT path). Owner columns verified against live migrations.
-- ---------------------------------------------------------------------------

-- saved_events.profile_id (036)
CREATE OR REPLACE FUNCTION public.fn_feed_on_save() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.feed_activities(actor_id, verb, event_id)
  VALUES (NEW.profile_id, 'saved_event', NEW.event_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_feed_on_save
  AFTER INSERT ON public.saved_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_feed_on_save();

-- registrations.user_id (007); only confirmed registrations are social-worthy.
CREATE OR REPLACE FUNCTION public.fn_feed_on_register() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    INSERT INTO public.feed_activities(actor_id, verb, event_id)
    VALUES (NEW.user_id, 'registered_event', NEW.event_id);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_feed_on_register
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.fn_feed_on_register();

-- Paid registrations are INSERTed as 'pending_payment' (019/021) and only
-- become 'confirmed' later via UPDATE (payment webhook). This transition
-- trigger appends the activity exactly once, on the non-confirmed →
-- confirmed edge (the WHEN clause is the single gate).
CREATE OR REPLACE FUNCTION public.fn_feed_on_register_confirmed() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.feed_activities(actor_id, verb, event_id)
  VALUES (NEW.user_id, 'registered_event', NEW.event_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_feed_on_register_confirmed
  AFTER UPDATE OF status ON public.registrations
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status <> 'confirmed')
  EXECUTE FUNCTION public.fn_feed_on_register_confirmed();

-- reviews.user_id (010)
CREATE OR REPLACE FUNCTION public.fn_feed_on_review() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.feed_activities(actor_id, verb, event_id)
  VALUES (NEW.user_id, 'reviewed_event', NEW.event_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_feed_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.fn_feed_on_review();

-- user_follows.follower_id → target_user_id
CREATE OR REPLACE FUNCTION public.fn_feed_on_follow_user() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.feed_activities(actor_id, verb, target_user_id)
  VALUES (NEW.follower_id, 'followed_user', NEW.following_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_feed_on_follow_user
  AFTER INSERT ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.fn_feed_on_follow_user();

-- organizer_follows.profile_id → target_organizer_id (037 shape)
CREATE OR REPLACE FUNCTION public.fn_feed_on_follow_org() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.feed_activities(actor_id, verb, target_organizer_id)
  VALUES (NEW.profile_id, 'followed_organizer', NEW.organizer_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_feed_on_follow_org
  AFTER INSERT ON public.organizer_follows
  FOR EACH ROW EXECUTE FUNCTION public.fn_feed_on_follow_org();

-- ---------------------------------------------------------------------------
-- fn_friends_attending — caller-scoped "friends attending" resolver.
--
-- registrations RLS (016) is owner/organizer-only, so a signed-in viewer
-- cannot read other users' registrations directly. This SECURITY DEFINER
-- function exposes ONLY the minimal profile fields of people the caller
-- follows who have a confirmed registration on the given event — nothing
-- else. Private users (activity_private) are excluded, consistent with the
-- LOCKED privacy decision for feeds.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_friends_attending(
  p_event_id UUID,
  p_follower UUID
)
RETURNS TABLE (
  id         UUID,
  full_name  TEXT,
  avatar_url TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.registrations r
  JOIN public.profiles p ON p.id = r.user_id
  JOIN public.user_follows uf ON uf.following_id = r.user_id
  WHERE r.event_id = p_event_id
    AND r.status = 'confirmed'
    AND uf.follower_id = p_follower
    AND p.activity_private = false
  ORDER BY p.full_name;
$$;
