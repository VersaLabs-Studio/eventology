// ============================================================================
// +not-found — branded catch-all for unmatched routes
// ============================================================================
// Without this file expo-router renders its stock "Unmatched Route" developer
// screen, which is what users saw after signing in (the auth screens navigated
// to "/(tabs)/index", which is not a route — index screens resolve to their
// parent path, so the target was always "/").
//
// The navigation bug is fixed, but this screen stays: a bad deep link or a
// stale notification `action_url` should land somewhere that looks like the app.
// ============================================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { usePalette } from '@/lib/palette';
import { colors, spacing, typography } from '@/lib/theme';

export default function NotFoundScreen(): React.ReactElement {
  const p = usePalette();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Logo size="lg" markOnly />

          <View style={[styles.iconWrap, { backgroundColor: p.surfaceMuted }]}>
            <Ionicons name="compass-outline" size={28} color={p.textMuted} />
          </View>

          <Text style={[styles.title, { color: p.text }]}>This page doesn't exist</Text>
          <Text style={[styles.description, { color: p.textMuted }]}>
            The link may be out of date, or the event may have been removed.
          </Text>

          <View style={styles.actions}>
            <Button
              label="Back to Discover"
              leftIcon="compass-outline"
              onPress={() => router.replace('/')}
              fullWidth
            />
            {router.canGoBack() ? (
              <Button label="Go back" variant="outline" onPress={() => router.back()} fullWidth />
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  title: { ...typography.h1, textAlign: 'center' },
  description: { ...typography.body, textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
});
