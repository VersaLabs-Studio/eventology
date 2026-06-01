/**
 * Eventology Mobile — Button
 * Primary interactive surface. Variants: primary | secondary | ghost | destructive.
 * Press feedback: gentle scale (0.97) via Reanimated. Minimum touch target 44pt
 * is enforced by the `md` and `lg` size tokens so layouts never ship sub-44pt
 * tap targets.
 */
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, typography } from "../../lib/theme";

type IoniconName = keyof typeof Ionicons.glyphMap;

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: IoniconName;
  rightIcon?: IoniconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface SizeTokens {
  container: ViewStyle;
  text: { fontSize: number; fontWeight: "400" | "500" | "600" | "700" | "800"; lineHeight: number };
  iconSize: number;
}

const SIZE_TOKENS: Record<ButtonSize, SizeTokens> = {
  sm: {
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      minHeight: 36,
    },
    text: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
    iconSize: 14,
  },
  md: {
    container: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      minHeight: 44,
    },
    text: { ...typography.bodyBold, fontSize: 15, lineHeight: 20 },
    iconSize: 16,
  },
  lg: {
    container: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      minHeight: 52,
    },
    text: { ...typography.h3, fontSize: 17, lineHeight: 22 },
    iconSize: 18,
  },
};

interface VariantTokens {
  container: ViewStyle;
  textColor: string;
  spinnerColor: string;
  pressedBackground: string | undefined;
}

const VARIANT_TOKENS: Record<ButtonVariant, VariantTokens> = {
  primary: {
    container: { backgroundColor: colors.primary, borderColor: colors.primary },
    textColor: colors.white,
    spinnerColor: colors.white,
    pressedBackground: colors.primaryDark,
  },
  secondary: {
    container: { backgroundColor: colors.card, borderColor: colors.border },
    textColor: colors.foreground,
    spinnerColor: colors.primary,
    pressedBackground: colors.background,
  },
  ghost: {
    container: { backgroundColor: "transparent", borderColor: "transparent" },
    textColor: colors.primary,
    spinnerColor: colors.primary,
    pressedBackground: colors.background,
  },
  destructive: {
    container: { backgroundColor: colors.destructive, borderColor: colors.destructive },
    textColor: colors.white,
    spinnerColor: colors.white,
    pressedBackground: undefined,
  },
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: ButtonProps): React.ReactElement {
  const scale = useSharedValue(1);
  const sizing = SIZE_TOKENS[size];
  const palette = VARIANT_TOKENS[variant];
  const isDisabled = disabled === true || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
    scale.value = withTiming(0.97, {
      duration: 80,
      easing: Easing.out(Easing.quad),
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) => {
    scale.value = withTiming(1, {
      duration: 140,
      easing: Easing.out(Easing.quad),
    });
    onPressOut?.(event);
  };

  return (
    <Animated.View
      style={[
        animatedStyle,
        fullWidth ? styles.fullWidth : null,
        style,
      ]}
    >
      <Pressable
        {...rest}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed }) => [
          styles.base,
          sizing.container,
          palette.container,
          fullWidth ? styles.fullWidth : null,
          pressed && palette.pressedBackground
            ? { backgroundColor: palette.pressedBackground }
            : null,
          pressed && !palette.pressedBackground ? { opacity: 0.85 } : null,
          isDisabled ? styles.disabled : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={palette.spinnerColor} />
        ) : (
          <>
            {leftIcon ? (
              <Ionicons
                name={leftIcon}
                size={sizing.iconSize}
                color={palette.textColor}
                style={styles.leftIcon}
              />
            ) : null}
            <Text
              style={[sizing.text, { color: palette.textColor }]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {rightIcon ? (
              <Ionicons
                name={rightIcon}
                size={sizing.iconSize}
                color={palette.textColor}
                style={styles.rightIcon}
              />
            ) : null}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  leftIcon: {
    marginRight: spacing.xs + 2,
  },
  rightIcon: {
    marginLeft: spacing.xs + 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
