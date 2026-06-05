import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

import { authOptions } from './options';

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
export const auth = betterAuth({
  ...authOptions,
  database: new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
  }),
  callbacks: {
    async onUserCreated({ user }: { user: { id: string; email: string; name?: string } }) {
      // Sync the new user to the Supabase `profiles` table
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
    },
  },
});
