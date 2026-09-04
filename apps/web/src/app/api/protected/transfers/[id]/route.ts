import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { mapTransferError } from '@/lib/tickets/transfer-errors';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * DELETE /api/protected/transfers/[id] — the SENDER cancels a pending
 * transfer (HO-G). Nothing has moved yet, so no QR rotation occurs. The fn
 * verifies from_profile = auth.uid() and status = 'pending' under lock.
 */
export async function DELETE(
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
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'transfer id required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const { error: fnError } = await supabase.rpc('fn_cancel_transfer', {
    p_transfer: id,
  });

  if (fnError) {
    return mapTransferError(fnError.message);
  }

  return new NextResponse(null, { status: 204 });
}
