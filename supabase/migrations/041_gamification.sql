-- ============================================================================
-- Migration 041: Gamification (Badges · Points · Streaks)
-- Eventology V2.0 — HO-D (Gamification)
-- ============================================================================
-- badges = seeded catalog (admin-managed via the service-role admin route —
-- the table has NO write policies for anyone). user_badges = awards (public
-- trophy case). point_ledger = append-only immutable point events
-- (owner-readable, system-written).
--
-- ALL writes go through SECURITY DEFINER functions — no client INSERT path:
--   fn_award_badge(p_user, p_code)  — idempotent award + points on first earn
--   fn_add_points(p_user, delta, reason, event) — generic ledger append
--   fn_points_total(p_user)         — public aggregate for the trophy case
--                                     (point_ledger itself stays owner-read)
--
-- Attendance awards ride a trigger on registrations confirmed-transitions
-- (INSERT-as-confirmed free path + UPDATE pending_payment→confirmed webhook
-- path + waitlist auto-promote), mirroring the 038 feed triggers and the
-- existing update_event_registrations_count trigger. The package constraint
-- "keep award triggers idempotent" makes fn_award_badge ON CONFLICT the
-- exactly-once guarantee.
-- ============================================================================

CREATE TABLE public.badges (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,           -- 'first_event','streak_5','explorer','super_host'
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,                  -- lucide name or asset key
  tier        TEXT NOT NULL DEFAULT 'bronze', -- bronze|silver|gold
  points      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.user_badges (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, badge_id)
);
CREATE INDEX idx_user_badges_profile ON public.user_badges(profile_id, awarded_at DESC);

CREATE TABLE public.point_ledger (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta      INTEGER NOT NULL,
  reason     TEXT NOT NULL,                   -- 'attended','review','badge:streak_5','referral'
  event_id   UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_point_ledger_profile ON public.point_ledger(profile_id, created_at DESC);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select_all" ON public.badges FOR SELECT USING (true);
CREATE POLICY "user_badges_select_public" ON public.user_badges FOR SELECT USING (true); -- trophy case is public social proof
CREATE POLICY "point_ledger_select_own" ON public.point_ledger FOR SELECT USING (profile_id = auth.uid());
GRANT SELECT ON public.badges, public.user_badges TO anon, authenticated;
GRANT SELECT ON public.point_ledger TO authenticated;
-- No client INSERT/UPDATE/DELETE anywhere: all writes via SECURITY DEFINER
-- fn_award_badge / fn_add_points. Catalog mutations: service-role admin route.

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER award/points functions
-- ---------------------------------------------------------------------------

-- Generic append-only ledger write (also consumed by HO-E referrals).
CREATE OR REPLACE FUNCTION public.fn_add_points(
  p_user   UUID,
  p_delta  INTEGER,
  p_reason TEXT,
  p_event  UUID DEFAULT NULL
)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.point_ledger(profile_id, delta, reason, event_id)
  VALUES (p_user, p_delta, p_reason, p_event);
END $$;

-- Idempotent badge award: no-op when unknown code or already earned; grants
-- the badge's points exactly once (only when the award actually happened).
CREATE OR REPLACE FUNCTION public.fn_award_badge(p_user UUID, p_code TEXT)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_badge public.badges;
BEGIN
  SELECT * INTO v_badge FROM public.badges WHERE code = p_code;
  IF v_badge.id IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_badges(profile_id, badge_id) VALUES (p_user, v_badge.id)
    ON CONFLICT (profile_id, badge_id) DO NOTHING;
  IF FOUND AND v_badge.points > 0 THEN
    INSERT INTO public.point_ledger(profile_id, delta, reason) VALUES (p_user, v_badge.points, 'badge:'||p_code);
  END IF;
END $$;

-- Public aggregate for trophy cases (point_ledger rows stay owner-read only).
CREATE OR REPLACE FUNCTION public.fn_points_total(p_user UUID)
  RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(delta), 0)::integer FROM public.point_ledger WHERE profile_id = p_user;
$$;

-- ---------------------------------------------------------------------------
-- Attendance award trigger — fires on every confirmed transition of a
-- registration (free INSERT path, paid webhook path, waitlist promotion).
-- first_event is awarded unconditionally (idempotent ⇒ only the first one
-- sticks); streak_5 / explorer are count-gated.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_award_attendance_badges() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user  UUID := NEW.user_id;
  v_total INTEGER;
  v_cats  INTEGER;
BEGIN
  PERFORM public.fn_award_badge(v_user, 'first_event');

  SELECT count(*) INTO v_total
    FROM public.registrations r
    WHERE r.user_id = v_user AND r.status IN ('confirmed', 'checked_in');
  IF v_total >= 5 THEN
    PERFORM public.fn_award_badge(v_user, 'streak_5');
  END IF;

  SELECT count(DISTINCT e.category_id) INTO v_cats
    FROM public.registrations r
    JOIN public.events e ON e.id = r.event_id
    WHERE r.user_id = v_user AND r.status IN ('confirmed', 'checked_in');
  IF v_cats >= 5 THEN
    PERFORM public.fn_award_badge(v_user, 'explorer');
  END IF;

  RETURN NULL;
END $$;

-- Free path: INSERT directly as 'confirmed' (019/021)
CREATE TRIGGER trg_award_attendance_badges_ins
  AFTER INSERT ON public.registrations
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.fn_award_attendance_badges();

-- Paid path: INSERT as 'pending_payment' → UPDATE to 'confirmed' (webhook)
CREATE TRIGGER trg_award_attendance_badges_upd
  AFTER UPDATE OF status ON public.registrations
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status <> 'confirmed')
  EXECUTE FUNCTION public.fn_award_attendance_badges();

-- ---------------------------------------------------------------------------
-- Seed catalog (verbatim from the handoff package)
-- ---------------------------------------------------------------------------
INSERT INTO public.badges(code,name,description,icon,tier,points) VALUES
  ('first_event','First Steps','Attended your first event','sparkles','bronze',50),
  ('streak_5','On a Roll','5 events attended','flame','silver',150),
  ('explorer','Explorer','Events in 5 different categories','compass','silver',150),
  ('super_host','Super Host','Hosted 10 completed events','crown','gold',500)
ON CONFLICT (code) DO NOTHING;
