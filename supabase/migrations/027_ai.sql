-- ============================================================================
-- Migration 027: AI Persistence (Phase 3 Day 14)
-- ============================================================================
-- Persisted AI outputs that feed workflows (admin review queues, chat
-- history). Transient outputs (recommendations, NLP search, narratives)
-- stay uncached-or-ai_cache-only — they do not need a row.
--
-- Tables:
--   - fraud_signals        — per-action fraud-detection signals (advisory)
--   - content_moderation   — per-content moderation results (advisory)
--   - ai_chat_sessions     — per-user chat session header
--   - ai_chat_messages     — per-message history (RLS-scoped via session)
--
-- RLS posture (per AI-006 / spec):
--   - fraud_signals, content_moderation:
--       service-role writes (system AI op), user can see rows about
--       their own user_id, admin can see all.
--   - ai_chat_sessions, ai_chat_messages:
--       user sees own (scoped via profile_id), admin sees all (audit).
--       The chat tier (public/organizer/admin/support) is decided at
--       the route layer from the caller's role, never client-supplied.
-- ============================================================================

-- ============================================================================
-- fraud_signals
-- ============================================================================
-- Advisory only. NEVER auto-blocks a user in V1. A 'block' recommended
-- action raises the row's priority for human review; it does NOT
-- deny the user. The financial path runs in parallel; if AI is slow
-- or fails, registration/payment still completes.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.fraud_signals (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_type        TEXT NOT NULL
                      CHECK (subject_type IN ('registration', 'payment', 'ticket_use', 'promo_code')),
  subject_id          UUID NOT NULL,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  risk_score          NUMERIC(4,3) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
  flags               TEXT[] NOT NULL DEFAULT '{}',
  recommended_action  TEXT NOT NULL
                      CHECK (recommended_action IN ('allow', 'flag', 'block', 'review')),
  reason              TEXT,
  status              TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for the admin review queue + lookup patterns
CREATE INDEX IF NOT EXISTS idx_fraud_signals_user_id
  ON public.fraud_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_status_created
  ON public.fraud_signals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_subject
  ON public.fraud_signals(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_risk
  ON public.fraud_signals(risk_score DESC)
  WHERE status = 'open';

ALTER TABLE public.fraud_signals ENABLE ROW LEVEL SECURITY;

-- Service-role can write/manage (system op).
-- Default-deny: RLS USING(false) means no one reads via auth.uid().
-- Admin gets an explicit SELECT policy. Service-role bypasses RLS.
CREATE POLICY "fraud_signals: admin reads all"
  ON public.fraud_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "fraud_signals: user reads own"
  ON public.fraud_signals FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies — service-role only. This matches
-- the existing ai_cache posture (P2 + the trust/safety advisory-only
-- contract from the spec).

-- ============================================================================
-- content_moderation
-- ============================================================================
-- Advisory. 'reject' suggestion queues for human review; it does NOT
-- auto-block the submission. Event submission and review creation
-- write a row here via the AI-006 service-role path; on AI failure,
-- the row is skipped (fail-open) and a manual review entry is created
-- instead.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_moderation (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type      TEXT NOT NULL
                    CHECK (content_type IN ('event_description', 'review', 'message', 'profile_bio')),
  content_id        UUID NOT NULL,
  author_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_safe           BOOLEAN NOT NULL DEFAULT true,
  severity          TEXT NOT NULL DEFAULT 'none'
                    CHECK (severity IN ('none', 'low', 'medium', 'high')),
  flags             TEXT[] NOT NULL DEFAULT '{}',
  suggested_action  TEXT NOT NULL DEFAULT 'approve'
                    CHECK (suggested_action IN ('approve', 'review', 'reject')),
  reason            TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_moderation_status_created
  ON public.content_moderation(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_moderation_content
  ON public.content_moderation(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_author
  ON public.content_moderation(author_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_severity
  ON public.content_moderation(severity)
  WHERE status = 'pending';

ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_moderation: admin reads all"
  ON public.content_moderation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "content_moderation: author reads own"
  ON public.content_moderation FOR SELECT
  USING (author_id = auth.uid());

-- ============================================================================
-- ai_chat_sessions
-- ============================================================================
-- One row per user-initiated chat thread. The `tier` column records
-- which prompt was used (public|organizer|admin|support) — it is set
-- by the route handler from the caller's role, never from the client.
-- `context` carries optional page/event/user context for the LLM
-- (e.g. current_page, event_title) — already filtered through
-- createAuthedClient server-side, no leakage across tiers.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier        TEXT NOT NULL
              CHECK (tier IN ('public', 'organizer', 'admin', 'support')),
  title       TEXT,
  context     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_profile_updated
  ON public.ai_chat_sessions(profile_id, updated_at DESC);

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- A user sees their own sessions. Admin sees all (for support hand-off).
CREATE POLICY "ai_chat_sessions: user reads own"
  ON public.ai_chat_sessions FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "ai_chat_sessions: user creates own"
  ON public.ai_chat_sessions FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "ai_chat_sessions: user updates own"
  ON public.ai_chat_sessions FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "ai_chat_sessions: user deletes own"
  ON public.ai_chat_sessions FOR DELETE
  USING (profile_id = auth.uid());

CREATE POLICY "ai_chat_sessions: admin reads all"
  ON public.ai_chat_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE TRIGGER set_ai_chat_sessions_updated_at
  BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ai_chat_messages
-- ============================================================================
-- Per-message history. RLS scoped through the session (user can only see
-- messages from sessions they own). `role` is the chat-completion role
-- (user|assistant|system) — system messages are only ever written by the
-- server, never the client.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_created
  ON public.ai_chat_messages(session_id, created_at);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: a user can only read messages from their own sessions
CREATE POLICY "ai_chat_messages: user reads own"
  ON public.ai_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions s
      WHERE s.id = ai_chat_messages.session_id
        AND s.profile_id = auth.uid()
    )
  );

-- INSERT: a user can write a message to their own session
CREATE POLICY "ai_chat_messages: user writes own"
  ON public.ai_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions s
      WHERE s.id = ai_chat_messages.session_id
        AND s.profile_id = auth.uid()
    )
    AND role IN ('user', 'assistant', 'system')
  );

-- Admin audit: read all
CREATE POLICY "ai_chat_messages: admin reads all"
  ON public.ai_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================================
-- ai_rate_limit_buckets
-- ============================================================================
-- Per-(user, scope) sliding-window rate limit. The AI-007 limiter
-- UPDATEs the row with `count = count + 1` and checks against the cap;
-- a separate cleanup job (or inline check) expires buckets older
-- than the window. One row per (profile_id, scope).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_rate_limit_buckets (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scope         TEXT NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, scope)
);

CREATE INDEX IF NOT EXISTS idx_ai_rate_limit_buckets_scope
  ON public.ai_rate_limit_buckets(scope);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limit_buckets_window
  ON public.ai_rate_limit_buckets(window_start);

ALTER TABLE public.ai_rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- User can see their own bucket row (useful for client UI), but
-- the service-role is what writes/reads at the route layer.
CREATE POLICY "ai_rate_limit_buckets: user reads own"
  ON public.ai_rate_limit_buckets FOR SELECT
  USING (profile_id = auth.uid());

CREATE TRIGGER set_ai_rate_limit_buckets_updated_at
  BEFORE UPDATE ON public.ai_rate_limit_buckets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
