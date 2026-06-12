// ============================================================================
// Signup screen
// ============================================================================
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacing, typography } from '@/lib/theme';

export default function SignupScreen(): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const border = isDark ? colors.borderDark : colors.border;
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError('All fields are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    const result = await signUp({ fullName: fullName.trim(), email: email.trim(), password });
    setLoading(false);
    if (result.ok) {
      router.replace('/(tabs)/index');
    } else {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Ionicons name="person-add" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: textMuted }]}>
            Join Eventology to discover and register for events
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.destructiveMuted }]}>
            <Ionicons name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.label, { color: textMuted }]}>Full name</Text>
          <TextInput
            style={[styles.input, { color: text, backgroundColor: isDark ? colors.surfaceDark : colors.surface, borderColor: border }]}
            placeholder="Abebe Kebede"
            placeholderTextColor={textMuted}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: textMuted }]}>Email</Text>
          <TextInput
            style={[styles.input, { color: text, backgroundColor: isDark ? colors.surfaceDark : colors.surface, borderColor: border }]}
            placeholder="you@example.com"
            placeholderTextColor={textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: textMuted }]}>Password</Text>
          <TextInput
            style={[styles.input, { color: text, backgroundColor: isDark ? colors.surfaceDark : colors.surface, borderColor: border }]}
            placeholder="At least 8 characters"
            placeholderTextColor={textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
          />
        </View>

        <Text style={[styles.terms, { color: textMuted }]}>
          By signing up, you agree to the Terms of Service and Privacy Policy.
        </Text>

        <Button label="Create account" leftIcon="person-add-outline" loading={loading} onPress={onSubmit} fullWidth />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: textMuted }]}>Already have an account?</Text>
          <Link href="/auth/login" asChild>
            <Text style={[styles.link, { color: colors.primary }]}> Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  title: { ...typography.h1, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center' },
  field: { gap: spacing.xs },
  label: { ...typography.caption, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    ...typography.body,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
  },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  errorText: { ...typography.caption, fontSize: 13, flex: 1 },
  terms: { ...typography.small, fontSize: 11, lineHeight: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  footerText: { ...typography.caption, fontSize: 13 },
  link: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },
});
