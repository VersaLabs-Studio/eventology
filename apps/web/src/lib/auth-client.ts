import { createAuthClient } from 'better-auth/react';

/**
 * better-auth client configuration.
 * Provides React hooks and methods for authentication.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

export const { signIn, signUp, signOut, useSession } = authClient;
