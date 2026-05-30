import { z } from 'zod';
export declare const reviewSchema: z.ZodObject<{
    id: z.ZodString;
    event_id: z.ZodString;
    user_id: z.ZodString;
    rating: z.ZodNumber;
    title: z.ZodNullable<z.ZodString>;
    content: z.ZodNullable<z.ZodString>;
    is_approved: z.ZodBoolean;
    is_flagged: z.ZodBoolean;
    flag_reason: z.ZodNullable<z.ZodString>;
    moderated_by: z.ZodNullable<z.ZodString>;
    moderated_at: z.ZodNullable<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createReviewSchema: z.ZodObject<{
    title: z.ZodNullable<z.ZodString>;
    user_id: z.ZodString;
    event_id: z.ZodString;
    rating: z.ZodNumber;
    content: z.ZodNullable<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updateReviewSchema: z.ZodObject<{
    is_approved: z.ZodOptional<z.ZodBoolean>;
    is_flagged: z.ZodOptional<z.ZodBoolean>;
    flag_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    moderated_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    moderated_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type ReviewFormData = z.infer<typeof createReviewSchema>;
export type ReviewUpdateData = z.infer<typeof updateReviewSchema>;
//# sourceMappingURL=review.d.ts.map