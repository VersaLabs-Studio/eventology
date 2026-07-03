'use client';

import { useSession, signIn, signUp, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/**
 * Central authentication hook for Eventology.
 * Wraps better-auth's client methods with toast notifications and routing.
 *
 * @example
 * const { user, isLoading, isAuthenticated, login, register, logout } = useAuth();
 */
export function useAuth() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  /**
   * Authenticate with email and password.
   * @returns `true` on success, `false` on failure.
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await signIn.email({ email, password });

    if (error) {
      toast.error(error.message || 'Invalid credentials. Please try again.');
      return false;
    }

    toast.success('Welcome back!');
    router.push('/');
    return true;
  };

  /**
   * Register a new user account.
   * Profile sync is handled by `databaseHooks.user.create.after` in
   * `lib/auth/server.ts` — the better-auth hook creates a Supabase profiles
   * row for every new user immediately after sign-up.
   * @returns `true` on success, `false` on failure.
   */
  const register = async (data: RegisterData): Promise<boolean> => {
    const { error } = await signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    if (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
      return false;
    }

    toast.success('Account created! Welcome to Eventology.');
    router.push('/');
    return true;
  };

  /**
   * Sign out the current user and redirect to home.
   */
  const logout = async () => {
    await signOut();
    toast.success('Logged out successfully.');
    router.push('/');
  };

  return {
    user: session?.user ?? null,
    session: session ?? null,
    isLoading: isPending,
    isAuthenticated: !!session,
    login,
    register,
    logout,
  };
}
