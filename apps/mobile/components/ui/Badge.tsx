/**
 * Eventology Mobile — Badge
 * Compact label with optional leading icon. Variants map to the
 * semantic color system — use these instead of inline color math.
 *
 * Background colors are derived from the primary token with low
 * alpha (12% / 20%) using the hex-with-alpha pattern already
 * established in `EventCard`.
 */
import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, typography } from "../../lib/theme";

type IoniconName = keyof typeof Ionicons.glyphMap;

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: IoniconName;
  style?: StyleProp<ViewStyle>;
}

interface VariantTokens {
  container: ViewStyle;
  textColor: string;
  iconColor: string;
}

const VARIANT_TOKENS: Record<BadgeVariant, VariantTokens> = {
  neutral: {
    container: { backgroundColor: colors.background, borderColor: colors.border },
    textColor: colors.muted,
    iconColor: colors.muted,
  },
  primary: {
    container: {
      backgroundColor: colors.primary + "1F", // 12% alpha
      borderColor: colors.primary + "33",     // 20% alpha
    },
    textColor: colors.primary,
    iconColor: colors.primary,
  },
  success: {
    container: {
      backgroundColor: colors.success + "1F",
      borderColor: colors.success + "33",
    },
    textColor: colors.success,
    iconColor: colors.success,
  },
  warning: {
    container: {
      backgroundColor: colors.warning + "1F",
      borderColor: colors.warning + "33",
    },
    textColor: colors.warning,
    iconColor: colors.warning,
  },
  destructive: {
    container: {
      backgroundColor: colors.destructive + "1F",
      borderColor: colors.destructive + "33",
    },
    textColor: colors.destructive,
    iconColor: colors.destructive,
  },
};

export function Badge({
  label,
  variant = "neutral",
  icon,
  style,
}: BadgeProps): React.ReactElement {
  const palette = VARIANT_TOKENS[variant];
  return (
    <View style={[styles.badge, palette.container, style]}>
      {icon ? (
        <Ionicons name={icon} size={11} color={palette.iconColor} style={styles.icon} />
      ) : null}
      <Text style={[styles.text, { color: palette.textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...typography.small,
    fontWeight: "600",
  },
});
