// ============================================================================
// better-auth Expo client
// ============================================================================
// Wraps the better-auth React client and wires it up with expo-secure-store
// for cookie persistence (the standard `storage` adapter interface).
//
// better-auth 1.6.x doesn't ship a dedicated expo plugin; the supported
// pattern is to pass a `storage` adapter to createAuthClient that
// satisfies the `getItem/setItem/removeItem` shape. SecureStore's async
// API is compatible with the optional Promise return types.
//
// The server-side better-auth instance lives in apps/web/src/lib/auth/.
// On sign-in, the server returns the session cookie; the better-auth
// client automatically persists it via the storage adapter and attaches
// it to subsequent fetch calls.
// ============================================================================

import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000';

/**
 * SecureStore-backed storage adapter. better-auth's Storage interface
 * requires getItem/setItem/removeItem with optional Promise returns.
 */
const secureStorage = {
  getItem: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
};

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  storage: secureStorage,
});

export type Session = typeof authClient.$Infer.Session;
export type User = Session['user'];
