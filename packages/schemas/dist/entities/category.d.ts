import { z } from 'zod';
export declare const categorySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    icon: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    color: z.ZodString;
    event_count: z.ZodNumber;
    sort_order: z.ZodNumber;
    is_active: z.ZodBoolean;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createCategorySchema: z.ZodObject<{
    description: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    slug: z.ZodString;
    icon: z.ZodString;
    color: z.ZodString;
    is_active: z.ZodDefault<z.ZodBoolean>;
    sort_order: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateCategorySchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    sort_order: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, z.core.$strip>;
export type CategoryFormData = z.infer<typeof createCategorySchema>;
export type CategoryUpdateData = z.infer<typeof updateCategorySchema>;
//# sourceMappingURL=category.d.ts.map