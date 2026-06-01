/**
 * Eventology Mobile — Card
 * Generic elevated surface. Three variants cover the common cases:
 *   - default  : border + subtle shadow  (list rows, content blocks)
 *   - elevated : no border, stronger shadow (floating actions, hero)
 *   - flat     : border only, no shadow  (dense lists, nested groups)
 *
 * When an `onPress` is provided the card becomes a Pressable with a
 * gentle scale (0.98) on press. Otherwise it renders a static View.
 */
import React from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, radius, shadows, spacing } from "../../lib/theme";

export type CardVariant = "default" | "elevated" | "flat";

interface CardProps extends Omit<PressableProps, "style" | "children"> {
  children?: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof PADDING_TOKENS | "none";
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const PADDING_TOKENS = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  xxl: spacing.xxl,
} as const;

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.card,
    borderWidth: 0,
    ...shadows.md,
  },
  flat: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  onPress,
  style,
  ...rest
}: CardProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (
    event: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]
  ) => {
    scale.value = withTiming(0.98, {
      duration: 80,
      easing: Easing.out(Easing.quad),
    });
    rest.onPressIn?.(event);
  };

  const handlePressOut = (
    event: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]
  ) => {
    scale.value = withTiming(1, {
      duration: 140,
      easing: Easing.out(Easing.quad),
    });
    rest.onPressOut?.(event);
  };

  const paddingStyle: ViewStyle | null =
    padding === "none" ? null : { padding: PADDING_TOKENS[padding] };

  const surfaceStyle: StyleProp<ViewStyle> = [
    styles.base,
    VARIANT_STYLES[variant],
    paddingStyle,
  ];

  if (onPress !== undefined) {
    return (
      <Animated.View style={[animatedStyle, style]}>
        <Pressable
          {...rest}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          style={({ pressed }) => [
            surfaceStyle,
            pressed ? styles.pressed : null,
          ]}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={[surfaceStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.96,
  },
});
