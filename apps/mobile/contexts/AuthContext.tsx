// ============================================================================
// Auth context — provides session/user state to the app tree
// ============================================================================
// Mirrors the better-auth react session. On mount, hydrates from
// SecureStore (via the expo plugin's storage). Exposes signIn / signUp /
// signOut helpers + a `useAuth()` hook. R2: also registers the Expo
// push token on sign-in and deregisters on sign-out.
// ============================================================================

import React from 'react';
import { authClient, type Session } from '@/lib/auth';
import { setAuthToken } from '@/lib/api';
import { configureForegroundHandler, deregisterPushTokenFromServer, registerPushTokenWithServer } from '@/lib/push';

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

// One-time foreground handler setup (module init).
configureForegroundHandler();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const result = await authClient.getSession();
      const s = (result.data ?? null) as Session | null;
      setSession(s);
      setAuthToken(null);

      // R2: on a fresh session, fire-and-forget the push token register.
      // The server route enforces RLS — a session is required to write.
      if (s) {
        void registerPushTokenWithServer();
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
    // R2: best-effort push token deregister. We don't have the token
    // here (it lives in the push module), so we just rely on the
    // server to expire stale tokens via last_seen. In a future
    // version we'll pass the cached token here.
    void deregisterPushTokenFromServer(null);
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
