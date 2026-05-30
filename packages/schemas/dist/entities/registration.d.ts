import { z } from 'zod';
export declare const registrationSchema: z.ZodObject<{
    id: z.ZodString;
    event_id: z.ZodString;
    user_id: z.ZodString;
    ticket_tier_id: z.ZodString;
    attendee_name: z.ZodString;
    attendee_email: z.ZodString;
    attendee_phone: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        cancelled: "cancelled";
        confirmed: "confirmed";
        checked_in: "checked_in";
        waitlisted: "waitlisted";
    }>;
    checked_in_at: z.ZodNullable<z.ZodString>;
    qr_data: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createRegistrationSchema: z.ZodObject<{
    user_id: z.ZodString;
    event_id: z.ZodString;
    ticket_tier_id: z.ZodString;
    attendee_name: z.ZodString;
    attendee_email: z.ZodString;
    attendee_phone: z.ZodNullable<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updateRegistrationSchema: z.ZodObject<{
    user_id: z.ZodOptional<z.ZodString>;
    event_id: z.ZodOptional<z.ZodString>;
    ticket_tier_id: z.ZodOptional<z.ZodString>;
    attendee_name: z.ZodOptional<z.ZodString>;
    attendee_email: z.ZodOptional<z.ZodString>;
    attendee_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type RegistrationFormData = z.infer<typeof createRegistrationSchema>;
export type RegistrationUpdateData = z.infer<typeof updateRegistrationSchema>;
//# sourceMappingURL=registration.d.ts.map