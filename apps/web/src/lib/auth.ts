import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

/**
 * better-auth server configuration.
 * Connects directly to Supabase PostgreSQL via the `pg` driver.
 * Uses database-backed sessions (not JWT) for maximum security.
 */
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // ── Email + Password ──────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Flip to true in production
  },

  // ── Phone Number (OTP) ────────────────────────────────────────────
  phoneNumber: {
    enabled: true,
    sendOTP: async ({ phoneNumber, otp }: { phoneNumber: string; otp: string }) => {
      // TODO: Connect to Africa's Talking in Phase 3
      console.log(`[Auth] OTP for ${phoneNumber}: ${otp}`);
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
      preferred_language: {
        type: 'string',
        defaultValue: 'en',
      },
    },
  },

  // ── Callbacks ─────────────────────────────────────────────────────
  callbacks: {
    async onUserCreated({ user }: { user: { id: string; email: string; name?: string } }) {
      // Sync the new user to the Supabase `profiles` table
      const { createClient } = require('@supabase/supabase-js');
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
        auth_id: user.id,
        email: user.email,
        full_name: user.name || user.email.split('@')[0],
        role: 'attendee',
        preferred_language: 'en',
      });

      if (error) {
        console.error('[Auth] Failed to sync profile:', error);
      }
    },
  },
});
