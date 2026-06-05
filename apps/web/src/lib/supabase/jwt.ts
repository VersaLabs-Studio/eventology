import { SignJWT } from 'jose';
import { createServerClient } from '@supabase/ssr';

/**
 * Signs a Supabase-compatible JWT from the better-auth session.
 * The claims align with what RLS policies expect:
 * - sub: the profile UUID (session.user.id = profiles.id)
 * - role: 'authenticated' (matches Supabase's authenticated role)
 * - aud: 'authenticated' (required by PostgREST)
 *
 * This JWT is signed with the Supabase JWT Secret (HS256) so that
 * PostgREST validates it and `auth.uid()` resolves to the profile UUID.
 */
export async function signSupabaseJWT(profileId: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);

  return new SignJWT({ sub: profileId, role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .setAudience('authenticated')
    .sign(secret);
}

/**
 * Creates an authenticated Supabase server client that carries the
 * caller's Supabase JWT. This client passes RLS checks because
 * `auth.uid()` resolves to the profile UUID in the JWT.
 *
 * @param profileId - The caller's profile UUID (from better-auth session.user.id)
 * @returns Supabase client with Authorization header set
 */
export async function createAuthedClient(profileId: string) {
  const token = await signSupabaseJWT(profileId);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}
