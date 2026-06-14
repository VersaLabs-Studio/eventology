import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { computeOrganizerBalance } from '@/lib/payments/payouts';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * GET /api/protected/payouts/balance
 * Returns the current organizer's available balance from the ledger.
 */
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  // Find the organizer's id
  const serviceClient = createServiceClient();
  const { data: organizer } = await serviceClient
    .from('organizers')
    .select('id')
    .eq('profile_id', session.user.id)
    .maybeSingle();

  if (!organizer) {
    return NextResponse.json({
      totalEarned: 0,
      totalPaidOut: 0,
      totalRefunded: 0,
      availableBalance: 0,
      currency: 'ETB',
    });
  }

  const balance = await computeOrganizerBalance(serviceClient, organizer.id);
  return NextResponse.json(balance);
}
