// ============================================================================
// @eventology/schemas — PromoCode Zod Schemas
// Source: 015_promo_codes.sql
// ============================================================================
import { z } from 'zod';
import { PROMO_DISCOUNT_TYPES } from '../enums';
// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------
export const promoCodeSchema = z.object({
    id: z.string().uuid(),
    event_id: z.string().uuid().nullable(),
    organizer_id: z.string().uuid().nullable(),
    code: z
        .string()
        .min(3, 'Code must be at least 3 characters')
        .max(50)
        .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric with - or _'),
    description: z.string().max(500).nullable(),
    discount_type: z.enum(PROMO_DISCOUNT_TYPES),
    discount_value: z.number().positive(),
    max_discount: z.number().positive().nullable(),
    max_uses: z.number().int().positive().nullable(),
    used_count: z.number().int().min(0),
    max_uses_per_user: z.number().int().positive(),
    is_active: z.boolean(),
    starts_at: z.string().datetime(),
    expires_at: z.string().datetime().nullable(),
    applicable_tiers: z.array(z.string().uuid()).nullable(),
    metadata: z.record(z.string(), z.unknown()).default({}),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------
export const createPromoCodeSchema = promoCodeSchema
    .omit({
    id: true,
    used_count: true,
    created_at: true,
    updated_at: true,
})
    .extend({
    discount_type: z.enum(PROMO_DISCOUNT_TYPES).default('percentage'),
    max_uses_per_user: z.number().int().positive().default(1),
    is_active: z.boolean().default(true),
    starts_at: z.string().datetime().default(() => new Date().toISOString()),
    metadata: z.record(z.string(), z.unknown()).default({}),
})
    .refine((data) => {
    if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return false;
    }
    return true;
}, { message: 'Percentage discount cannot exceed 100', path: ['discount_value'] });
// ---------------------------------------------------------------------------
// Update schema
// ---------------------------------------------------------------------------
export const updatePromoCodeSchema = createPromoCodeSchema.partial();
//# sourceMappingURL=promo-code.js.map