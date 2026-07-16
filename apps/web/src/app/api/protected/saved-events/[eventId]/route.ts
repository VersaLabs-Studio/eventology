import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * DELETE /api/protected/saved-events/[eventId]
 * Unsave an event. RLS scopes the delete to the caller's own row, so deleting
 * another user's save is a no-op. Idempotent: 204 even if not currently saved.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { eventId } = await params;
  if (!eventId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'event id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { error } = await supabase
    .from('saved_events')
    .delete()
    .eq('profile_id', session.user.id)
    .eq('event_id', eventId);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
