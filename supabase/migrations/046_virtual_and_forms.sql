-- ============================================================================
-- Migration 046: Virtual / Hybrid Events + Custom Registration Forms (HO-I)
-- ============================================================================
-- (a) Virtual/hybrid events: `events` gains `location_type` (in_person |
--     online | hybrid), `online_url`, `online_provider`. The URL is NEVER
--     in a public payload — public routes strip it (app-level sanitizer,
--     see src/lib/events/sanitize-event.ts) and it is served only via the
--     gated /api/protected/events/[id]/join-link endpoint to confirmed
--     attendees + hosts.
--
--     NOTE vs handoff: the spec's gating relies on RLS, but the events
--     SELECT policy (016) is `status = 'approved'` for everyone — any
--     authed client can read any approved event row including online_url.
--     The spec's "RLS + endpoint gate" is therefore implemented as: broad
--     RLS select + sanitizer on every public/protected payload + a gated
--     join-link endpoint. Defense in depth, no RLS change to events.
--
-- (b) Custom registration forms: organizers define per-event fields
--     (event_form_fields — public read so the register form renders for
--     anon visitors); attendees submit registration_answers (owner + host
--     readable, validated server-side against the field definitions).
--
--     OWNER-COLUMN CORRECTION vs handoff: registrations' owner column is
--     `user_id` (007_tickets_registrations.sql), NOT `profile_id`. The
--     spec's policies reference r.profile_id which does not exist and
--     would fail at migration time. All policies below use r.user_id.
--
--     Additional policy vs handoff: answers also need UPDATE (spec only
--     defines INSERT; without it an attendee cannot correct a typo).
--     ra_modify_own restricts updates to the same owner, and the route
--     re-validates values against field defs.
-- ============================================================================

SET search_path = public;

-- ---------------------------------------------------------------------------
-- (a) Events: virtual / hybrid location support
-- ---------------------------------------------------------------------------

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS location_type TEXT NOT NULL DEFAULT 'in_person'
    CHECK (location_type IN ('in_person','online','hybrid')),
  ADD COLUMN IF NOT EXISTS online_url TEXT,
  ADD COLUMN IF NOT EXISTS online_provider TEXT;   -- 'zoom','meet','custom'

-- ---------------------------------------------------------------------------
-- (b) Custom registration forms
-- ---------------------------------------------------------------------------

CREATE TYPE public.form_field_type AS ENUM
  ('text','textarea','select','multiselect','checkbox','number');

CREATE TABLE public.event_form_fields (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  field_type  public.form_field_type NOT NULL,
  options     JSONB,                 -- for select/multiselect: string[] values
  required    BOOLEAN NOT NULL DEFAULT false,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_fields_event ON public.event_form_fields(event_id, position);

CREATE TRIGGER set_event_form_fields_updated_at
  BEFORE UPDATE ON public.event_form_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.registration_answers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  field_id        UUID NOT NULL REFERENCES public.event_form_fields(id) ON DELETE CASCADE,
  value           JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (registration_id, field_id)
);
CREATE INDEX idx_reg_answers_reg ON public.registration_answers(registration_id);

CREATE TRIGGER set_registration_answers_updated_at
  BEFORE UPDATE ON public.registration_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.event_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_answers ENABLE ROW LEVEL SECURITY;

-- Fields are public-read so anon visitors can render the registration form.
CREATE POLICY "eff_select_all" ON public.event_form_fields FOR SELECT USING (true);

-- Writes are host-only (owner or team member), via fn_is_event_host (039).
CREATE POLICY "eff_write_host" ON public.event_form_fields FOR ALL
  USING (public.fn_is_event_host(event_id, auth.uid())) WITH CHECK (public.fn_is_event_host(event_id, auth.uid()));

-- Answers: readable by the answer's registration owner and the event host.
CREATE POLICY "ra_select_own_or_host" ON public.registration_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id
          AND (r.user_id = auth.uid() OR public.fn_is_event_host(r.event_id, auth.uid())))
);

-- Insert only into your own registration.
CREATE POLICY "ra_insert_own" ON public.registration_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id AND r.user_id = auth.uid())
);

-- Owner may correct their answers (route re-validates against field defs).
CREATE POLICY "ra_modify_own" ON public.registration_answers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id AND r.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id AND r.user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- Grants. 028 default-privileges auto-grants anon SELECT on new tables;
-- form fields legitimately keep it. Answers are per-user private data —
-- revoke anon explicitly (mirrors 043's hardening pattern).
-- ---------------------------------------------------------------------------

GRANT SELECT ON public.event_form_fields TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_form_fields TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.registration_answers TO authenticated;
REVOKE ALL ON public.registration_answers FROM anon;
