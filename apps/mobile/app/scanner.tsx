/**
 * Eventology Mobile — Ticket Scanner
 * QR-style viewfinder for validating tickets. Camera permission is
 * requested via expo-camera; if granted, the live preview is shown
 * behind a centered bracket overlay. If not granted (or running
 * on web/simulator), a styled fallback view is shown.
 *
 * Manual ticket-code entry is always available as a fallback.
 * The "Validate" button accepts any 6+ character string and shows
 * a success toast before navigating back.
 *
 * Mock-only: there is no real QR scanning in this build.
 */

import React, { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";

import { colors, radius, spacing, typography } from "../lib/theme";
import { useToast } from "../components/Toast";

const MIN_CODE_LENGTH = 6;

export default function ScannerScreen(): React.ReactElement {
  const toast = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleValidate = useCallback((): void => {
    if (submitting) return;
    const trimmed = code.trim();
    if (trimmed.length < MIN_CODE_LENGTH) {
      toast.show(`Ticket code must be at least ${MIN_CODE_LENGTH} characters.`, {
        type: "error",
      });
      return;
    }
    setSubmitting(true);
    // Mock-only: no real validation. Surface success and bounce back.
    setTimeout(() => {
      setSubmitting(false);
      toast.show("Ticket validated!", { type: "success" });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/tickets");
      }
    }, 400);
  }, [code, submitting, toast]);

  // Permission states: undetermined (null) | granted | denied/undetermined.
  const hasPermission = permission?.granted ?? false;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={12}
          accessibilityLabel="Close scanner"
        >
          <Ionicons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan a ticket</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Camera or fallback preview */}
      <View style={styles.previewArea}>
        {hasPermission ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
        ) : (
          <View style={styles.fallbackPreview}>
            <Ionicons
              name="scan-circle-outline"
              size={72}
              color={colors.mutedLight}
            />
            <Text style={styles.fallbackText}>
              {permission === null
                ? "Tap below to enable camera scanning"
                : "Camera permission denied"}
            </Text>
            <Pressable
              onPress={() => {
                void requestPermission();
              }}
              style={styles.permissionButton}
            >
              <Ionicons name="camera-outline" size={18} color={colors.white} />
              <Text style={styles.permissionButtonText}>
                {permission === null ? "Enable Camera" : "Request Again"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Always-on viewfinder overlay. Sits above both the live
            camera and the fallback. pointerEvents: "none" so taps
            still reach the camera / fallback controls underneath. */}
        <View pointerEvents="none" style={styles.viewfinderOverlay}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
      </View>

      {/* Manual entry */}
      <View style={styles.manualArea}>
        <Text style={styles.manualLabel}>Or enter ticket code</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="e.g. TKT-001-A1B2C3"
          placeholderTextColor={colors.mutedLight}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Pressable
          onPress={handleValidate}
          disabled={submitting}
          style={[styles.validateButton, submitting && styles.validateButtonDisabled]}
          accessibilityLabel="Validate ticket"
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.white} />
          <Text style={styles.validateButtonText}>Validate</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const VIEWFINDER_SIZE = 240;
const CORNER_LENGTH = 28;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

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
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  previewArea: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    overflow: "hidden",
  },
  fallbackPreview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  fallbackText: {
    ...typography.body,
    color: colors.white,
    textAlign: "center",
    opacity: 0.8,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    minHeight: 44,
  },
  permissionButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },

  viewfinderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
  },
  corner: {
    position: "absolute",
    width: CORNER_LENGTH,
    height: CORNER_LENGTH,
    borderColor: colors.white,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },

  manualArea: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  manualLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: "600",
    marginBottom: spacing.xs,
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
    marginBottom: spacing.sm,
  },
  validateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  validateButtonDisabled: {
    backgroundColor: colors.mutedLight,
  },
  validateButtonText: {
    ...typography.h3,
    color: colors.white,
  },
});
