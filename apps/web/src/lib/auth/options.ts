import type { BetterAuthOptions } from 'better-auth';
import { phoneNumber } from 'better-auth/plugins/phone-number';

/**
 * Shared better-auth options — Edge-runtime safe.
 *
 * This module MUST NOT import any Node-only dependency:
 *   - No `pg` (transitively pulls `node:util/types`, `fs`, `path`, `net`, `tls`, …)
 *   - No `@supabase/supabase-js` (server client, Node-only)
 *   - No `node:*` built-ins
 *
 * It is imported by:
 *   - `src/lib/auth/server.ts` (Node runtime — extends with the `pg.Pool`
 *     database adapter and the `onUserCreated` Supabase callback)
 *   - Anything else that needs the *configuration* (secret, base URL,
 *     additional fields, OTP settings) on either runtime.
 *
 * It is NOT imported by `src/middleware.ts` — that file runs on the Edge
 * runtime and uses `getSessionCookie` from `better-auth/cookies` instead.
 *
 * ── Architectural DNA ─────────────────────────────────────────────────
 * P3 (Extreme Modularization): a single source of truth for auth config,
 * sliced so each runtime only loads what it can execute.
 * P1 (Schema-First): the `additionalFields` shape below mirrors the
 * `profiles` table columns from the Supabase schema; if you change one,
 * change the other.
 */
export const authOptions: BetterAuthOptions = {
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: (process.env.BETTER_AUTH_URL || 'http://localhost:3000') + '/api/auth',

  // ── Email + Password ──────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Flip to true in production
  },

  // ── Phone Number (OTP) ────────────────────────────────────────────
  // v1.6 plugin API. The previous top-level `phoneNumber: { ... }` config-key
  // form is not in `BetterAuthOptions`; the plugin form is fully typed.
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }: { phoneNumber: string; code: string }) => {
        // TODO: Connect to Africa's Talking in Phase 3
        console.log(`[Auth] OTP for ${phoneNumber}: ${code}`);
      },
    }),
  ],

  // ── Database ID Generation ──────────────────────────────────────────
  // better-auth defaults to random strings for user.id.  Our schema keys
  // identity on UUID (`profiles.id` is UUID, all domain FKs point there).
  // Mint UUIDs so `onUserCreated` inserts a valid UUID into profiles.
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  // ── Session ────────────────────────────────────────────────────────
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
  },

  // ── User Additional Fields ────────────────────────────────────────
  // Maps to the `profiles` table schema from Phase 1A
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'attendee',
      },
      full_name: {
        type: 'string',
        required: false,
      },
      phone: {
        type: 'string',
        required: false,
      },
      avatar_url: {
        type: 'string',
        required: false,
      },
    },
  },
};
