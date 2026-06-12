// ============================================================================
// AI Role Guard
// ============================================================================
// Centralizes the role-guard logic for AI surfaces. Mirrors the
// refund-route guard pattern: caller must own the event OR be admin.
// All AI routes that touch organizer- or admin-owned data go through
// `requireOrganizerOwnership` or `requireAdmin`.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from 'better-auth';

export interface GuardResult {
  ok: boolean;
  reason?:
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_OWNER'
    | 'NOT_ADMIN'
    | 'NOT_ORGANIZER'
    | 'NO_ORGANIZER_PROFILE';
  profileRole?: 'attendee' | 'organizer' | 'admin';
  organizerId?: string;
}

/**
 * Loads the caller's profile role + organizer id (if any). Returns a
 * normalized result; routes use it to short-circuit on failure.
 */
export async function getCallerContext(
  supabase: SupabaseClient,
  user: { id: string }
): Promise<GuardResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    return { ok: false, reason: 'UNAUTHORIZED' };
  }
  const role = profile.role as 'attendee' | 'organizer' | 'admin';
  return { ok: true, profileRole: role };
}

/**
 * Requires the caller to be an admin. Returns ok=false with NOT_ADMIN
 * otherwise. Admin surfaces: platform health, audit log, fraud queue,
 * moderation queue.
 */
export async function requireAdmin(
  supabase: SupabaseClient,
  user: { id: string }
): Promise<GuardResult> {
  const ctx = await getCallerContext(supabase, user);
  if (!ctx.ok) return ctx;
  if (ctx.profileRole !== 'admin') {
    return { ok: false, reason: 'NOT_ADMIN', profileRole: ctx.profileRole };
  }
  return ctx;
}

/**
 * Requires the caller to own the given event (i.e. they have an
 * organizer profile whose id == events.organizer_id), or to be an admin.
 * Use for organizer-assist routes (description/tags/narrative/etc.).
 */
export async function requireOrganizerOwnership(
  supabase: SupabaseClient,
  user: { id: string },
  eventId: string
): Promise<GuardResult> {
  const ctx = await getCallerContext(supabase, user);
  if (!ctx.ok) return ctx;

  // Admin bypasses ownership check
  if (ctx.profileRole === 'admin') {
    return ctx;
  }

  if (ctx.profileRole !== 'organizer') {
    return { ok: false, reason: 'NOT_ORGANIZER', profileRole: ctx.profileRole };
  }

  // Resolve the caller's organizer id
  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!organizer) {
    return { ok: false, reason: 'NO_ORGANIZER_PROFILE', profileRole: ctx.profileRole };
  }

  // Confirm the event is owned by this organizer
  const { data: event } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .maybeSingle();

  if (!event) {
    return { ok: false, reason: 'FORBIDDEN', profileRole: ctx.profileRole };
  }
  if (event.organizer_id !== organizer.id) {
    return { ok: false, reason: 'NOT_OWNER', profileRole: ctx.profileRole };
  }

  return { ok: true, profileRole: ctx.profileRole, organizerId: organizer.id };
}

/**
 * Returns a chat tier derived from the caller's role. NEVER trust a
 * client-supplied tier — this is the security guardrail for AI-005.
 *
 * Mapping:
 *   - admin       → 'admin'
 *   - organizer   → 'organizer'
 *   - attendee    → 'public'
 *
 * The 'support' tier is reserved for a future support-agent flow and
 * is not derivable from the current profile roles. (No public mapping.)
 */
export function resolveChatTier(
  profileRole: 'attendee' | 'organizer' | 'admin'
): 'public' | 'organizer' | 'admin' {
  if (profileRole === 'admin') return 'admin';
  if (profileRole === 'organizer') return 'organizer';
  return 'public';
}

/** Type guard for User from better-auth. */
export function isBetterAuthUser(u: unknown): u is User {
  return typeof u === 'object' && u !== null && 'id' in u;
}
