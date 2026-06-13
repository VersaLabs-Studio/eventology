// ============================================================================
// GET    /api/protected/conversations/[id]/messages
//   List messages in a conversation the caller participates in. RLS
//   `Messages: conversation participant read` self-enforces.
//
// POST   /api/protected/conversations/[id]/messages
//   Send a message in a conversation. RLS `Messages: participant create`
//   self-enforces. sender_id is forced to the caller.
//
// PATCH  /api/protected/conversations/[id]
//   Mark a conversation as read by appending the caller's id to read_by
//   on the LAST message they want to ack (per-message read tracking).
//   For V1 we just add the caller to the latest message's read_by.
//
// DELETE /api/protected/conversations/[id]
//   Soft-leave: the caller removes themselves from participant_ids.
//   They will lose access (RLS will exclude them). Use POST a new
//   conversation to re-open.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope, ListEnvelope } from '@/lib/api';

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  type: 'text' | 'image' | 'system';
  content: string;
  attachments: string[];
  read_by: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id: conversationId } = await params;
  if (!conversationId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'conversation id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));

  const { data, error, count } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  const rows = (data ?? []) as MessageRow[];
  return NextResponse.json({
    data: rows,
    meta: { total: count ?? 0, page: 1, limit: rows.length },
  } satisfies ListEnvelope<MessageRow>);
}

const sendSchema = z.object({
  content: z.string().min(1).max(4000),
  type: z.enum(['text', 'image', 'system']).default('text'),
  attachments: z.array(z.string().url()).max(10).optional().default([]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id: conversationId } = await params;
  if (!conversationId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'conversation id required' } } satisfies ErrorEnvelope,
      { status: 400 }
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

  const parsed = sendSchema.safeParse(body);
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

  // RLS will reject if the caller is not a participant; the FK from
  // sender_id → profiles is enforced by the schema. We don't need an
  // explicit ownership lookup — the authed-client insert will fail with
  // a row-level security violation if the caller isn't a participant.
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      type: parsed.data.type,
      content: parsed.data.content,
      attachments: parsed.data.attachments,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
