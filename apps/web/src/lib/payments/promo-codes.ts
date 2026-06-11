// ============================================================================
// Promo Codes Library
// ============================================================================
// Discount calculation and application logic.
// Uses the existing validate_promo_code RPC for read-side validation and
// the new apply_promo_code RPC (migration 025) for atomic usage increment.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

export interface PromoValidationResult {
  is_valid: boolean;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number;
  max_discount: number | null;
  error_message: string | null;
}

export interface PromoApplicationResult {
  success: boolean;
  promo_id?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  max_discount?: number | null;
  error_message?: string;
}

/**
 * Calculates the discount amount for a given price and promo code.
 * Money-safe: rounds to 2dp, floors at 0, caps at the price.
 */
export function calculateDiscount(
  price: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  maxDiscount: number | null
): number {
  let raw: number;
  if (discountType === 'percentage') {
    raw = Math.round(price * discountValue) / 100;
    if (maxDiscount !== null && raw > maxDiscount) {
      raw = maxDiscount;
    }
  } else {
    raw = discountValue;
  }
  // Floor at 0, cap at price
  return Math.max(0, Math.min(price, Math.round(raw * 100) / 100));
}

/**
 * Validates a promo code (read-only) via the existing RPC.
 * Does NOT increment used_count — use applyPromoCode for that.
 */
export async function validatePromoCode(
  supabase: SupabaseClient,
  code: string,
  eventId: string,
  userId: string
): Promise<PromoValidationResult> {
  const { data, error } = await supabase.rpc('validate_promo_code', {
    p_code: code,
    p_event_id: eventId,
    p_user_id: userId,
  });

  if (error) {
    return {
      is_valid: false,
      discount_type: null,
      discount_value: 0,
      max_discount: null,
      error_message: error.message,
    };
  }

  // RPC returns an array of rows
  const row = Array.isArray(data) ? data[0] : data;
  return {
    is_valid: row?.is_valid ?? false,
    discount_type: row?.discount_type ?? null,
    discount_value: Number(row?.discount_value ?? 0),
    max_discount: row?.max_discount !== undefined ? Number(row.max_discount) : null,
    error_message: row?.error_message ?? null,
  };
}

/**
 * Atomically validates AND increments a promo code's used_count.
 * Uses the new apply_promo_code RPC (migration 025) which locks the row
 * via FOR UPDATE to prevent concurrent double-spend.
 *
 * Should be called AFTER the registration succeeds but before
 * the payment is fully confirmed.
 */
export async function applyPromoCode(
  supabase: SupabaseClient,
  code: string,
  eventId: string,
  userId: string
): Promise<PromoApplicationResult> {
  const { data, error } = await supabase.rpc('apply_promo_code', {
    p_code: code,
    p_event_id: eventId,
    p_user_id: userId,
  });

  if (error) {
    return {
      success: false,
      error_message: error.message,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    success: row?.success ?? false,
    promo_id: row?.promo_id ?? undefined,
    discount_type: row?.discount_type ?? undefined,
    discount_value: row?.discount_value !== undefined ? Number(row.discount_value) : undefined,
    max_discount: row?.max_discount !== undefined ? Number(row.max_discount) : undefined,
    error_message: row?.error_message ?? undefined,
  };
}
