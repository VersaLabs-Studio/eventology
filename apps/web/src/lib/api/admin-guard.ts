// ============================================================================
// Admin Route Guard — server-side role enforcement for /api/protected/admin/*
// ============================================================================
// P1+P6 enforcement: RLS is row-level, not role-based. EVERY admin route must
// additionally check `profile.role === 'admin'` at the app layer before
// touching the DB. This helper centralizes the 401/403 envelope shape so
// every admin route is uniform.
//
// Reuses `requireAdmin` from `@/lib/ai/role-guard` (which already
// encapsulates the role-check via `getCallerContext`).
//
// Usage:
//   const ctx = await requireAdminRoute(req);
//   if (!ctx.ok) return ctx.response;
//   const { authed, service, userId } = ctx;
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';
import { createAuthedClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/ai/role-guard';
import type { ErrorEnvelope } from '@/lib/api';

export type AdminGuardSuccess = {
  ok: true;
  authed: SupabaseClient;
  service: SupabaseClient;
  userId: string;
};

export type AdminGuardFailure = {
  ok: false;
  response: NextResponse;
};

export type AdminGuardResult = AdminGuardSuccess | AdminGuardFailure;

/**
 * Loads the caller's session + verifies the caller is an admin. Returns
 * the authed + service-role clients on success so the route can use them.
 *
 * Always reuses an existing authed client under the hood; the service
 * client is for system reads (aggregates, audit_log) that RLS-gated
 * queries can't express in a single round-trip.
 */
export async function requireAdminRoute(req: NextRequest): Promise<AdminGuardResult> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        } satisfies ErrorEnvelope,
        { status: 401 }
      ),
    };
  }

  const userId = session.user.id;
  const authed = await createAuthedClient(userId);
  const guard = await requireAdmin(authed, session.user);
  if (!guard.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: {
            code: guard.reason ?? 'FORBIDDEN',
            message: 'Admin role required',
          },
        } satisfies ErrorEnvelope,
        { status: 403 }
      ),
    };
  }

  return { ok: true, authed, service: createServiceClient(), userId };
}

/**
 * Helper for routes that need to write a row to audit_log. Encapsulates
 * the column shape so every mutation uses the same audit vocabulary
 * (action, target_type, target_id, target_label, details, new_values).
 */
export interface AuditWrite {
  actor_id: string;
  action:
    | 'event_approved'
    | 'event_rejected'
    | 'event_featured'
    | 'event_unfeatured'
    | 'organizer_verified'
    | 'organizer_rejected'
    | 'user_role_changed'
    | 'user_deactivated'
    | 'user_activated'
    | 'registration_created'
    | 'payment_completed'
    | 'system_config_changed';
  target_type: string;
  target_id?: string | null;
  target_label?: string | null;
  details?: string | null;
  new_values?: Record<string, unknown> | null;
  old_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export async function writeAuditLog(
  service: SupabaseClient,
  entry: AuditWrite
): Promise<void> {
  await service.from('audit_log').insert({
    actor_id: entry.actor_id,
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id ?? null,
    target_label: entry.target_label ?? null,
    details: entry.details ?? null,
    new_values: entry.new_values ?? null,
    old_values: entry.old_values ?? null,
    ip_address: entry.ip_address ?? null,
    user_agent: entry.user_agent ?? null,
  });
}
