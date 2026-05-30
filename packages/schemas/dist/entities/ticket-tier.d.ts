import { z } from 'zod';
export declare const ticketTierSchema: z.ZodObject<{
    id: z.ZodString;
    event_id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    capacity: z.ZodNumber;
    sold_count: z.ZodNumber;
    sort_order: z.ZodNumber;
    is_active: z.ZodBoolean;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createTicketTierSchema: z.ZodObject<{
    description: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    event_id: z.ZodString;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    capacity: z.ZodDefault<z.ZodNumber>;
    sort_order: z.ZodDefault<z.ZodNumber>;
    is_active: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateTicketTierSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    event_id: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    capacity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    sort_order: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    is_active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
export type TicketTierFormData = z.infer<typeof createTicketTierSchema>;
export type TicketTierUpdateData = z.infer<typeof updateTicketTierSchema>;
//# sourceMappingURL=ticket-tier.d.ts.map