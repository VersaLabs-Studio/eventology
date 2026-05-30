import { z } from 'zod';
export declare const promoCodeSchema: z.ZodObject<{
    id: z.ZodString;
    event_id: z.ZodNullable<z.ZodString>;
    organizer_id: z.ZodNullable<z.ZodString>;
    code: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    discount_type: z.ZodEnum<{
        fixed: "fixed";
        percentage: "percentage";
    }>;
    discount_value: z.ZodNumber;
    max_discount: z.ZodNullable<z.ZodNumber>;
    max_uses: z.ZodNullable<z.ZodNumber>;
    used_count: z.ZodNumber;
    max_uses_per_user: z.ZodNumber;
    is_active: z.ZodBoolean;
    starts_at: z.ZodString;
    expires_at: z.ZodNullable<z.ZodString>;
    applicable_tiers: z.ZodNullable<z.ZodArray<z.ZodString>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createPromoCodeSchema: z.ZodObject<{
    code: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    organizer_id: z.ZodNullable<z.ZodString>;
    event_id: z.ZodNullable<z.ZodString>;
    discount_value: z.ZodNumber;
    max_discount: z.ZodNullable<z.ZodNumber>;
    max_uses: z.ZodNullable<z.ZodNumber>;
    expires_at: z.ZodNullable<z.ZodString>;
    applicable_tiers: z.ZodNullable<z.ZodArray<z.ZodString>>;
    discount_type: z.ZodDefault<z.ZodEnum<{
        fixed: "fixed";
        percentage: "percentage";
    }>>;
    max_uses_per_user: z.ZodDefault<z.ZodNumber>;
    is_active: z.ZodDefault<z.ZodBoolean>;
    starts_at: z.ZodDefault<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updatePromoCodeSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    organizer_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    event_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    discount_value: z.ZodOptional<z.ZodNumber>;
    max_discount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    max_uses: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    expires_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    applicable_tiers: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    discount_type: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        fixed: "fixed";
        percentage: "percentage";
    }>>>;
    max_uses_per_user: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    starts_at: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type PromoCodeFormData = z.infer<typeof createPromoCodeSchema>;
export type PromoCodeUpdateData = z.infer<typeof updatePromoCodeSchema>;
//# sourceMappingURL=promo-code.d.ts.map