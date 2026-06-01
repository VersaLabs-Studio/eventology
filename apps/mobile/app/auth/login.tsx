import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadows, spacing, typography } from "../../lib/theme";

/** Spinner color derives from the button label, so we keep it co-located. */
const BUTTON_LOADER_COLOR = colors.white;

/** Resolved type for `setTimeout` on the current runtime. */
type TimeoutHandle = ReturnType<typeof setTimeout>;

/** Social providers surfaced as the SSO placeholders. */
type SocialProvider = "Google" | "Apple" | "Facebook";

interface SocialButton {
  provider: SocialProvider;
  icon: keyof typeof Ionicons.glyphMap;
}

const SOCIAL_BUTTONS: readonly SocialButton[] = [
  { provider: "Google", icon: "logo-google" },
  { provider: "Apple", icon: "logo-apple" },
  { provider: "Facebook", icon: "logo-facebook" },
] as const;

/** Fake round-trip latency for the mock submit. */
const MOCK_AUTH_DELAY_MS = 600;

export default function LoginScreen(): React.ReactElement {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hold the in-flight timeout so we can clear it on unmount.
  const timeoutRef = useRef<TimeoutHandle | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSignIn = (): void => {
    if (loading) return;
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Welcome back!",
        "You are now signed in to Eventology.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ],
        { cancelable: false }
      );
    }, MOCK_AUTH_DELAY_MS);
  };

  const handleForgotPassword = (): void => {
    Alert.alert(
      "Forgot password?",
      "Password recovery is coming soon. Please check back later."
    );
  };

  const handleSocial = (provider: SocialProvider): void => {
    Alert.alert(
      "Coming soon",
      `${provider} sign-in will be available in a future release.`
    );
  };

  const goToSignup = (): void => {
    router.push("/auth/signup");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand mark ──────────────────────────────────────────── */}
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Ionicons name="calendar" size={26} color={colors.white} />
            </View>
            <Text style={styles.brandText}>Eventology</Text>
            <Text style={styles.brandTagline}>
              Discover events happening around you
            </Text>
          </View>

          {/* ── Form ────────────────────────────────────────────────── */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.muted}
                  style={styles.inputLeading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <Pressable onPress={handleForgotPassword} hitSlop={8}>
                  <Text style={styles.linkText}>Forgot password?</Text>
                </Pressable>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.muted}
                  style={styles.inputLeading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.mutedLight}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={8}
                  style={styles.eyeToggle}
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              onPress={handleSignIn}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !loading && styles.primaryButtonPressed,
                loading && styles.primaryButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={BUTTON_LOADER_COLOR} />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>
          </View>

          {/* ── Divider ─────────────────────────────────────────────── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Social placeholders ─────────────────────────────────── */}
          <View style={styles.socialRow}>
            {SOCIAL_BUTTONS.map(({ provider, icon }) => (
              <Pressable
                key={provider}
                accessibilityRole="button"
                accessibilityLabel={`Continue with ${provider}`}
                onPress={() => handleSocial(provider)}
                disabled={loading}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialButtonPressed,
                ]}
              >
                <Ionicons
                  name={icon}
                  size={22}
                  color={colors.foreground}
                />
              </Pressable>
            ))}
          </View>

          {/* ── Bottom link ─────────────────────────────────────────── */}
          <View style={styles.bottomLinkRow}>
            <Text style={styles.bottomLinkMuted}>
              Don&apos;t have an account?{" "}
            </Text>
            <Pressable onPress={goToSignup} hitSlop={6}>
              <Text style={styles.bottomLinkAction}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  // ── Brand ────────────────────────────────────────────────────────
  brand: {
    alignItems: "center",
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  brandMark: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  brandText: {
    ...typography.display,
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  brandTagline: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },

  // ── Form ─────────────────────────────────────────────────────────
  form: { marginBottom: spacing.lg },
  fieldGroup: { marginBottom: spacing.md },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  linkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputLeading: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.foreground,
    paddingVertical: 0,
  },
  eyeToggle: {
    paddingLeft: spacing.sm,
  },

  // ── Primary button ───────────────────────────────────────────────
  primaryButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    ...shadows.sm,
  },
  primaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.white,
    fontSize: 15,
  },

  // ── Divider ──────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.muted,
    marginHorizontal: spacing.md,
  },

  // ── Social ───────────────────────────────────────────────────────
  socialRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  socialButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonPressed: {
    opacity: 0.7,
  },

  // ── Bottom link ──────────────────────────────────────────────────
  bottomLinkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomLinkMuted: {
    ...typography.body,
    color: colors.muted,
  },
  bottomLinkAction: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
