import { z } from 'zod';
export declare const organizerSchema: z.ZodObject<{
    id: z.ZodString;
    profile_id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    avatar_url: z.ZodNullable<z.ZodString>;
    bio: z.ZodNullable<z.ZodString>;
    website: z.ZodNullable<z.ZodString>;
    social_links: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    is_verified: z.ZodBoolean;
    verification_status: z.ZodEnum<{
        pending: "pending";
        rejected: "rejected";
        verified: "verified";
    }>;
    verification_notes: z.ZodNullable<z.ZodString>;
    events_count: z.ZodNumber;
    total_attendees: z.ZodNumber;
    stripe_account_id: z.ZodNullable<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createOrganizerSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    profile_id: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    avatar_url: z.ZodNullable<z.ZodString>;
    bio: z.ZodNullable<z.ZodString>;
    website: z.ZodNullable<z.ZodString>;
    verification_status: z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        rejected: "rejected";
        verified: "verified";
    }>>;
    social_links: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updateOrganizerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    profile_id: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avatar_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    website: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    verification_status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        pending: "pending";
        rejected: "rejected";
        verified: "verified";
    }>>>;
    social_links: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    metadata: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type OrganizerFormData = z.infer<typeof createOrganizerSchema>;
export type OrganizerUpdateData = z.infer<typeof updateOrganizerSchema>;
//# sourceMappingURL=organizer.d.ts.map