import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

import { authOptions } from './options';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Node-runtime better-auth instance.
 *
 * ── Why this file is separate from `options.ts` ─────────────────────
 * `pg` (PostgreSQL driver) transitively imports `node:util/types`, `fs`,
 * `path`, `net`, `tls`, `stream`, `string_decoder`, `dns`, and other Node
 * built-ins that do NOT exist in the Next.js Edge runtime. If the
 * middleware bundle (Edge) ever reaches a `pg` import, Turbopack generates
 * `require("node:util/types")` externals and the Edge runtime throws
 * `Native module not found: node:util/types` at module evaluation.
 *
 * By keeping the `pg.Pool` construction here — in a module that
 * `src/middleware.ts` never imports — we keep the Edge bundle clean.
 *
 * ── Where this is used ──────────────────────────────────────────────
 *   - `/api/auth/[...all]/route.ts`            — better-auth HTTP endpoints
 *   - `/api/protected/**` route handlers        — session checks per request
 *   - `src/app/(organizer)/layout.tsx`         — server-side role enforcement
 *   - `src/app/(admin)/layout.tsx`             — server-side role enforcement
 *
 * ── What must NEVER import this ─────────────────────────────────────
 *   - `src/middleware.ts`                       — Edge runtime; use
 *     `getSessionCookie` from `better-auth/cookies` instead.
 *   - Any client component / `'use client'` module.
 */
// The same Pool instance backing the better-auth adapter. Exported so the
// canonical role writer (setUserRole) can write the better-auth "user" table
// directly — without the fragile `(auth as { pool }).pool` cast the
// become-organizer route used to rely on.
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
});

export const auth = betterAuth({
  ...authOptions,
  database: pool,
  // ── Profile sync (Schema-First, P1) ─────────────────────────────────
  // better-auth fires `databaseHooks.user.create.after` AFTER the row lands
  // in the `"user"` table. We mirror it into Supabase `profiles` (the domain
  // identity table every FK points at) using the service-role client so the
  // INSERT bypasses RLS.
  //
  // NOTE: the previous `callbacks.onUserCreated` form is NOT a valid
  // better-auth option — it silently never fired, leaving every account
  // without a `profiles` row (broke become-organizer FK 23503 and the
  // /api/protected/profile 404). Do not reintroduce it.
  databaseHooks: {
    user: {
      create: {
        after: async (
          user: { id: string; email: string; name?: string },
          ctx?: { request?: { headers?: Headers }; headers?: Headers } | null
        ) => {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            }
          );

          const { error } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: user.name || user.email.split('@')[0],
            role: 'attendee',
          });

          if (error) {
            console.error('[Auth] Failed to sync profile:', error);
          }

          // ── HO-E: referral attribution ────────────────────────────────
          // The invite landing captures ?ref=CODE into a cookie (see
          // RefCapture on the home page); at signup we read it here and call
          // fn_attribute_referral. The fn itself is a no-op on unknown codes,
          // self-referral, and already-attributed invitees. Best-effort:
          // never blocks account creation.
          try {
            const headers = ctx?.request?.headers ?? ctx?.headers;
            const cookieHeader = headers?.get('cookie');
            const match = cookieHeader?.match(/(?:^|;\s*)eventology_ref=([A-Za-z0-9]+)/);
            if (match?.[1]) {
              await supabase.rpc('fn_attribute_referral', {
                p_invitee: user.id,
                p_code: match[1],
              });
            }
          } catch (refErr) {
            console.warn(
              '[Auth] Referral attribution failed:',
              refErr instanceof Error ? refErr.message : 'Unknown error'
            );
          }

          // ── HO-G: complete pending ticket transfers ───────────────────
          // A transfer addressed to an email with no account stays 'pending';
          // when that account materializes, complete it. Each completion is
          // the same fn the accept route uses (email match + ticket checks
          // under lock). The route must pre-sign the rotated QR; the hook
          // reuses signQRPayload for that. Best-effort per transfer.
          try {
            const { signQRPayload } = await import('@/lib/tickets/qr');
            const { data: pending } = await supabase
              .from('ticket_transfers')
              .select('id, ticket_id')
              .eq('status', 'pending')
              .ilike('to_email', user.email);

            for (const p of pending ?? []) {
              const transferRow = p as { id: string; ticket_id: string };
              try {
                const { data: ticket } = await supabase
                  .from('tickets')
                  .select('id, registration_id, qr_version')
                  .eq('id', transferRow.ticket_id)
                  .maybeSingle();
                if (!ticket) continue;
                const t = ticket as { id: string; registration_id: string; qr_version: number };
                const newVersion = (t.qr_version ?? 0) + 1;
                await supabase.rpc('fn_accept_transfer', {
                  p_transfer: transferRow.id,
                  p_user: user.id,
                  p_new_qr_data: signQRPayload(t.id, t.registration_id, newVersion),
                  p_expected_version: t.qr_version ?? 0,
                });
              } catch (tErr) {
                console.warn(
                  '[Auth] Pending transfer completion skipped:',
                  tErr instanceof Error ? tErr.message : 'Unknown error'
                );
              }
            }
          } catch (trErr) {
            console.warn(
              '[Auth] Pending transfer lookup failed:',
              trErr instanceof Error ? trErr.message : 'Unknown error'
            );
          }
        },
      },
    },
  },
});

/**
 * setUserRole — canonical role mutation (P3: single source of truth).
 *
 * Updates BOTH the better-auth "user" table (via the same Pool the adapter
 * uses) and the domain `profiles` table (via the service-role client, which
 * bypasses RLS so the write always lands). This is the ONLY place that
 * grants the `organizer` / `admin` role from now on.
 *
 * Model: an organizer application is `pending` → an admin verifies →
 * setUserRole(profile_id, 'organizer') is called here → the user can reach
 * /org/*. Self-signup (become route) MUST NOT call this — role stays
 * `attendee` until verification.
 */
export async function setUserRole(
  userId: string,
  role: 'attendee' | 'organizer' | 'admin'
): Promise<void> {
  // 1. better-auth "user" table — the value (organizer)/layout.tsx gates on.
  await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', [role, userId]);

  // 2. Domain profiles table — the app-wide source of truth for role.
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    console.error('[setUserRole] Failed to update profiles.role:', error);
  }
}
