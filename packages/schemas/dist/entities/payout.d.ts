import { z } from 'zod';
export declare const payoutSchema: z.ZodObject<{
    id: z.ZodString;
    organizer_id: z.ZodString;
    event_id: z.ZodNullable<z.ZodString>;
    amount: z.ZodNumber;
    currency: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        completed: "completed";
        failed: "failed";
        processing: "processing";
    }>;
    provider: z.ZodNullable<z.ZodString>;
    provider_ref: z.ZodNullable<z.ZodString>;
    bank_account: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    processed_at: z.ZodNullable<z.ZodString>;
    completed_at: z.ZodNullable<z.ZodString>;
    notes: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createPayoutSchema: z.ZodObject<{
    organizer_id: z.ZodString;
    event_id: z.ZodNullable<z.ZodString>;
    amount: z.ZodNumber;
    provider: z.ZodNullable<z.ZodString>;
    provider_ref: z.ZodNullable<z.ZodString>;
    notes: z.ZodNullable<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    bank_account: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updatePayoutSchema: z.ZodObject<{
    organizer_id: z.ZodOptional<z.ZodString>;
    event_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    amount: z.ZodOptional<z.ZodNumber>;
    provider: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    provider_ref: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    bank_account: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type PayoutFormData = z.infer<typeof createPayoutSchema>;
export type PayoutUpdateData = z.infer<typeof updatePayoutSchema>;
//# sourceMappingURL=payout.d.ts.map