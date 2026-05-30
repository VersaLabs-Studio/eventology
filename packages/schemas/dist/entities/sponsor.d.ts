import { z } from 'zod';
export declare const sponsorSchema: z.ZodObject<{
    id: z.ZodString;
    event_id: z.ZodString;
    name: z.ZodString;
    logo_url: z.ZodNullable<z.ZodString>;
    website: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    tier: z.ZodEnum<{
        platinum: "platinum";
        gold: "gold";
        silver: "silver";
        bronze: "bronze";
    }>;
    sort_order: z.ZodNumber;
    is_active: z.ZodBoolean;
    contact_name: z.ZodNullable<z.ZodString>;
    contact_email: z.ZodNullable<z.ZodString>;
    contact_phone: z.ZodNullable<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createSponsorSchema: z.ZodObject<{
    description: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    website: z.ZodNullable<z.ZodString>;
    event_id: z.ZodString;
    logo_url: z.ZodNullable<z.ZodString>;
    contact_name: z.ZodNullable<z.ZodString>;
    contact_email: z.ZodNullable<z.ZodString>;
    contact_phone: z.ZodNullable<z.ZodString>;
    tier: z.ZodDefault<z.ZodEnum<{
        platinum: "platinum";
        gold: "gold";
        silver: "silver";
        bronze: "bronze";
    }>>;
    sort_order: z.ZodDefault<z.ZodNumber>;
    is_active: z.ZodDefault<z.ZodBoolean>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updateSponsorSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    event_id: z.ZodOptional<z.ZodString>;
    logo_url: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact_email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact_phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tier: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        platinum: "platinum";
        gold: "gold";
        silver: "silver";
        bronze: "bronze";
    }>>>;
    sort_order: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    metadata: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export type SponsorFormData = z.infer<typeof createSponsorSchema>;
export type SponsorUpdateData = z.infer<typeof updateSponsorSchema>;
//# sourceMappingURL=sponsor.d.ts.map