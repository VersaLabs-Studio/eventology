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

type TimeoutHandle = ReturnType<typeof setTimeout>;

/** Fake round-trip latency for the mock submit. */
const MOCK_AUTH_DELAY_MS = 600;

export default function SignupScreen(): React.ReactElement {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const timeoutRef = useRef<TimeoutHandle | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Only surface a mismatch warning once the user has typed in the
   * confirm field — avoids the field screaming red on first focus.
   */
  const passwordMismatch: boolean =
    confirmPassword.length > 0 && password !== confirmPassword;

  /**
   * Submit is disabled if the mock round-trip is in flight, the
   * terms aren't accepted, or the password pair doesn't match.
   */
  const canSubmit: boolean =
    !loading &&
    accepted &&
    password === confirmPassword &&
    password.length > 0;

  const handleCreate = (): void => {
    if (!canSubmit) return;
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Welcome to Eventology!",
        "Your account has been created.",
        [
          {
            text: "Get started",
            onPress: () => router.replace("/(tabs)"),
          },
        ],
        { cancelable: false }
      );
    }, MOCK_AUTH_DELAY_MS);
  };

  const handleTermsToggle = (): void => {
    setAccepted((prev) => !prev);
  };

  const goToLogin = (): void => {
    router.push("/auth/login");
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
            <Text style={styles.brandTagline}>Create your account</Text>
          </View>

          {/* ── Form ────────────────────────────────────────────────── */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full name</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.muted}
                  style={styles.inputLeading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Abebe Kebede"
                  placeholderTextColor={colors.mutedLight}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>
            </View>

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
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.muted}
                  style={styles.inputLeading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.mutedLight}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordMismatch && styles.inputContainerError,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={colors.muted}
                  style={styles.inputLeading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.mutedLight}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowConfirm((prev) => !prev)}
                  hitSlop={8}
                  style={styles.eyeToggle}
                  accessibilityLabel={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
              {passwordMismatch && (
                <Text style={styles.errorText}>
                  Passwords do not match
                </Text>
              )}
            </View>

            <Pressable
              onPress={handleTermsToggle}
              hitSlop={6}
              style={styles.termsRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: accepted }}
            >
              <View
                style={[
                  styles.checkbox,
                  accepted && styles.checkboxChecked,
                ]}
              >
                {accepted && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={colors.white}
                  />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: !canSubmit }}
              onPress={handleCreate}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && canSubmit && styles.primaryButtonPressed,
                !canSubmit && styles.primaryButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </Pressable>
          </View>

          {/* ── Bottom link ─────────────────────────────────────────── */}
          <View style={styles.bottomLinkRow}>
            <Text style={styles.bottomLinkMuted}>
              Already have an account?{" "}
            </Text>
            <Pressable onPress={goToLogin} hitSlop={6}>
              <Text style={styles.bottomLinkAction}>Sign in</Text>
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
    marginTop: spacing.sm,
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
  form: { marginBottom: spacing.md },
  fieldGroup: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: "600",
    marginBottom: spacing.xs,
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
  inputContainerError: {
    borderColor: colors.destructive,
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
  errorText: {
    ...typography.small,
    color: colors.destructive,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },

  // ── Terms checkbox ───────────────────────────────────────────────
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "600",
  },

  // ── Primary button ───────────────────────────────────────────────
  primaryButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  primaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.white,
    fontSize: 15,
  },

  // ── Bottom link ──────────────────────────────────────────────────
  bottomLinkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
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
