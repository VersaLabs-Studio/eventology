// ============================================================================
// Push notifications — Expo tokens + register
// ============================================================================
// Resolves the Expo push token via expo-notifications and registers it
// with the web backend at /api/protected/devices. Deregister on
// sign-out. The web route enforces RLS — it only ever upserts a row
// where profile_id = auth.uid().
// ============================================================================

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { api } from '@/lib/api';

type NotificationsModule = typeof import('expo-notifications');

const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000';

// Expo Go dropped remote-push support in SDK 53. Importing expo-notifications
// eagerly runs its DevicePushTokenAutoRegistration side effect, which errors on
// import — and because expo-router evaluates route modules during render, that
// error surfaces while the tree is mounting. Load the module lazily so Expo Go
// never evaluates it; a development build or the standalone APK still gets push.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let notificationsModule: NotificationsModule | null = null;

function getNotifications(): NotificationsModule | null {
  if (isExpoGo) return null;
  notificationsModule ??= require('expo-notifications') as NotificationsModule;
  return notificationsModule;
}

let cachedToken: string | null = null;

/**
 * Resolve the Expo push token. On Android we need a notification
 * channel + permission grant. On iOS we just request permission.
 */
export async function resolveExpoPushToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;

  if (Platform.OS === 'web') return null;

  const Notifications = getNotifications();
  if (!Notifications) return null; // Expo Go — push tokens are unavailable

  try {
    // Android: ensure a default channel exists
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#065F46',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
    });
    cachedToken = tokenData.data;
    return tokenData.data;
  } catch {
    return null;
  }
}

/**
 * Register the resolved push token with the web backend. Idempotent
 * (server upserts on (profile_id, token)).
 */
export async function registerPushTokenWithServer(): Promise<{ ok: boolean; error?: string }> {
  const token = await resolveExpoPushToken();
  if (!token) return { ok: false, error: 'No push token available' };

  const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';

  try {
    await api.post(`${API_BASE_URL}/api/protected/devices`, {
      token,
      platform,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to register push token',
    };
  }
}

/**
 * Deregister the push token (on sign-out). Best-effort.
 */
export async function deregisterPushTokenFromServer(token: string | null): Promise<void> {
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/api/protected/devices`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
  } catch {
    // best-effort
  }
}

/**
 * Configure the foreground notification handler so banners show while
 * the app is in the foreground. Call once on app boot.
 */
export function configureForegroundHandler(): void {
  if (Platform.OS === 'web') return;

  const Notifications = getNotifications();
  if (!Notifications) return; // Expo Go — no notification handler to install

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export { API_BASE_URL };
