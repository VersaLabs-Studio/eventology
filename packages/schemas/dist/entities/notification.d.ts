import { z } from 'zod';
export declare const notificationSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    type: z.ZodEnum<{
        event_approved: "event_approved";
        event_rejected: "event_rejected";
        registration_confirmed: "registration_confirmed";
        event_reminder: "event_reminder";
        event_cancelled: "event_cancelled";
        new_registration: "new_registration";
        payment_received: "payment_received";
        message_received: "message_received";
        system_announcement: "system_announcement";
    }>;
    title: z.ZodString;
    message: z.ZodString;
    action_url: z.ZodNullable<z.ZodString>;
    is_read: z.ZodBoolean;
    read_at: z.ZodNullable<z.ZodString>;
    reference_type: z.ZodNullable<z.ZodString>;
    reference_id: z.ZodNullable<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createNotificationSchema: z.ZodObject<{
    type: z.ZodEnum<{
        event_approved: "event_approved";
        event_rejected: "event_rejected";
        registration_confirmed: "registration_confirmed";
        event_reminder: "event_reminder";
        event_cancelled: "event_cancelled";
        new_registration: "new_registration";
        payment_received: "payment_received";
        message_received: "message_received";
        system_announcement: "system_announcement";
    }>;
    message: z.ZodString;
    title: z.ZodString;
    user_id: z.ZodString;
    action_url: z.ZodNullable<z.ZodString>;
    reference_type: z.ZodNullable<z.ZodString>;
    reference_id: z.ZodNullable<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updateNotificationSchema: z.ZodObject<{
    is_read: z.ZodOptional<z.ZodBoolean>;
    read_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type NotificationFormData = z.infer<typeof createNotificationSchema>;
export type NotificationUpdateData = z.infer<typeof updateNotificationSchema>;
//# sourceMappingURL=notification.d.ts.map