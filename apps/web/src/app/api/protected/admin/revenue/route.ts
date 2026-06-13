import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRoute } from '@/lib/api/admin-guard';
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
  // R1 audit debt: migrate from inline role-check to requireAdminRoute
  // (consistency with the other admin routes — same 401/403 envelope).
  const guard = await requireAdminRoute(_req);
  if (!guard.ok) return guard.response;
  const { service } = guard;

  // 1. Σ amount of completed payments → GMV
  const { data: completedData } = await service
    .from('payments')
    .select('amount, platform_fee, currency, status, refunded_at, refund_amount')
    .eq('status', 'completed');

  // 2. Σ amount of refunded payments
  const { data: refundedData } = await service
    .from('payments')
    .select('refund_amount, currency')
    .eq('status', 'refunded');

  // 3. Σ amount of pending/processing payouts
  const { data: payoutsData } = await service
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
