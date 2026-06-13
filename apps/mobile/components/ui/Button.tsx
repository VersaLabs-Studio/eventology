// ============================================================================
// Button — primary interactive surface
// ============================================================================
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, darkTheme, lightTheme, radius, spacing, typography } from '@/lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
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
  text: { fontSize: number; fontWeight: '400' | '500' | '600' | '700' | '800'; lineHeight: number };
  iconSize: number;
}

const SIZE_TOKENS: Record<ButtonSize, SizeTokens> = {
  sm: {
    container: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, minHeight: 36 },
    text: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
    iconSize: 14,
  },
  md: {
    container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, minHeight: 44 },
    text: { ...typography.bodyBold, fontSize: 15, lineHeight: 20 },
    iconSize: 16,
  },
  lg: {
    container: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 52 },
    text: { ...typography.h3, fontSize: 17, lineHeight: 22 },
    iconSize: 18,
  },
};

const VARIANT_TOKENS_LIGHT = {
  primary: {
    container: { backgroundColor: colors.primary, borderColor: colors.primary },
    textColor: '#FFFFFF',
    spinnerColor: '#FFFFFF',
    pressedBackground: colors.primaryDark,
  },
  secondary: {
    container: { backgroundColor: colors.surface, borderColor: colors.border },
    textColor: colors.text,
    spinnerColor: colors.primary,
    pressedBackground: colors.surfaceMuted,
  },
  outline: {
    container: { backgroundColor: 'transparent', borderColor: colors.border },
    textColor: colors.text,
    spinnerColor: colors.primary,
    pressedBackground: colors.surfaceMuted,
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderColor: 'transparent' },
    textColor: colors.primary,
    spinnerColor: colors.primary,
    pressedBackground: colors.surfaceMuted,
  },
  destructive: {
    container: { backgroundColor: colors.destructive, borderColor: colors.destructive },
    textColor: '#FFFFFF',
    spinnerColor: '#FFFFFF',
    pressedBackground: '#B91C1C',
  },
} as const;

const VARIANT_TOKENS_DARK = {
  primary: {
    container: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
    textColor: '#0A0A0A',
    spinnerColor: '#0A0A0A',
    pressedBackground: colors.primary,
  },
  secondary: {
    container: { backgroundColor: colors.surfaceDark, borderColor: colors.borderDark },
    textColor: colors.textDark,
    spinnerColor: colors.primaryLight,
    pressedBackground: colors.surfaceMutedDark,
  },
  outline: {
    container: { backgroundColor: 'transparent', borderColor: colors.borderDark },
    textColor: colors.textDark,
    spinnerColor: colors.primaryLight,
    pressedBackground: colors.surfaceMutedDark,
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderColor: 'transparent' },
    textColor: colors.primaryLight,
    spinnerColor: colors.primaryLight,
    pressedBackground: colors.surfaceMutedDark,
  },
  destructive: {
    container: { backgroundColor: colors.destructive, borderColor: colors.destructive },
    textColor: '#FFFFFF',
    spinnerColor: '#FFFFFF',
    pressedBackground: '#B91C1C',
  },
} as const;

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps): React.ReactElement {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? VARIANT_TOKENS_DARK[variant] : VARIANT_TOKENS_LIGHT[variant];
  const sizing = SIZE_TOKENS[size];
  const isDisabled = disabled === true || loading;

  return (
    <View style={[fullWidth && styles.fullWidth, style]}>
      <Pressable
        {...rest}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={({ pressed }) => [
          styles.base,
          sizing.container,
          palette.container,
          fullWidth && styles.fullWidth,
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
              <Ionicons name={leftIcon} size={sizing.iconSize} color={palette.textColor} style={styles.leftIcon} />
            ) : null}
            <Text style={[sizing.text, { color: palette.textColor }]} numberOfLines={1}>
              {label}
            </Text>
            {rightIcon ? (
              <Ionicons name={rightIcon} size={sizing.iconSize} color={palette.textColor} style={styles.rightIcon} />
            ) : null}
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  fullWidth: { alignSelf: 'stretch' },
  leftIcon: { marginRight: spacing.xs + 2 },
  rightIcon: { marginLeft: spacing.xs + 2 },
  disabled: { opacity: 0.5 },
});
