-- ============================================================================
-- Migration 013: Analytics (Event Views)
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Tracks individual event page views for analytics dashboards.
-- Supports geographic breakdown by sub-city and time-series analysis.
-- ============================================================================

-- Event views table (each row = one page view)
CREATE TABLE public.event_views (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Visitor info (anonymized)
  session_id    TEXT,
  ip_hash       TEXT,  -- Hashed IP for privacy
  user_agent    TEXT,
  referer       TEXT,

  -- Geographic (from IP geolocation)
  country       TEXT DEFAULT 'Ethiopia',
  city          TEXT DEFAULT 'Addis Ababa',
  sub_city      TEXT,

  -- Device info
  device_type   TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),

  -- Metadata
  viewed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (optimized for analytics queries)
CREATE INDEX idx_event_views_event_id ON public.event_views(event_id);
CREATE INDEX idx_event_views_user_id ON public.event_views(user_id);
CREATE INDEX idx_event_views_viewed_at ON public.event_views(viewed_at);
CREATE INDEX idx_event_views_event_viewed_at ON public.event_views(event_id, viewed_at);
CREATE INDEX idx_event_views_sub_city ON public.event_views(sub_city);
CREATE INDEX idx_event_views_device_type ON public.event_views(device_type);

-- Trigger to increment event views_count on new view
CREATE OR REPLACE FUNCTION public.increment_event_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET views_count = views_count + 1
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_event_views_count
  AFTER INSERT ON public.event_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_event_views_count();
