// ============================================================================
// @eventology/schemas — AuditLog Zod Schemas
// Source: 014_audit_log.sql
// ============================================================================
// Note: Audit logs are immutable — no update schema. Create only.
// ============================================================================
import { z } from 'zod';
import { AUDIT_ACTIONS } from '../enums';
// ---------------------------------------------------------------------------
// Base schema (matches DB constraints exactly)
// ---------------------------------------------------------------------------
export const auditLogSchema = z.object({
    id: z.string().uuid(),
    actor_id: z.string().uuid().nullable(),
    action: z.enum(AUDIT_ACTIONS),
    target_type: z.string().min(1),
    target_id: z.string().uuid().nullable(),
    target_label: z.string().nullable(),
    details: z.string().nullable(),
    old_values: z.record(z.string(), z.unknown()).nullable(),
    new_values: z.record(z.string(), z.unknown()).nullable(),
    ip_address: z.string().nullable(),
    user_agent: z.string().nullable(),
    created_at: z.string().datetime(),
});
// ---------------------------------------------------------------------------
// Create schema (audit logs are insert-only)
// ---------------------------------------------------------------------------
export const createAuditLogSchema = auditLogSchema
    .omit({
    id: true,
    created_at: true,
})
    .extend({
    old_values: z.record(z.string(), z.unknown()).nullable().default(null),
    new_values: z.record(z.string(), z.unknown()).nullable().default(null),
});
//# sourceMappingURL=audit-log.js.map