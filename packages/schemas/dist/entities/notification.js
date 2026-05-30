// ============================================================================
// @eventology/schemas — Notification Zod Schemas
// Source: 012_notifications.sql
// ============================================================================
import { z } from 'zod';
import { NOTIFICATION_TYPES } from '../enums';
// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------
export const notificationSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    type: z.enum(NOTIFICATION_TYPES),
    title: z.string().min(1).max(255),
    message: z.string().min(1),
    action_url: z.string().url().nullable(),
    is_read: z.boolean(),
    read_at: z.string().datetime().nullable(),
    reference_type: z.string().nullable(),
    reference_id: z.string().uuid().nullable(),
    metadata: z.record(z.string(), z.unknown()).default({}),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});
// ---------------------------------------------------------------------------
// Create schema
// ---------------------------------------------------------------------------
export const createNotificationSchema = notificationSchema
    .omit({
    id: true,
    is_read: true,
    read_at: true,
    created_at: true,
    updated_at: true,
})
    .extend({
    metadata: z.record(z.string(), z.unknown()).default({}),
});
// ---------------------------------------------------------------------------
// Update schema (mark as read)
// ---------------------------------------------------------------------------
export const updateNotificationSchema = z.object({
    is_read: z.boolean().optional(),
    read_at: z.string().datetime().nullable().optional(),
});
//# sourceMappingURL=notification.js.map