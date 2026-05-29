-- ============================================================================
-- Migration 018: AI Cache
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Caches AI/LLM responses to reduce API costs and latency.
-- Used for event recommendations, search suggestions, and chatbot responses.
-- Cache entries expire based on the expires_at timestamp.
-- ============================================================================

-- AI cache table
CREATE TABLE public.ai_cache (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key     TEXT UNIQUE NOT NULL,
  model_used    TEXT NOT NULL,
  prompt_hash   TEXT NOT NULL,
  response      TEXT NOT NULL,
  tokens_used   INTEGER NOT NULL DEFAULT 0,
  latency_ms    INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON public.ai_cache(expires_at);
CREATE INDEX idx_ai_cache_prompt_hash ON public.ai_cache(prompt_hash);

-- Enable RLS
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Only service role can access AI cache (not exposed to client)
CREATE POLICY "AI cache: service role only"
  ON public.ai_cache FOR ALL
  USING (false)
  WITH CHECK (false);

-- Helper function: clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.ai_cache
  WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
