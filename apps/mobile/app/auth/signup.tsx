// ============================================================================
// Signup screen
// ============================================================================
// Same redirect contract as the login screen — see app/auth/login.tsx and
// lib/redirect.ts. better-auth signs the user in as part of signUp.email, so
// on success we go straight to the redirect target.
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

const MIN_PASSWORD_LENGTH = 8;

export default function SignupScreen(): React.ReactElement {
  const p = usePalette();
  const { signUp } = useAuth();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onSubmit = async () => {
    setError(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError('All fields are required');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setLoading(true);
    const result = await signUp({ fullName: fullName.trim(), email: email.trim(), password });
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
              <Text style={[styles.title, { color: p.text }]}>Create your account</Text>
              <Text style={[styles.subtitle, { color: p.textMuted }]}>
                Join Eventology to discover and register for events across Addis Ababa.
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
                label="Full name"
                leftIcon="person-outline"
                placeholder="Abebe Kebede"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
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
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={password}
                onChangeText={setPassword}
                password
                autoCapitalize="none"
                autoComplete="password-new"
                returnKeyType="go"
                onSubmitEditing={() => void onSubmit()}
              />
            </View>

            <Text style={[styles.terms, { color: p.textSubtle }]}>
              By signing up, you agree to the Terms of Service and Privacy Policy.
            </Text>

            <Button
              label="Create account"
              leftIcon="person-add-outline"
              loading={loading}
              onPress={() => void onSubmit()}
              fullWidth
            />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: p.textMuted }]}>Already have an account?</Text>
              <Pressable
                onPress={() =>
                  router.replace({ pathname: '/auth/login', params: redirect ? { redirect } : {} })
                }
                hitSlop={8}
                accessibilityRole="link"
              >
                <Text style={[styles.link, { color: colors.primary }]}> Sign in</Text>
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
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.display, fontSize: 26, textAlign: 'center', marginTop: spacing.sm },
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
  terms: { ...typography.small, fontSize: 11, lineHeight: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  footerText: { ...typography.caption, fontSize: 13 },
  link: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },
});
