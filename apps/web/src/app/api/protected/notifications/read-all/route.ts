// ============================================================================
// PATCH /api/protected/notifications/read-all
// Mark all of the caller's notifications as read in one update.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

export async function PATCH(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: now })
    .eq('user_id', session.user.id)
    .eq('is_read', false)
    .select('id');

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    marked: data?.length ?? 0,
  });
}
