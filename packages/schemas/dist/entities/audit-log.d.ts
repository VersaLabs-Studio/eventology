import { z } from 'zod';
export declare const auditLogSchema: z.ZodObject<{
    id: z.ZodString;
    actor_id: z.ZodNullable<z.ZodString>;
    action: z.ZodEnum<{
        event_approved: "event_approved";
        event_rejected: "event_rejected";
        event_featured: "event_featured";
        event_unfeatured: "event_unfeatured";
        organizer_verified: "organizer_verified";
        organizer_rejected: "organizer_rejected";
        user_role_changed: "user_role_changed";
        user_deactivated: "user_deactivated";
        user_activated: "user_activated";
        registration_created: "registration_created";
        payment_completed: "payment_completed";
        system_config_changed: "system_config_changed";
    }>;
    target_type: z.ZodString;
    target_id: z.ZodNullable<z.ZodString>;
    target_label: z.ZodNullable<z.ZodString>;
    details: z.ZodNullable<z.ZodString>;
    old_values: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    new_values: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    ip_address: z.ZodNullable<z.ZodString>;
    user_agent: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
}, z.core.$strip>;
export declare const createAuditLogSchema: z.ZodObject<{
    actor_id: z.ZodNullable<z.ZodString>;
    action: z.ZodEnum<{
        event_approved: "event_approved";
        event_rejected: "event_rejected";
        event_featured: "event_featured";
        event_unfeatured: "event_unfeatured";
        organizer_verified: "organizer_verified";
        organizer_rejected: "organizer_rejected";
        user_role_changed: "user_role_changed";
        user_deactivated: "user_deactivated";
        user_activated: "user_activated";
        registration_created: "registration_created";
        payment_completed: "payment_completed";
        system_config_changed: "system_config_changed";
    }>;
    target_type: z.ZodString;
    target_id: z.ZodNullable<z.ZodString>;
    target_label: z.ZodNullable<z.ZodString>;
    details: z.ZodNullable<z.ZodString>;
    ip_address: z.ZodNullable<z.ZodString>;
    user_agent: z.ZodNullable<z.ZodString>;
    old_values: z.ZodDefault<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    new_values: z.ZodDefault<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type AuditLogFormData = z.infer<typeof createAuditLogSchema>;
//# sourceMappingURL=audit-log.d.ts.map