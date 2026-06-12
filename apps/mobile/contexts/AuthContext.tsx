// ============================================================================
// Auth context — provides session/user state to the app tree
// ============================================================================
// Mirrors the better-auth react session. On mount, hydrates from
// SecureStore (via the expo plugin's storage). Exposes signIn / signUp /
// signOut helpers + a `useAuth()` hook.
// ============================================================================

import React from 'react';
import { authClient, type Session } from '@/lib/auth';
import { setAuthToken } from '@/lib/api';

interface AuthState {
  session: Session | null;
  user: Session['user'] | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (input: { email: string; password: string; fullName: string }) =>
    Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const result = await authClient.getSession();
      const s = (result.data ?? null) as Session | null;
      setSession(s);
      if (s) {
        // Attach the session cookie as the auth token for our API client.
        // better-auth's getSession() returns a cookie via document.cookie
        // on web; on native, the expoSecureStore plugin keeps the cookie
        // in SecureStore. We don't need to manually attach on native —
        // the cookie is sent automatically by the fetch client. Setting
        // an empty token tells the api client "use stored cookies".
        setAuthToken(null);
      } else {
        setAuthToken(null);
      }
    } catch {
      setSession(null);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    void (async () => {
      await refresh();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      try {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          return { ok: false as const, error: result.error.message ?? 'Sign-in failed' };
        }
        await refresh();
        return { ok: true as const };
      } catch (err) {
        return { ok: false as const, error: err instanceof Error ? err.message : 'Sign-in failed' };
      }
    },
    [refresh]
  );

  const signUp = React.useCallback(
    async (input: { email: string; password: string; fullName: string }) => {
      try {
        const result = await authClient.signUp.email({
          email: input.email,
          password: input.password,
          name: input.fullName,
        });
        if (result.error) {
          return { ok: false as const, error: result.error.message ?? 'Sign-up failed' };
        }
        await refresh();
        return { ok: true as const };
      } catch (err) {
        return { ok: false as const, error: err instanceof Error ? err.message : 'Sign-up failed' };
      }
    },
    [refresh]
  );

  const signOut = React.useCallback(async () => {
    try {
      await authClient.signOut();
    } catch {
      // Best-effort — even if the server call fails, drop local state
    }
    setSession(null);
    setAuthToken(null);
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [session, loading, signIn, signUp, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
