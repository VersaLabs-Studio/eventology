// ============================================================================
// Profile screen
// ============================================================================
// Signed in  → identity card over a brand wash, then settings rows.
// Signed out → a single sign-in prompt; the settings that don't need a session
//              (language) stay available.
//
// The organizer link is shown on a role claim, but the organizer route
// re-validates ownership server-side — this is an affordance, not a gate.
// ============================================================================

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Gradient } from '@/components/ui/Gradient';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import {
  authenticate,
  isBiometricAvailable,
  isBiometricLockEnabled,
  setBiometricLockEnabled,
} from '@/lib/biometric';
import { useLocale, LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function ProfileScreen(): React.ReactElement {
  const p = usePalette();
  const { user, signOut, loading } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();

  const [bioAvailable, setBioAvailable] = React.useState(false);
  const [bioEnabled, setBioEnabled] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      setBioAvailable(await isBiometricAvailable());
      setBioEnabled(await isBiometricLockEnabled());
    })();
  }, []);

  const toggleBiometric = async (next: boolean) => {
    if (next) {
      // Prove it works before turning the lock on, so the user can't lock
      // themselves out with a sensor that won't authenticate.
      const ok = await authenticate(t('settings.unlockPrompt'));
      if (!ok) return;
    }
    await setBiometricLockEnabled(next);
    setBioEnabled(next);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const name = (user as { name?: string } | null)?.name ?? 'Eventology user';
  const email = (user as { email?: string } | null)?.email ?? '';
  const role = (user as { role?: string } | null)?.role;
  const isOrganizer = Boolean(role) && role !== 'attendee';

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title="Profile" />

          {/* ── Identity ── */}
          {loading ? (
            <View style={[styles.identityCard, { backgroundColor: p.surfaceMuted }]} />
          ) : user ? (
            <Gradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.identityCard, shadows.md]}
            >
              <View style={styles.identityRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(name || email || '?').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.flexMin}>
                  <Text style={styles.identityName} numberOfLines={1}>
                    {name}
                  </Text>
                  {email ? (
                    <Text style={styles.identityEmail} numberOfLines={1}>
                      {email}
                    </Text>
                  ) : null}
                </View>
              </View>
              {role ? (
                <Badge
                  label={role}
                  variant={role === 'admin' ? 'destructive' : 'secondary'}
                  style={styles.roleBadge}
                />
              ) : null}
            </Gradient>
          ) : (
            <View style={[styles.signedOut, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}>
              <View style={[styles.signedOutIcon, { backgroundColor: `${colors.primary}1A` }]}>
                <Ionicons name="person-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.signedOutTitle, { color: p.text }]}>You're not signed in</Text>
              <Text style={[styles.signedOutBody, { color: p.textMuted }]}>
                Sign in to register for events and keep your tickets in one place.
              </Text>
              <View style={styles.signedOutActions}>
                <Button
                  label="Sign in"
                  leftIcon="log-in-outline"
                  fullWidth
                  onPress={() => router.push('/auth/login')}
                />
                <Button
                  label="Create account"
                  variant="outline"
                  leftIcon="person-add-outline"
                  fullWidth
                  onPress={() => router.push('/auth/signup')}
                />
              </View>
            </View>
          )}

          {/* ── Language ── */}
          <Section title="Language">
            <View style={styles.langRow}>
              {LOCALES.map((l) => {
                const active = l === locale;
                return (
                  <Pressable
                    key={l}
                    onPress={() => void setLocale(l as Locale)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.langChip,
                      {
                        backgroundColor: active ? colors.primary : p.surface,
                        borderColor: active ? colors.primary : p.border,
                      },
                    ]}
                  >
                    <Text style={[styles.langLabel, { color: active ? colors.white : p.text }]}>
                      {LOCALE_NAMES[l as Locale]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* ── Security ── */}
          {bioAvailable ? (
            <Section title={t('settings.security')}>
              <View style={[styles.rowGroup, { backgroundColor: p.surface, borderColor: p.border }]}>
                <View style={styles.switchRow}>
                  <Ionicons name="finger-print" size={19} color={p.textMuted} />
                  <View style={styles.flexMin}>
                    <Text style={[styles.switchLabel, { color: p.text }]}>{t('settings.biometricLock')}</Text>
                    <Text style={[styles.switchHint, { color: p.textMuted }]}>{t('settings.biometricHint')}</Text>
                  </View>
                  <Switch
                    value={bioEnabled}
                    onValueChange={(v) => void toggleBiometric(v)}
                    trackColor={{ true: colors.primary }}
                  />
                </View>
              </View>
            </Section>
          ) : null}

          {/* ── Navigation ── */}
          {user ? (
            <Section title="Account">
              <View style={[styles.rowGroup, { backgroundColor: p.surface, borderColor: p.border }]}>
                <SettingsRow
                  icon="notifications-outline"
                  label="Notifications"
                  onPress={() => router.push('/notifications')}
                />
                <SettingsRow
                  icon="calendar-outline"
                  label={t('myEvents.title')}
                  onPress={() => router.push('/my-events')}
                />
                <SettingsRow
                  icon="ticket-outline"
                  label="My tickets"
                  onPress={() => router.push('/tickets')}
                />
                {isOrganizer ? (
                  <SettingsRow
                    icon="briefcase-outline"
                    label={t('organizer.manageEvents')}
                    onPress={() => router.push('/organizer')}
                    last
                  />
                ) : null}
              </View>
            </Section>
          ) : null}

          {user ? (
            <View style={styles.signOut}>
              <Button
                label="Sign out"
                variant="destructive"
                leftIcon="log-out-outline"
                onPress={() => void handleSignOut()}
                fullWidth
              />
            </View>
          ) : null}

          <Text style={[styles.footer, { color: p.textSubtle }]}>
            {t('common.appName')} · v0.1.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  const p = usePalette();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: p.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  last?: boolean;
}): React.ReactElement {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.settingsRow,
        !last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.border } : null,
        pressed ? { backgroundColor: p.surfaceMuted } : null,
      ]}
    >
      <Ionicons name={icon} size={19} color={p.textMuted} />
      <Text style={[styles.settingsLabel, { color: p.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={17} color={p.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  flexMin: { flex: 1, minWidth: 0 },
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },

  identityCard: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 116,
    gap: spacing.md,
    overflow: 'hidden',
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.white },
  identityName: { ...typography.h2, fontSize: 19, color: colors.white },
  identityEmail: { ...typography.caption, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start' },

  signedOut: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  signedOutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  signedOutTitle: { ...typography.h3, fontSize: 16 },
  signedOutBody: { ...typography.caption, fontSize: 12, textAlign: 'center', maxWidth: 260, lineHeight: 17 },
  signedOutActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },

  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.small,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.md,
  },

  langRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  langChip: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  langLabel: { ...typography.bodyBold, fontSize: 14, fontWeight: '700' },

  rowGroup: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  settingsLabel: { ...typography.body, fontSize: 15, fontWeight: '500', flex: 1 },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  switchLabel: { ...typography.body, fontSize: 15, fontWeight: '500' },
  switchHint: { ...typography.caption, fontSize: 12, marginTop: 1 },

  signOut: { paddingHorizontal: spacing.md, marginTop: spacing.xs },
  footer: { ...typography.small, fontSize: 11, textAlign: 'center', marginTop: spacing.md },
});
