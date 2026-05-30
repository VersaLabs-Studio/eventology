import { z } from 'zod';
export declare const profileSchema: z.ZodObject<{
    id: z.ZodString;
    full_name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    avatar_url: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<{
        attendee: "attendee";
        organizer: "organizer";
        admin: "admin";
    }>;
    is_active: z.ZodBoolean;
    bio: z.ZodNullable<z.ZodString>;
    website: z.ZodNullable<z.ZodString>;
    social_links: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    preferences: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    last_seen_at: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createProfileSchema: z.ZodObject<{
    email: z.ZodString;
    phone: z.ZodNullable<z.ZodString>;
    avatar_url: z.ZodNullable<z.ZodString>;
    bio: z.ZodNullable<z.ZodString>;
    website: z.ZodNullable<z.ZodString>;
    full_name: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        attendee: "attendee";
        organizer: "organizer";
        admin: "admin";
    }>>;
    is_active: z.ZodDefault<z.ZodBoolean>;
    social_links: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    preferences: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avatar_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    website: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    full_name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        attendee: "attendee";
        organizer: "organizer";
        admin: "admin";
    }>>>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    social_links: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    preferences: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type ProfileFormData = z.infer<typeof createProfileSchema>;
export type ProfileUpdateData = z.infer<typeof updateProfileSchema>;
//# sourceMappingURL=profile.d.ts.map