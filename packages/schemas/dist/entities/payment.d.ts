import { z } from 'zod';
export declare const paymentSchema: z.ZodObject<{
    id: z.ZodString;
    registration_id: z.ZodString;
    event_id: z.ZodString;
    user_id: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodString;
    method: z.ZodEnum<{
        pay_at_door: "pay_at_door";
        chapa: "chapa";
        telebirr: "telebirr";
        bank_transfer: "bank_transfer";
    }>;
    status: z.ZodEnum<{
        pending: "pending";
        completed: "completed";
        failed: "failed";
        refunded: "refunded";
    }>;
    provider: z.ZodNullable<z.ZodString>;
    provider_ref: z.ZodNullable<z.ZodString>;
    provider_metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    paid_at: z.ZodNullable<z.ZodString>;
    refunded_at: z.ZodNullable<z.ZodString>;
    notes: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createPaymentSchema: z.ZodObject<{
    user_id: z.ZodString;
    registration_id: z.ZodString;
    event_id: z.ZodString;
    amount: z.ZodNumber;
    provider: z.ZodNullable<z.ZodString>;
    provider_ref: z.ZodNullable<z.ZodString>;
    notes: z.ZodNullable<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    method: z.ZodDefault<z.ZodEnum<{
        pay_at_door: "pay_at_door";
        chapa: "chapa";
        telebirr: "telebirr";
        bank_transfer: "bank_transfer";
    }>>;
    provider_metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updatePaymentSchema: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodString>;
    registration_id: z.ZodOptional<z.ZodString>;
    event_id: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    provider: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    provider_ref: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    method: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        pay_at_door: "pay_at_door";
        chapa: "chapa";
        telebirr: "telebirr";
        bank_transfer: "bank_transfer";
    }>>>;
    provider_metadata: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type PaymentFormData = z.infer<typeof createPaymentSchema>;
export type PaymentUpdateData = z.infer<typeof updatePaymentSchema>;
//# sourceMappingURL=payment.d.ts.map