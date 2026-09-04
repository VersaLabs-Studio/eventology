-- ============================================================================
-- Migration 042: Referral & Invite Program
-- Eventology V2.0 — HO-E (Referrals)
-- ============================================================================
-- referrals = one code per user (UNIQUE profile_id), auto-created on first
-- fetch via fn_get_or_create_referral. referral_redemptions records
-- invitee→referrer with a lifecycle (signed_up → rewarded on qualification);
-- invitee_id UNIQUE = an invitee is attributed exactly once; CHECK blocks
-- self-referral.
--
-- RLS: strictly owner/involved SELECT. ALL writes happen inside SECURITY
-- DEFINER functions — no client write path (grants are SELECT-only).
--
-- Reward fires on QUALIFICATION (first confirmed attendance), never at
-- signup: a trigger on the registrations confirmed-transition calls
-- fn_qualify_referral, which is exactly-once via a row lock + status guard
-- (same pattern as the 038/041 attendance triggers).
--
-- Points amounts are NOT locked by the handoff — 200 referrer / 100 invitee
-- chosen as the smallest reasonable default (flagged in the build report).
-- ============================================================================

CREATE TABLE public.referrals (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE public.referral_status AS ENUM ('signed_up', 'qualified', 'rewarded');

CREATE TABLE public.referral_redemptions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id    UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE, -- an invitee is attributed once
  code          TEXT NOT NULL,
  status        public.referral_status NOT NULL DEFAULT 'signed_up',
  qualified_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (referrer_id <> invitee_id)
);
CREATE INDEX idx_ref_red_referrer ON public.referral_redemptions(referrer_id, created_at DESC);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON public.referrals FOR SELECT
  USING (profile_id = auth.uid());
CREATE POLICY "ref_red_select_involved" ON public.referral_redemptions FOR SELECT
  USING (referrer_id = auth.uid() OR invitee_id = auth.uid());
GRANT SELECT ON public.referrals, public.referral_redemptions TO authenticated;

-- Hardening (mirrors 036/037): 028 default privileges auto-grant anon SELECT
-- on every new table. Revoke so \dp shows authenticated only.
REVOKE ALL ON public.referrals, public.referral_redemptions FROM anon;

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER functions — the only write paths
-- ---------------------------------------------------------------------------

-- One code per user, auto-created on first fetch (LOCKED decision).
CREATE OR REPLACE FUNCTION public.fn_get_or_create_referral(p_user UUID)
  RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code TEXT;
BEGIN
  SELECT code INTO v_code FROM public.referrals WHERE profile_id = p_user;
  IF v_code IS NULL THEN
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    INSERT INTO public.referrals(profile_id, code) VALUES (p_user, v_code);
  END IF;
  RETURN v_code;
END $$;

-- Attribution at signup (better-auth user.create.after hook). No-op when the
-- code is unknown or self-referred; invitee_id UNIQUE makes re-attrition
-- impossible (ON CONFLICT DO NOTHING).
CREATE OR REPLACE FUNCTION public.fn_attribute_referral(p_invitee UUID, p_code TEXT)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_referrer UUID;
BEGIN
  SELECT profile_id INTO v_referrer FROM public.referrals WHERE code = p_code;
  IF v_referrer IS NULL OR v_referrer = p_invitee THEN RETURN; END IF;
  INSERT INTO public.referral_redemptions(referrer_id, invitee_id, code)
    VALUES (v_referrer, p_invitee, p_code) ON CONFLICT (invitee_id) DO NOTHING;
END $$;

-- Qualification: first confirmed attendance rewards BOTH parties. Row lock +
-- signed_up guard ⇒ exactly once, even under concurrent confirmations.
CREATE OR REPLACE FUNCTION public.fn_qualify_referral(p_invitee UUID)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_red RECORD;
BEGIN
  SELECT * INTO v_red FROM public.referral_redemptions
    WHERE invitee_id = p_invitee AND status = 'signed_up'
    FOR UPDATE;
  IF v_red IS NULL THEN RETURN; END IF;

  UPDATE public.referral_redemptions
    SET status = 'rewarded', qualified_at = now()
    WHERE id = v_red.id;

  -- Points for both parties via the HO-D ledger ('referral' reason is listed
  -- in 041's reason vocabulary).
  PERFORM public.fn_add_points(v_red.referrer_id, 200, 'referral');
  PERFORM public.fn_add_points(p_invitee, 100, 'referral');
END $$;

-- Invoked from the registration-confirm flow via trigger (catches free-path
-- INSERTs, webhook UPDATEs, and waitlist promotions alike).
CREATE OR REPLACE FUNCTION public.fn_qualify_on_confirmation() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.fn_qualify_referral(NEW.user_id);
  RETURN NULL;
END $$;

CREATE TRIGGER trg_qualify_referral_ins
  AFTER INSERT ON public.registrations
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.fn_qualify_on_confirmation();

CREATE TRIGGER trg_qualify_referral_upd
  AFTER UPDATE OF status ON public.registrations
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status <> 'confirmed')
  EXECUTE FUNCTION public.fn_qualify_on_confirmation();

-- Leaderboard: top referrers by QUALIFIED (rewarded) count. SECURITY DEFINER
-- because redemptions are owner-visible only; exposes just rank + name +
-- qualified count (public social proof, per the LOCKED leaderboard design).
CREATE OR REPLACE FUNCTION public.fn_referral_leaderboard(p_limit INTEGER DEFAULT 10)
  RETURNS TABLE (
    rank            BIGINT,
    profile_id      UUID,
    full_name       TEXT,
    avatar_url      TEXT,
    qualified_count BIGINT
  )
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT row_number() OVER (ORDER BY count(*) DESC, r.referrer_id) AS rank,
         r.referrer_id,
         p.full_name,
         p.avatar_url,
         count(*) AS qualified_count
  FROM public.referral_redemptions r
  JOIN public.profiles p ON p.id = r.referrer_id
  WHERE r.status = 'rewarded'
  GROUP BY r.referrer_id, p.full_name, p.avatar_url
  ORDER BY qualified_count DESC, r.referrer_id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
$$;
