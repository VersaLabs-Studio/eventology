import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * DELETE /api/protected/follows/[organizerId]
 * Unfollow an organizer. RLS scopes the delete to the caller's own row, so
 * deleting another user's follow is a no-op. Idempotent: 204 even if not
 * currently followed.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ organizerId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  const { organizerId } = await params;
  if (!organizerId) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'organizer id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { error } = await supabase
    .from('organizer_follows')
    .delete()
    .eq('profile_id', session.user.id)
    .eq('organizer_id', organizerId);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } } satisfies ErrorEnvelope,
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
