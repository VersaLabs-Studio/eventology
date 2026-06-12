// ============================================================================
// POST /api/protected/ai/chat
// AI-005 — Tiered chat. Server-resolves the tier from the caller's role
// (NEVER trusts a client-supplied tier). Persists the user + assistant
// messages to ai_chat_sessions / ai_chat_messages. Returns the assistant
// reply + the session id (for follow-up turns).
//
// This route handles "first turn" (creates a session) AND follow-up
// turns (session_id in body, appends to existing session).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { getCallerContext, resolveChatTier } from '@/lib/ai/role-guard';
import { aiChatbotResponse } from '@/lib/ai/service';
import { consumeRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/ai/rate-limit';
import { createChatSession, appendChatMessage, loadChatHistory } from '@/lib/ai/persistence';
import type { ChatbotMessage } from '@eventology/ai';
import type { ErrorEnvelope } from '@/lib/api';

const RequestSchema = z.object({
  session_id: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
  context: z
    .object({
      user_name: z.string().optional(),
      current_page: z.string().optional(),
      event_id: z.string().uuid().optional(),
      event_title: z.string().optional(),
    })
    .optional(),
});

interface ChatResponse {
  ok: boolean;
  session_id: string;
  tier: 'public' | 'organizer' | 'admin';
  reply: string | null;
  escalate_to_human?: boolean;
  reason?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }
  const userId = session.user.id;
  const service = createServiceClient();
  const authed = await createAuthedClient(userId);

  // Rate limit
  const limit = await consumeRateLimit(service, userId, RATE_LIMITS.chat);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many chat messages. Slow down and try again.',
        },
      } satisfies ErrorEnvelope,
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  // Parse body
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }
  const parsed = RequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.flatten(),
        },
      } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  // Resolve tier server-side. NEVER trust client.
  const ctx = await getCallerContext(authed, session.user);
  if (!ctx.ok) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }
  const tier = resolveChatTier(ctx.profileRole!);

  // Load profile name for context (best-effort, no PII leakage)
  const { data: profile } = await authed
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();
  const userName = profile?.full_name ?? undefined;

  // Resolve or create the session
  let sessionId = parsed.data.session_id;
  if (!sessionId) {
    const newId = await createChatSession(service, {
      profile_id: userId,
      tier,
      title: parsed.data.message.slice(0, 60),
      context: { user_name: userName },
    });
    if (!newId) {
      return NextResponse.json(
        { error: { code: 'SESSION_CREATE_FAILED', message: 'Could not create chat session' } } satisfies ErrorEnvelope,
        { status: 500 }
      );
    }
    sessionId = newId;
  } else {
    // Verify the session belongs to the caller (RLS-enforced, but
    // we double-check tier to prevent escalation: a user with role
    // 'public' must not be able to write to a session created with
    // tier='organizer')
    const { data: existing } = await authed
      .from('ai_chat_sessions')
      .select('id, tier, profile_id')
      .eq('id', sessionId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found' } } satisfies ErrorEnvelope,
        { status: 404 }
      );
    }
    if (existing.profile_id !== userId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Session belongs to a different user' } } satisfies ErrorEnvelope,
        { status: 403 }
      );
    }
    // If the existing session tier doesn't match the caller's current
    // tier, demote/promote the session to the current tier. This
    // prevents an organizer from creating a 'public' session then
    // mutating to 'organizer' by passing their own role. (Note: in
    // practice, the tier is fixed at session creation because the
    // route derives it from the role, but role changes mid-session
    // are a real concern.)
    if (existing.tier !== tier) {
      await service
        .from('ai_chat_sessions')
        .update({ tier })
        .eq('id', sessionId);
    }
  }

  // Load history (RLS-scoped)
  const history = await loadChatHistory(authed, sessionId, 50);
  const messages: ChatbotMessage[] = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: parsed.data.message },
  ];

  // Persist the user message
  await appendChatMessage(service, {
    session_id: sessionId,
    role: 'user',
    content: parsed.data.message,
    metadata: {},
  });

  // Call the chatbot
  const result = await aiChatbotResponse({
    tier,
    messages,
    context: {
      user_name: userName,
      user_role: ctx.profileRole,
      current_page: parsed.data.context?.current_page,
      event_id: parsed.data.context?.event_id,
      event_title: parsed.data.context?.event_title,
    },
  });

  if (!result.ok || !result.data) {
    // Persist a system note so the next turn can recover
    await appendChatMessage(service, {
      session_id: sessionId,
      role: 'system',
      content: 'AI_UNAVAILABLE',
      metadata: { reason: 'service_returned_null' },
    });
    const response: ChatResponse = {
      ok: false,
      session_id: sessionId,
      tier,
      reply: null,
      reason: 'AI_UNAVAILABLE',
    };
    return NextResponse.json(response, { headers: rateLimitHeaders(limit) });
  }

  // Persist the assistant reply
  await appendChatMessage(service, {
    session_id: sessionId,
    role: 'assistant',
    content: result.data.response,
    metadata: {
      escalate_to_human: result.data.escalate_to_human ?? false,
      suggested_actions: result.data.suggested_actions ?? [],
    },
  });

  const response: ChatResponse = {
    ok: true,
    session_id: sessionId,
    tier,
    reply: result.data.response,
    ...(result.data.escalate_to_human ? { escalate_to_human: true } : {}),
  };
  return NextResponse.json(response, { headers: rateLimitHeaders(limit) });
}
