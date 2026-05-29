-- ============================================================================
-- Migration 014: Audit Log
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Records every significant admin/platform action for compliance and
-- accountability. Immutable — records are never updated or deleted.
-- ============================================================================

-- Audit log table
CREATE TABLE public.audit_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Action details
  action          public.audit_action NOT NULL,
  target_type     TEXT NOT NULL,  -- 'event', 'user', 'organizer', etc.
  target_id       UUID,
  target_label    TEXT,  -- Human-readable label (e.g., event title)

  -- Context
  details         TEXT,
  old_values      JSONB,
  new_values      JSONB,

  -- Request metadata
  ip_address      TEXT,
  user_agent      TEXT,

  -- Timestamp (immutable)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (optimized for audit queries)
CREATE INDEX idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_target_type ON public.audit_log(target_type);
CREATE INDEX idx_audit_log_target_id ON public.audit_log(target_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Composite index for common queries (actor + date range)
CREATE INDEX idx_audit_log_actor_created ON public.audit_log(actor_id, created_at DESC);
