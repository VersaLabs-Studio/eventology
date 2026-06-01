/**
 * Eventology Mobile — SectionHeader
 * Title + optional subtitle + optional trailing action.
 * Used at the top of every horizontal/vertical section on the home tab.
 *
 * The action area is only rendered when `onActionPress` is provided.
 * Touch target is always ≥ 44pt so tapping "See all" never misses.
 */
import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, typography } from "../../lib/theme";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel = "See all",
  onActionPress,
  style,
}: SectionHeaderProps): React.ReactElement {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onActionPress ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed ? styles.actionPressed : null]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: colors.foreground,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    minHeight: 44,
  },
  actionPressed: {
    opacity: 0.6,
  },
  actionText: {
    ...typography.bodyBold,
    color: colors.primary,
    marginRight: 2,
  },
});
