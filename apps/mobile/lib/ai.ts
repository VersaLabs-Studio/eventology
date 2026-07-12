// ============================================================================
// Mobile AI client
// ============================================================================
// Thin, typed wrappers over the web app's AI routes — the same endpoints the
// web UI calls, so mobile inherits the server-side provider seam (stub by
// default, OpenRouter when AI_PROVIDER=openrouter) with no client-side keys.
//
// Every helper is best-effort: the AI routes already degrade gracefully
// (ok:false + empty/null data, never a 500 for a soft failure), so callers
// render a fallback rather than an error. Network errors surface as
// ApiClientError from the shared api client and are caught at the call site.
// ============================================================================

import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Chatbot — POST /api/protected/ai/chat
// ---------------------------------------------------------------------------

export interface AiChatContext {
  current_page?: string;
  event_id?: string;
  event_title?: string;
}

export interface AiChatResponse {
  ok: boolean;
  session_id: string;
  tier: 'public' | 'organizer' | 'admin';
  reply: string | null;
  escalate_to_human?: boolean;
  reason?: string;
}

/**
 * Send one chat turn. Pass the `session_id` returned by the previous turn to
 * continue the same conversation (the server appends and reloads history).
 */
export async function sendChatMessage(
  message: string,
  sessionId?: string,
  context?: AiChatContext
): Promise<AiChatResponse> {
  return api.post<AiChatResponse>('/api/protected/ai/chat', {
    message,
    ...(sessionId ? { session_id: sessionId } : {}),
    ...(context ? { context } : {}),
  });
}

// ---------------------------------------------------------------------------
// Recommendations — GET /api/protected/recommendations
// ---------------------------------------------------------------------------

export interface AiRecommendation {
  event_id: string;
  title: string;
  match_score: number;
  reason: string;
}

interface RecommendationsResponse {
  ok: boolean;
  data: AiRecommendation[];
  reason?: string;
}

/** Personalized picks for the signed-in user. Empty list for new users. */
export async function fetchRecommendations(): Promise<AiRecommendation[]> {
  const res = await api.get<RecommendationsResponse>('/api/protected/recommendations');
  return res.data ?? [];
}

// ---------------------------------------------------------------------------
// Event summary — POST /api/protected/ai/event-summary
// ---------------------------------------------------------------------------

export interface AiEventSummary {
  summary: string;
  highlights: string[];
}

interface EventSummaryResponse {
  ok: boolean;
  data: AiEventSummary | null;
  reason?: string;
}

/** One-click TL;DR for a long event description. Null when AI is unavailable. */
export async function fetchEventSummary(eventId: string): Promise<AiEventSummary | null> {
  const res = await api.post<EventSummaryResponse>('/api/protected/ai/event-summary', {
    event_id: eventId,
  });
  return res.data ?? null;
}

// ---------------------------------------------------------------------------
// NLP search interpret — POST /api/public/search/interpret
// ---------------------------------------------------------------------------

export interface InterpretedSearch {
  interpreted_query: string;
  filters: {
    categories?: string[];
    event_types?: string[];
    locations?: string[];
    date_range?: { start?: string; end?: string };
    price_range?: { min?: number; max?: number };
    tags?: string[];
  };
  keywords: string[];
  intent: string;
}

export interface InterpretResult {
  ok: boolean;
  data: InterpretedSearch | null;
  reason?: string;
}

/**
 * Expand a free-text query into structured filters. Public route — no auth.
 * Best-effort: on any failure returns ok:false so the caller falls back to a
 * plain keyword search.
 */
export async function interpretSearch(query: string): Promise<InterpretResult> {
  try {
    return await api.post<InterpretResult>('/api/public/search/interpret', { query });
  } catch {
    return { ok: false, data: null, reason: 'NETWORK' };
  }
}
