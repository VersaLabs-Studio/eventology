/**
 * Eventology Mobile — Event Registration Screen
 * Three-section flow: tier selection, attendee details, order
 * summary. The "Confirm Registration" button shows a success toast
 * and navigates to the tickets tab.
 *
 * Mock-only: no backend. `setTimeout(800ms)` simulates network.
 */

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { colors, radius, shadows, spacing, typography } from "../../../lib/theme";
import { events } from "../../../lib/mock-data";
import { formatCurrencyETB } from "../../../lib/format";
import { useToast } from "../../../components/Toast";

export default function RegisterScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id: string }>();
  const toast = useToast();

  // Find the event by `id` param. Falls back to the first event so
  // the screen always has data to render during the demo.
  const event = useMemo(() => {
    const target = events.find((e) => e.id === params.id);
    return target ?? events[0];
  }, [params.id]);

  const tiers = event.ticketTiers;
  const [selectedTierId, setSelectedTierId] = useState<string>(tiers[0]?.id ?? "");
  const [quantity, setQuantity] = useState<number>(1);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === selectedTierId) ?? tiers[0],
    [tiers, selectedTierId]
  );

  const total = (selectedTier?.price ?? 0) * quantity;

  const canSubmit =
    !loading &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    selectedTier !== undefined;

  const handleConfirm = (): void => {
    if (!canSubmit) {
      toast.show("Please complete all attendee details.", { type: "error" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.show("Registration confirmed!", { type: "success" });
      router.replace("/(tabs)/tickets");
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header bar with back button */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Register</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Event context strip */}
          <View style={styles.eventStrip}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <Text style={styles.eventMeta} numberOfLines={1}>
              {event.location} · {event.time}
            </Text>
          </View>

          {/* Section 1: Tier selection */}
          <Text style={styles.sectionLabel}>Select a ticket tier</Text>
          <View style={styles.section}>
            {tiers.map((tier) => {
              const selected = tier.id === selectedTierId;
              return (
                <Pressable
                  key={tier.id}
                  onPress={() => setSelectedTierId(tier.id)}
                  style={[styles.tierRow, selected && styles.tierRowSelected]}
                >
                  <View style={styles.radioOuter}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.tierBody}>
                    <View style={styles.tierHeaderRow}>
                      <Text style={styles.tierName}>{tier.name}</Text>
                      <Text style={styles.tierPrice}>
                        {tier.price === 0 ? "Free" : formatCurrencyETB(tier.price)}
                      </Text>
                    </View>
                    {tier.description.length > 0 && (
                      <Text style={styles.tierDescription} numberOfLines={2}>
                        {tier.description}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Section 2: Attendee details */}
          <Text style={styles.sectionLabel}>Attendee details</Text>
          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Abebe Kebede"
              placeholderTextColor={colors.mutedLight}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={colors.mutedLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+251 9.. .. .. .."
              placeholderTextColor={colors.mutedLight}
              keyboardType="phone-pad"
            />
          </View>

          {/* Section 3: Order summary */}
          <Text style={styles.sectionLabel}>Order summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {selectedTier?.name ?? "—"}
              </Text>
              <Text style={styles.summaryValue}>
                {selectedTier?.price === 0
                  ? "Free"
                  : formatCurrencyETB(selectedTier?.price ?? 0)}
              </Text>
            </View>

            <View style={styles.qtyRow}>
              <Text style={styles.summaryLabel}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={styles.stepperButton}
                  hitSlop={8}
                  accessibilityLabel="Decrease quantity"
                >
                  <Ionicons name="remove" size={18} color={colors.foreground} />
                </Pressable>
                <Text style={styles.stepperValue}>{quantity}</Text>
                <Pressable
                  onPress={() => setQuantity((q) => Math.min(10, q + 1))}
                  style={styles.stepperButton}
                  hitSlop={8}
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={18} color={colors.foreground} />
                </Pressable>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrencyETB(total)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky bottom confirm */}
        <View style={styles.stickyBar}>
          <Pressable
            onPress={handleConfirm}
            disabled={!canSubmit}
            style={[styles.confirmButton, !canSubmit && styles.confirmButtonDisabled]}
            accessibilityLabel="Confirm registration"
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.confirmButtonText}>Confirm Registration</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  eventStrip: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  eventTitle: {
    ...typography.h3,
    color: colors.foreground,
    marginBottom: 2,
  },
  eventMeta: {
    ...typography.caption,
    color: colors.muted,
  },

  sectionLabel: {
    ...typography.bodyBold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── Tier rows ─────────────────────────────────────────────────────────────
  tierRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: spacing.xs,
  },
  tierRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  tierBody: { flex: 1 },
  tierHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  tierName: {
    ...typography.bodyBold,
    color: colors.foreground,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  tierPrice: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  tierDescription: {
    ...typography.caption,
    color: colors.muted,
  },

  // ── Form fields ───────────────────────────────────────────────────────────
  fieldLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.foreground,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── Order summary ─────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.foreground,
    flex: 1,
  },
  summaryValue: {
    ...typography.body,
    color: colors.muted,
  },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    ...typography.bodyBold,
    color: colors.foreground,
    minWidth: 24,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.foreground,
  },
  totalValue: {
    ...typography.h2,
    color: colors.primary,
  },

  // ── Sticky bottom bar ─────────────────────────────────────────────────────
  stickyBar: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    ...shadows.md,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.mutedLight,
  },
  confirmButtonText: {
    ...typography.h3,
    color: colors.white,
  },
});
