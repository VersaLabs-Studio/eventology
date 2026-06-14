// ============================================================================
// @eventology/schemas — Notification Zod Schemas
// Source: 012_notifications.sql + 026_comms.sql
// ============================================================================

import { z } from 'zod';
import { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } from '../enums';

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

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type NotificationFormData = z.infer<typeof createNotificationSchema>;
export type NotificationUpdateData = z.infer<typeof updateNotificationSchema>;

// ===========================================================================
// 026_comms.sql — notification_deliveries
// ===========================================================================

export const DELIVERY_STATUSES = ['queued', 'sent', 'failed', 'skipped'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const notificationDeliverySchema = z.object({
  id: z.string().uuid(),
  notification_id: z.string().uuid(),
  channel: z.enum(NOTIFICATION_CHANNELS),
  status: z.enum(DELIVERY_STATUSES),
  provider: z.string().nullable(),
  provider_ref: z.string().nullable(),
  error: z.string().nullable(),
  attempts: z.number().int().min(0),
  sent_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export type NotificationDelivery = z.infer<typeof notificationDeliverySchema>;

// ===========================================================================
// 026_comms.sql — notification_preferences
// ===========================================================================

export const SUPPORTED_LOCALES = ['en', 'am'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const notificationPreferencesSchema = z.object({
  profile_id: z.string().uuid(),
  email_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  push_enabled: z.boolean(),
  marketing_opt_in: z.boolean(),
  locale: z.enum(SUPPORTED_LOCALES),
  quiet_hours_start: z.string().nullable(),
  quiet_hours_end: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const updateNotificationPreferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  marketing_opt_in: z.boolean().optional(),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
  quiet_hours_start: z.string().nullable().optional(),
  quiet_hours_end: z.string().nullable().optional(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type NotificationPreferencesUpdate = z.infer<typeof updateNotificationPreferencesSchema>;

// ===========================================================================
// 026_comms.sql — push_tokens (read-only for web; mobile V2 will write)
// ===========================================================================

export const PUSH_PLATFORMS = ['ios', 'android', 'web'] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

export const pushTokenSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  token: z.string().min(1),
  platform: z.enum(PUSH_PLATFORMS),
  last_seen: z.string().datetime(),
  created_at: z.string().datetime(),
});

export type PushToken = z.infer<typeof pushTokenSchema>;

