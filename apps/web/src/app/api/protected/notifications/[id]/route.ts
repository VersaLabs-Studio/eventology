// ============================================================================
// PATCH /api/protected/notifications/[id]
// Mark a single notification as read (or unread).
// Only the owner of the notification can mutate it (RLS enforces this).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  let body: { is_read?: boolean };
  try {
    body = await req.json();
  } catch {
    body = { is_read: true };
  }

  const isRead = body.is_read ?? true;
  const supabase = await createAuthedClient(session.user.id);

  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('user_id', session.user.id) // defense-in-depth; RLS also enforces
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/protected/notifications/[id]
 * Delete a single notification.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { id } = await params;
  const supabase = await createAuthedClient(session.user.id);

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
