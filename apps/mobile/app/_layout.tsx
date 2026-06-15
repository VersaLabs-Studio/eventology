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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { colors } from '@/lib/theme';

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
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="auto" backgroundColor={colors.background} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="event/[slug]" options={{ headerShown: true, title: 'Event' }} />
            <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
            <Stack.Screen name="payment/webview" options={{ headerShown: true, title: 'Payment' }} />
            <Stack.Screen name="organizer/index" options={{ headerShown: true, title: 'Organizer area' }} />
            <Stack.Screen name="organizer/checkin/[eventId]" options={{ headerShown: true, title: 'Check-in' }} />
            <Stack.Screen name="organizer/analytics/[eventId]" options={{ headerShown: true, title: 'Analytics' }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
