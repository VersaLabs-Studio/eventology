// ============================================================================
// GET /api/protected/ai/chat/sessions
// AI-005 — List the current user's chat sessions, newest first.
// RLS-scoped (a user sees only their own).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAuthedClient } from '@/lib/supabase/server';
import type { ErrorEnvelope } from '@/lib/api';

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
    .from('ai_chat_sessions')
    .select('id, tier, title, created_at, updated_at')
    .eq('profile_id', session.user.id)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }
  return NextResponse.json({ data: data ?? [] });
}
