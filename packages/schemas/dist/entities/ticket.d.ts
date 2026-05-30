import { z } from 'zod';
export declare const ticketSchema: z.ZodObject<{
    id: z.ZodString;
    registration_id: z.ZodString;
    event_id: z.ZodString;
    user_id: z.ZodString;
    ticket_number: z.ZodString;
    qr_data: z.ZodString;
    tier_name: z.ZodString;
    status: z.ZodEnum<{
        cancelled: "cancelled";
        valid: "valid";
        used: "used";
    }>;
    used_at: z.ZodNullable<z.ZodString>;
    issued_at: z.ZodString;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const createTicketSchema: z.ZodObject<{
    user_id: z.ZodString;
    registration_id: z.ZodString;
    event_id: z.ZodString;
    tier_name: z.ZodString;
}, z.core.$strip>;
export declare const updateTicketSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        cancelled: "cancelled";
        valid: "valid";
        used: "used";
    }>>;
    used_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type TicketFormData = z.infer<typeof createTicketSchema>;
export type TicketUpdateData = z.infer<typeof updateTicketSchema>;
//# sourceMappingURL=ticket.d.ts.map