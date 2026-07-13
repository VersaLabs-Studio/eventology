// ============================================================================
// BiometricGate — Face ID / fingerprint app-unlock (opt-in)
// ============================================================================
// Wraps the navigation tree. When the user has enabled biometric lock (Profile →
// Security), the app content is covered by a lock overlay on cold start and each
// time the app returns from the background, until the user authenticates. When
// the preference is off, this is a transparent pass-through.
// ============================================================================

import React from 'react';
import { AppState, type AppStateStatus, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { authenticate, isBiometricLockEnabled } from '@/lib/biometric';
import { useLocale } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/lib/theme';

export function BiometricGate({ children }: { children: React.ReactNode }): React.ReactElement {
  const { t } = useLocale();
  const [locked, setLocked] = React.useState(false);
  const [checked, setChecked] = React.useState(false);
  const promptingRef = React.useRef(false);

  const tryUnlock = React.useCallback(async () => {
    if (promptingRef.current) return;
    promptingRef.current = true;
    const ok = await authenticate(t('settings.unlockPrompt'));
    promptingRef.current = false;
    if (ok) setLocked(false);
  }, [t]);

  // Cold start: lock if the preference is on.
  React.useEffect(() => {
    void (async () => {
      const enabled = await isBiometricLockEnabled();
      setLocked(enabled);
      setChecked(true);
      if (enabled) void tryUnlock();
    })();
  }, [tryUnlock]);

  // Re-lock whenever the app returns to the foreground.
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        void (async () => {
          if (await isBiometricLockEnabled()) {
            setLocked(true);
            void tryUnlock();
          }
        })();
      }
    });
    return () => sub.remove();
  }, [tryUnlock]);

  return (
    <View style={styles.root}>
      {children}
      {checked && locked ? (
        <View style={styles.overlay}>
          <View style={[styles.lockIcon, { backgroundColor: `${colors.primary}22` }]}>
            <Ionicons name="lock-closed" size={34} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t('settings.unlockPrompt')}</Text>
          <View style={styles.action}>
            <Button label={t('settings.unlockCta')} leftIcon="finger-print" fullWidth onPress={() => void tryUnlock()} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  lockIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h2, fontSize: 20, color: colors.text, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.md, borderRadius: radius.md },
});
