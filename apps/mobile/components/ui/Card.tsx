// ============================================================================
// Card — elevated surface
// ============================================================================
import React from 'react';
import { Pressable, PressableProps, StyleSheet, View, ViewStyle, StyleProp, useColorScheme } from 'react-native';
import { colors, radius, shadows, spacing } from '@/lib/theme';

export type CardVariant = 'default' | 'elevated' | 'flat' | 'outline';

interface CardProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof PADDING_TOKENS | 'none';
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

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  ...rest
}: CardProps): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const surface = isDark ? colors.surfaceDark : colors.surface;
  const border = isDark ? colors.borderDark : colors.border;

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? { backgroundColor: surface, borderWidth: 0, ...shadows.md }
      : variant === 'flat'
        ? { backgroundColor: surface, borderWidth: 1, borderColor: border }
        : variant === 'outline'
          ? { backgroundColor: 'transparent', borderWidth: 2, borderColor: border }
          : { backgroundColor: surface, borderWidth: 1, borderColor: border, ...shadows.sm };

  const paddingStyle: ViewStyle | null =
    padding === 'none' ? null : { padding: PADDING_TOKENS[padding] };

  const surfaceStyle: StyleProp<ViewStyle> = [styles.base, variantStyle, paddingStyle];

  if (onPress !== undefined) {
    return (
      <View style={style}>
        <Pressable
          {...rest}
          onPress={onPress}
          accessibilityRole="button"
          style={({ pressed }) => [surfaceStyle, pressed ? styles.pressed : null]}
        >
          {children}
        </Pressable>
      </View>
    );
  }

  return <View style={[surfaceStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.96 },
});
