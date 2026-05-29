-- ============================================================================
-- Migration 012: Notifications
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- In-app notifications for users. Covers registration confirmations,
-- event reminders, admin actions, and system announcements.
-- ============================================================================

-- Notifications table
CREATE TABLE public.notifications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Content
  type          public.notification_type NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  action_url    TEXT,

  -- Read state
  is_read       BOOLEAN NOT NULL DEFAULT false,
  read_at       TIMESTAMPTZ,

  -- Reference (polymorphic — can point to any entity)
  reference_type TEXT,  -- 'event', 'registration', 'payment', etc.
  reference_id   UUID,

  -- Metadata
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
