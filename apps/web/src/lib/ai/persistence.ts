// ============================================================================
// AI Persistence Helpers
// ============================================================================
// Thin service-role wrappers around the new AI tables (migration 027).
// These are the chokepoints that the trust & safety surface uses to
// write fraud signals + moderation results, and that the chat route
// uses to persist history.
//
// Service-role is justified: these are system AI ops that need to
// write rows RLS does not permit for end users. The "user sees own"
// RLS policies still apply for reads.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Fraud signals
// ---------------------------------------------------------------------------

export interface FraudSignalInsert {
  subject_type: 'registration' | 'payment' | 'ticket_use' | 'promo_code';
  subject_id: string;
  user_id: string | null;
  risk_score: number;
  flags: string[];
  recommended_action: 'allow' | 'flag' | 'block' | 'review';
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Writes a fraud signal row. Returns the row id, or null on failure.
 * Best-effort — callers should never block a financial op on this.
 */
export async function writeFraudSignal(
  serviceClient: SupabaseClient,
  signal: FraudSignalInsert
): Promise<string | null> {
  try {
    const { data, error } = await serviceClient
      .from('fraud_signals')
      .insert({
        subject_type: signal.subject_type,
        subject_id: signal.subject_id,
        user_id: signal.user_id,
        risk_score: signal.risk_score,
        flags: signal.flags,
        recommended_action: signal.recommended_action,
        reason: signal.reason ?? null,
        metadata: signal.metadata ?? {},
        status: 'open',
      })
      .select('id')
      .single();

    if (error || !data) {
      console.warn('[AI/fraud] writeFraudSignal failed:', error?.message);
      return null;
    }
    return data.id;
  } catch (err) {
    console.warn(
      '[AI/fraud] writeFraudSignal threw:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Content moderation
// ---------------------------------------------------------------------------

export interface ModerationInsert {
  content_type: 'event_description' | 'review' | 'message' | 'profile_bio';
  content_id: string;
  author_id: string | null;
  is_safe: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  flags: string[];
  suggested_action: 'approve' | 'review' | 'reject';
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Writes a moderation row. Returns the row id, or null on failure.
 * Best-effort — callers should never block content submission on this.
 */
export async function writeModeration(
  serviceClient: SupabaseClient,
  mod: ModerationInsert
): Promise<string | null> {
  try {
    const { data, error } = await serviceClient
      .from('content_moderation')
      .insert({
        content_type: mod.content_type,
        content_id: mod.content_id,
        author_id: mod.author_id,
        is_safe: mod.is_safe,
        severity: mod.severity,
        flags: mod.flags,
        suggested_action: mod.suggested_action,
        reason: mod.reason ?? null,
        metadata: mod.metadata ?? {},
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data) {
      console.warn('[AI/moderation] writeModeration failed:', error?.message);
      return null;
    }
    return data.id;
  } catch (err) {
    console.warn(
      '[AI/moderation] writeModeration threw:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Chat sessions / messages
// ---------------------------------------------------------------------------

export interface ChatSessionInsert {
  profile_id: string;
  tier: 'public' | 'organizer' | 'admin' | 'support';
  title?: string | null;
  context?: Record<string, unknown>;
}

export async function createChatSession(
  serviceClient: SupabaseClient,
  session: ChatSessionInsert
): Promise<string | null> {
  try {
    const { data, error } = await serviceClient
      .from('ai_chat_sessions')
      .insert({
        profile_id: session.profile_id,
        tier: session.tier,
        title: session.title ?? null,
        context: session.context ?? {},
      })
      .select('id')
      .single();

    if (error || !data) {
      console.warn('[AI/chat] createChatSession failed:', error?.message);
      return null;
    }
    return data.id;
  } catch (err) {
    console.warn(
      '[AI/chat] createChatSession threw:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return null;
  }
}

export interface ChatMessageInsert {
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

export async function appendChatMessage(
  serviceClient: SupabaseClient,
  msg: ChatMessageInsert
): Promise<string | null> {
  try {
    const { data, error } = await serviceClient
      .from('ai_chat_messages')
      .insert({
        session_id: msg.session_id,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata ?? {},
      })
      .select('id')
      .single();

    if (error || !data) {
      console.warn('[AI/chat] appendChatMessage failed:', error?.message);
      return null;
    }
    // Touch updated_at on the parent session
    await serviceClient
      .from('ai_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', msg.session_id);
    return data.id;
  } catch (err) {
    console.warn(
      '[AI/chat] appendChatMessage threw:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return null;
  }
}

export interface ChatMessageRow {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Loads the most recent N messages for a session. Authed client —
 * RLS scopes to the caller's own sessions.
 */
export async function loadChatHistory(
  authedClient: SupabaseClient,
  sessionId: string,
  limit: number = 50
): Promise<ChatMessageRow[]> {
  const { data, error } = await authedClient
    .from('ai_chat_messages')
    .select('id, role, content, metadata, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.warn('[AI/chat] loadChatHistory failed:', error.message);
    return [];
  }
  return (data ?? []) as ChatMessageRow[];
}
