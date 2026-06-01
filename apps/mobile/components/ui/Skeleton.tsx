/**
 * Eventology Mobile — Skeleton
 * Reanimated shimmer placeholder for loading states. The opacity
 * oscillates between 0.4 and 0.85 using `withRepeat(...reverse)`,
 * which gives a subtle, non-distracting pulse.
 *
 * Use the `SkeletonList` helper to render a vertical stack of
 * N skeleton rows in one call — common in card lists and tables.
 */
import React, { useEffect } from "react";
import { View, ViewStyle, StyleProp, DimensionValue } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, radius } from "../../lib/theme";

export type SkeletonVariant = "rectangle" | "circle" | "text";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  variant?: SkeletonVariant;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 16,
  variant = "rectangle",
  borderRadius,
  style,
}: SkeletonProps): React.ReactElement {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.4, 0.85]),
  }));

  const computedRadius =
    borderRadius ??
    (variant === "circle"
      ? 9999
      : variant === "text"
        ? radius.sm
        : radius.md);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: computedRadius,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonListProps {
  rows?: number;
  itemHeight?: number;
  gap?: number;
}

/** Convenience: render a vertical stack of N skeletons. */
export function SkeletonList({
  rows = 4,
  itemHeight = 16,
  gap = 8,
}: SkeletonListProps): React.ReactElement {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          height={itemHeight}
          style={i < rows - 1 ? { marginBottom: gap } : undefined}
        />
      ))}
    </View>
  );
}
