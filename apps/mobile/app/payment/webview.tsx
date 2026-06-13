// ============================================================================
// Chapa webview — paid registration payment
// ============================================================================
// Opens the stub checkout URL in a WebView and watches for the return
// callback (`/api/protected/payments/stub-callback?ref=…` which
// confirm-payments + issues the ticket). On success, navigates to
// /my-tickets (which auto-refreshes via TanStack Query).
//
// SECURITY: The payment provider is the stub seam. The HMAC server-side
// verification + commission split live in
// `apps/web/src/lib/payments/confirm-payment.ts` — the app only opens
// the URL and reads the result. The ticket is only issued if the
// server confirmPayment call succeeds.
// ============================================================================

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/lib/theme';

type NavigationState = { url: string };

export default function PaymentWebViewScreen(): React.ReactElement {
  const { url, registrationId } = useLocalSearchParams<{ url: string; registrationId: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const surface = isDark ? colors.surfaceDark : colors.surface;
  const router = useRouter();
  const qc = useQueryClient();
  const [loading, setLoading] = React.useState(true);
  const [errored, setErrored] = React.useState(false);

  // The stub callback URL marks success. We watch for it.
  const isCallbackUrl = (u: string) =>
    u.includes('/api/protected/payments/stub-callback') || u.includes('payment/success') || u.includes('payment/cancel');

  const onNavigationStateChange = (navState: NavigationState) => {
    setLoading(navState.url !== url);
    if (isCallbackUrl(navState.url)) {
      // The stub callback URL is server-redirected; once we land on it,
      // the server has already confirmed payment + issued a ticket. We
      // pop back to the previous screen and let the user see their
      // ticket in My Tickets (auto-refreshes via invalidate).
      void qc.invalidateQueries({ queryKey: ['tickets'] });
      void qc.invalidateQueries({ queryKey: ['registrations'] });
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      router.replace('/(tabs)/tickets?registered=1');
    }
  };

  if (!url) {
    return (
      <View style={[styles.fallback, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <Stack.Screen options={{ title: 'Payment', headerShown: true }} />
          <View style={styles.fallbackInner}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
            <Text style={[styles.fallbackTitle, { color: text }]}>Missing checkout URL</Text>
            <Text style={[styles.fallbackBody, { color: textMuted }]}>
              We couldn't open the payment page. Please try registering again.
            </Text>
            <Button label="Back" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (errored) {
    return (
      <View style={[styles.fallback, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <Stack.Screen options={{ title: 'Payment', headerShown: true }} />
          <View style={styles.fallbackInner}>
            <Ionicons name="cloud-offline-outline" size={48} color={textMuted} />
            <Text style={[styles.fallbackTitle, { color: text }]}>Couldn't load the payment page</Text>
            <Text style={[styles.fallbackBody, { color: textMuted }]}>
              Check your connection and try again. Your registration is held — re-open this page to retry.
            </Text>
            <Button label="Retry" onPress={() => setErrored(false)} />
            <Button label="Back" variant="outline" onPress={() => router.back()} style={{ marginTop: spacing.sm }} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Payment', headerShown: true }} />
        <WebView
          source={{ uri: url }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setErrored(true);
          }}
          onNavigationStateChange={onNavigationStateChange}
          // The payment provider is the stub seam — no live keys.
          // The WebView is the thin transport; HMAC verification + ticket
          // issuance are server-side (apps/web/src/lib/payments/confirm-payment.ts).
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.loadingOverlay, { backgroundColor: surface }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: textMuted }]}>
                Loading payment…
              </Text>
            </View>
          )}
          // V1: payment is the stub seam. Allow all origins.
          originWhitelist={['*']}
        />
        {loading && (
          <View style={[styles.loadingBar, { backgroundColor: surface }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: textMuted, fontSize: 12, marginLeft: spacing.sm }}>
              Connecting to Chapa…
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fallback: { flex: 1 },
  fallbackInner: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  fallbackTitle: { ...typography.h2, textAlign: 'center' },
  fallbackBody: { ...typography.body, textAlign: 'center', maxWidth: 320 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: spacing.md, fontSize: 13 },
  loadingBar: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
