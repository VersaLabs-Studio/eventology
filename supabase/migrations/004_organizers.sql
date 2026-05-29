-- ============================================================================
-- Migration 004: Organizers
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Organizers are verified profiles that can create and manage events.
-- The organizer_team_members table allows multiple users to manage
-- a single organizer's events (collaborative management).
-- ============================================================================

-- Organizers table (extends a profile with organizer-specific fields)
CREATE TABLE public.organizers (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  email               TEXT NOT NULL,
  phone               TEXT,
  avatar_url          TEXT,
  bio                 TEXT,
  website             TEXT,
  social_links        JSONB DEFAULT '{}'::jsonb,
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  verification_notes  TEXT,
  events_count        INTEGER NOT NULL DEFAULT 0,
  total_attendees     INTEGER NOT NULL DEFAULT 0,
  stripe_account_id   TEXT,
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_organizers_profile_id ON public.organizers(profile_id);
CREATE INDEX idx_organizers_slug ON public.organizers(slug);
CREATE INDEX idx_organizers_is_verified ON public.organizers(is_verified);
CREATE INDEX idx_organizers_verification_status ON public.organizers(verification_status);
CREATE INDEX idx_organizers_created_at ON public.organizers(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_organizers_updated_at
  BEFORE UPDATE ON public.organizers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Organizer team members (allows multiple users to manage an organizer's events)
CREATE TABLE public.organizer_team_members (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id  UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organizer_id, profile_id)
);

-- Indexes
CREATE INDEX idx_team_members_organizer_id ON public.organizer_team_members(organizer_id);
CREATE INDEX idx_team_members_profile_id ON public.organizer_team_members(profile_id);

-- Auto-update updated_at
CREATE TRIGGER set_organizer_team_members_updated_at
  BEFORE UPDATE ON public.organizer_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
