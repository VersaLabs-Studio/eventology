import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import type { ErrorEnvelope } from '@/lib/api';

export interface PlatformRevenue {
  /** Total Gross Merchandise Value (Σ completed payment amounts) */
  gmv: number;
  /** Total platform commission earned */
  platformFees: number;
  /** Total refunded */
  totalRefunded: number;
  /** Total pending payouts (not yet disbursed) */
  outstandingPayouts: number;
  /** Number of completed payments */
  completedPayments: number;
  /** Number of refunded payments */
  refundedPayments: number;
  currency: string;
}

/**
 * GET /api/protected/admin/revenue
 * Platform-wide revenue summary for the admin dashboard.
 * Admin role enforced at the app layer (RLS is row-level, not role-based).
 */
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  // App-level role guard
  const authedClient = await createAuthedClient(session.user.id);
  const { data: profile } = await authedClient
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } } satisfies ErrorEnvelope,
      { status: 403 }
    );
  }

  // Service-role for aggregate queries (read-only is fine, but simpler).
  const serviceClient = createServiceClient();

  // 1. Σ amount of completed payments → GMV
  const { data: completedData } = await serviceClient
    .from('payments')
    .select('amount, platform_fee, currency, status, refunded_at, refund_amount')
    .eq('status', 'completed');

  // 2. Σ amount of refunded payments
  const { data: refundedData } = await serviceClient
    .from('payments')
    .select('refund_amount, currency')
    .eq('status', 'refunded');

  // 3. Σ amount of pending/processing payouts
  const { data: payoutsData } = await serviceClient
    .from('payouts')
    .select('amount, currency')
    .in('status', ['pending', 'processing']);

  let gmv = 0;
  let platformFees = 0;
  let currency = 'ETB';
  for (const row of completedData ?? []) {
    gmv += Number(row.amount ?? 0);
    platformFees += Number(row.platform_fee ?? 0);
    if (row.currency) currency = row.currency as string;
  }

  let totalRefunded = 0;
  for (const row of refundedData ?? []) {
    totalRefunded += Number(row.refund_amount ?? 0);
  }

  let outstandingPayouts = 0;
  for (const row of payoutsData ?? []) {
    outstandingPayouts += Number(row.amount ?? 0);
  }

  // 2dp round
  gmv = Math.round(gmv * 100) / 100;
  platformFees = Math.round(platformFees * 100) / 100;
  totalRefunded = Math.round(totalRefunded * 100) / 100;
  outstandingPayouts = Math.round(outstandingPayouts * 100) / 100;

  const result: PlatformRevenue = {
    gmv,
    platformFees,
    totalRefunded,
    outstandingPayouts,
    completedPayments: completedData?.length ?? 0,
    refundedPayments: refundedData?.length ?? 0,
    currency,
  };

  return NextResponse.json(result);
}
