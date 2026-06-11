// ============================================================================
// Commission Resolver
// ============================================================================
// Single source of truth for the commission rate and the 2dp-correct split.
// Uses per-organizer override if set, otherwise falls back to the platform
// default. The split math is integer-scaled (rounds to 2dp) so the
// payments_commission_check CHECK constraint never rejects an insert.
// ============================================================================

import { PLATFORM_COMMISSION_RATE } from '@eventology/config';

export interface CommissionInput {
  /** Per-organizer rate override (percentage, e.g. 8.0 = 8%). NULL = use platform default. */
  organizerRate?: number | null;
}

export interface CommissionSplit {
  /** Platform commission in event currency */
  platformFee: number;
  /** Organizer net amount in event currency */
  organizerAmount: number;
  /** The rate actually used (percentage) */
  rateUsed: number;
}

/**
 * Resolves the effective commission rate for a registration.
 * Per-organizer override → platform default fallback.
 */
export function resolveCommissionRate(input: CommissionInput): number {
  return input.organizerRate ?? PLATFORM_COMMISSION_RATE;
}

/**
 * Computes the 2dp-correct commission split for a given price and rate.
 * Reused across Day 11/12 paid paths. Sum of platformFee + organizerAmount
 * always equals `price` (rounded) — safe for the CHECK constraint.
 *
 * @example
 *   splitCommission(1500, 5)  // → { platformFee: 75, organizerAmount: 1425 }
 *   splitCommission(20.10, 5) // → { platformFee: 1.01, organizerAmount: 19.09 }
 *   splitCommission(33.33, 8) // → { platformFee: 2.67, organizerAmount: 30.66 }
 */
export function splitCommission(price: number, ratePercent: number): CommissionSplit {
  const platformFee = Math.round(price * ratePercent) / 100;
  const organizerAmount = Math.round((price - platformFee) * 100) / 100;
  return { platformFee, organizerAmount, rateUsed: ratePercent };
}
