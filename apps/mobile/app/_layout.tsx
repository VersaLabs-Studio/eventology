// ============================================================================
// Root layout for Eventology mobile
// ============================================================================
// Wraps the entire navigation tree in three providers, in order:
//   1. SafeAreaProvider
//   2. QueryClientProvider (TanStack Query)
//   3. AuthProvider (better-auth session + API token)
//   4. Stack — file-based routing (Expo Router)
// ============================================================================

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { AuthProvider } from '@/contexts/AuthContext';
import { BiometricGate } from '@/components/BiometricGate';
import { colors } from '@/lib/theme';
import { fontAssets, installFontPatch } from '@/lib/fonts';

// Map every fontWeight to the matching Plus Jakarta Sans face, app-wide, before
// the first <Text> mounts. Idempotent.
installFontPatch();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout(): React.ReactElement {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // Hold on the brand background until the typeface is ready, so text never
  // flashes in the system font first. Font errors fall through to system.
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="auto" backgroundColor={colors.background} />
          <BiometricGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            {/* Draws its own floating back button over a full-bleed hero. */}
            <Stack.Screen name="event/[slug]" />
            <Stack.Screen name="payment/webview" options={{ headerShown: true, title: 'Payment' }} />
            <Stack.Screen name="organizer/index" options={{ headerShown: true, title: 'Organizer area' }} />
            <Stack.Screen name="organizer/checkin/[eventId]" options={{ headerShown: true, title: 'Check-in' }} />
            <Stack.Screen name="organizer/analytics/[eventId]" options={{ headerShown: true, title: 'Analytics' }} />
          </Stack>
          </BiometricGate>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
