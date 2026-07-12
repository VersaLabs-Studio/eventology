// ============================================================================
// Login screen
// ============================================================================
// Accepts `?redirect=<in-app path>` so a gated action returns the user where
// they started. The param is untrusted (deep links can set it) — see
// lib/redirect.ts.
//
// On success we `replace`, never `push`: the auth screen must not stay on the
// back stack, or hardware-back from Discover lands the signed-in user on a
// login form.
// ============================================================================

import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { usePalette } from '@/lib/palette';
import { safeRedirect } from '@/lib/redirect';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function LoginScreen(): React.ReactElement {
  const p = usePalette();
  const { signIn } = useAuth();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reached via a deep link there may be nothing to go back to.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.ok) {
      router.replace(safeRedirect(redirect));
    } else {
      setError(result.error);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Pressable
              onPress={goBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[styles.backButton, { backgroundColor: p.surface, borderColor: p.border }]}
            >
              <Ionicons name="chevron-back" size={20} color={p.text} />
            </Pressable>

            <View style={styles.hero}>
              <Logo size="lg" markOnly />
              <Text style={[styles.title, { color: p.text }]}>Welcome back</Text>
              <Text style={[styles.subtitle, { color: p.textMuted }]}>
                Sign in to register for events and keep your tickets in one place.
              </Text>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: p.destructiveMuted }]}>
                <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <Input
                label="Email"
                leftIcon="mail-outline"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
              <Input
                label="Password"
                leftIcon="lock-closed-outline"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                password
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={() => void onSubmit()}
              />
            </View>

            <Button label="Sign in" leftIcon="log-in-outline" loading={loading} onPress={() => void onSubmit()} fullWidth />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: p.textMuted }]}>Don't have an account?</Text>
              <Pressable
                onPress={() =>
                  router.replace({ pathname: '/auth/signup', params: redirect ? { redirect } : {} })
                }
                hitSlop={8}
                accessibilityRole="link"
              >
                <Text style={[styles.link, { color: colors.primary }]}> Sign up</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.display, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { ...typography.body, textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  form: { gap: spacing.md },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { ...typography.caption, fontSize: 13, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  footerText: { ...typography.caption, fontSize: 13 },
  link: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },
});
