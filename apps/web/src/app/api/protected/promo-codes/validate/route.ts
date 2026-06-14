import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { validatePromoCode, calculateDiscount } from '@/lib/payments/promo-codes';
import type { ErrorEnvelope } from '@/lib/api';

/**
 * POST /api/protected/promo-codes/validate
 * Lightweight preview endpoint for the checkout UI.
 * Body: { code, event_id, tier_price }
 * Returns: { is_valid, discount_type, discount_value, discount_amount, error_message }
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ErrorEnvelope,
      { status: 401 }
    );
  }

  let body: { code?: string; event_id?: string; tier_price?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  if (!body.code || !body.event_id || typeof body.tier_price !== 'number') {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMS', message: 'code, event_id, and tier_price are required' } } satisfies ErrorEnvelope,
      { status: 400 }
    );
  }

  const supabase = await createAuthedClient(session.user.id);
  const result = await validatePromoCode(supabase, body.code, body.event_id, session.user.id);

  if (!result.is_valid) {
    return NextResponse.json({
      is_valid: false,
      discount_type: null,
      discount_value: 0,
      discount_amount: 0,
      error_message: result.error_message,
    });
  }

  // Calculate the actual discount amount
  const discountAmount = result.discount_type
    ? calculateDiscount(body.tier_price, result.discount_type, result.discount_value, result.max_discount)
    : 0;

  return NextResponse.json({
    is_valid: true,
    discount_type: result.discount_type,
    discount_value: result.discount_value,
    discount_amount: discountAmount,
    final_price: Math.round((body.tier_price - discountAmount) * 100) / 100,
    error_message: null,
  });
}
