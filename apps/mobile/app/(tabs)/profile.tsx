// ============================================================================
// Profile screen
// ============================================================================
// Shows the authed user's name/email + a sign-out button + an EN/AM
// language toggle that writes to SecureStore via the i18n helper.
// ============================================================================

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale, LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function ProfileScreen(): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const border = isDark ? colors.borderDark : colors.border;
  const { user, signOut, loading } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(tabs)/index');
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: text }]}>Profile</Text>

        {loading ? (
          <Card>
            <Text style={{ color: textMuted }}>Loading…</Text>
          </Card>
        ) : user ? (
          <Card>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryMuted ?? '#D1FAE5' }]}>
                <Text style={[styles.avatarText, { color: colors.primaryDark }]}>
                  {((user as { name?: string }).name ?? (user as { email?: string }).email ?? '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.name, { color: text }]} numberOfLines={1}>
                  {(user as { name?: string }).name ?? 'Eventology user'}
                </Text>
                <Text style={[styles.email, { color: textMuted }]} numberOfLines={1}>
                  {(user as { email?: string }).email}
                </Text>
                {((user as { role?: string }).role) && (
                  <Badge
                    label={(user as { role?: string }).role ?? 'attendee'}
                    variant={(user as { role?: string }).role === 'admin' ? 'destructive' : 'default'}
                    style={{ marginTop: spacing.xs }}
                  />
                )}
              </View>
            </View>
          </Card>
        ) : (
          <Card>
            <Text style={[styles.email, { color: textMuted }]}>You're not signed in.</Text>
            <View style={{ marginTop: spacing.md }}>
              <Link href="/auth/login" asChild>
                <Button label="Sign in" leftIcon="log-in-outline" fullWidth />
              </Link>
            </View>
            <View style={{ marginTop: spacing.sm }}>
              <Link href="/auth/signup" asChild>
                <Button label="Create account" variant="secondary" leftIcon="person-add-outline" fullWidth />
              </Link>
            </View>
          </Card>
        )}

        {/* Language toggle */}
        <Text style={[styles.sectionTitle, { color: text }]}>Language</Text>
        <View style={styles.langRow}>
          {LOCALES.map((l) => {
            const isActive = l === locale;
            return (
              <Pressable
                key={l}
                onPress={() => void setLocale(l as Locale)}
                style={[
                  styles.langChip,
                  {
                    backgroundColor: isActive ? colors.primary : isDark ? colors.surfaceDark : colors.surface,
                    borderColor: isActive ? colors.primary : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.langLabel,
                    { color: isActive ? '#FFFFFF' : text },
                  ]}
                >
                  {LOCALE_NAMES[l as Locale]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Link href="/notifications" asChild>
          <Button label="Notifications" leftIcon="notifications-outline" variant="outline" fullWidth style={{ marginTop: spacing.md }} />
        </Link>

        {/* R3 / B1: Organizer area link — only when the user is an
            organizer. The check uses the role claim; the actual gate
            lives on the organizer route (which re-validates ownership). */}
        {user && (user as { role?: string }).role && (user as { role?: string }).role !== 'attendee' && (
          <Link href="/organizer" asChild>
            <Button
              label={t('organizer.manageEvents')}
              leftIcon="briefcase-outline"
              variant="outline"
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          </Link>
        )}

        {user && (
          <View style={{ marginTop: spacing.lg }}>
            <Button label="Sign out" variant="destructive" leftIcon="log-out-outline" onPress={handleSignOut} fullWidth />
          </View>
        )}

        <Text style={[styles.footer, { color: textMuted }]}>
          {t('common.appName')} · v0.1.0
        </Text>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.h1 },
  sectionTitle: { ...typography.h2, marginTop: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700' },
  name: { ...typography.h3, fontSize: 16 },
  email: { ...typography.caption, fontSize: 12 },
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langChip: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  langLabel: { ...typography.bodyBold, fontSize: 14 },
  footer: { ...typography.small, fontSize: 11, textAlign: 'center', marginTop: spacing.xl },
});
