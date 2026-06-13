// ============================================================================
// GET  /api/protected/conversations
//   List the caller's conversations. RLS `Conversations: participant
//   read` self-enforces.
//
// POST /api/protected/conversations
//   Create a conversation. Body: { participant_ids: string[], type?,
//   subject?, event_id?, initial_message?: string }. The caller is
//   ALWAYS appended to participant_ids (so they cannot lock themselves
//   out). The initial_message, if provided, is written as the first
//   `messages` row by the same caller.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

export interface ConversationRow {
  id: string;
  type: 'direct' | 'event_inquiry' | 'support';
  event_id: string | null;
  subject: string | null;
  participant_ids: string[];
  last_message_at: string | null;
  last_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows = (data ?? []) as ConversationRow[];
  return NextResponse.json({
    data: rows,
    meta: { total: rows.length, page: 1, limit: rows.length },
  } satisfies ListEnvelope<ConversationRow>);
}

const createSchema = z.object({
  participant_ids: z.array(z.string().uuid()).min(1).max(50),
  type: z.enum(['direct', 'event_inquiry', 'support']).default('direct'),
  event_id: z.string().uuid().optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  initial_message: z.string().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const parsed = createSchema.safeParse(body);
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

  const supabase = await createAuthedClient(session.user.id);

  // Dedupe + always include caller
  const ids = new Set<string>([session.user.id, ...parsed.data.participant_ids]);

  const insertPayload: Record<string, unknown> = {
    type: parsed.data.type,
    participant_ids: Array.from(ids),
  };
  if (parsed.data.event_id) insertPayload.event_id = parsed.data.event_id;
  if (parsed.data.subject) insertPayload.subject = parsed.data.subject;

  const { data, error } = await supabase
    .from('conversations')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  // Optional initial message
  if (parsed.data.initial_message && parsed.data.initial_message.trim().length > 0) {
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: data.id,
      sender_id: session.user.id,
      type: 'text',
      content: parsed.data.initial_message.trim(),
    });
    if (msgErr) {
      // Non-fatal: the conversation exists; the initial message write
      // failed. Caller can retry. We log so it shows up in monitoring.
      console.warn('[conversations] initial_message insert failed:', msgErr.message);
    }
  }

  return NextResponse.json(data, { status: 201 });
}
