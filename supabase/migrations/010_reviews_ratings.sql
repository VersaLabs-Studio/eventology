-- ============================================================================
-- Migration 010: Reviews & Ratings
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Reviews allow attendees to rate and review events they attended.
-- One review per user per event. Reviews are moderated before publishing.
-- ============================================================================

-- Reviews table
CREATE TABLE public.reviews (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Review content
  rating        SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title         TEXT,
  content       TEXT,

  -- Moderation
  is_approved   BOOLEAN NOT NULL DEFAULT false,
  is_flagged    BOOLEAN NOT NULL DEFAULT false,
  flag_reason   TEXT,
  moderated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at  TIMESTAMPTZ,

  -- Metadata
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One review per user per event
  UNIQUE(event_id, user_id)
);

-- Indexes
CREATE INDEX idx_reviews_event_id ON public.reviews(event_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_is_approved ON public.reviews(is_approved);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
