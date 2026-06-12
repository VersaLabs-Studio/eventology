// ============================================================================
// Badge — status pill
// ============================================================================
import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp, useColorScheme } from 'react-native';
import { colors, radius, spacing, typography } from '@/lib/theme';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_LIGHT: Record<BadgeVariant, { bg: string; fg: string }> = {
  default: { bg: colors.primaryMuted ?? '#D1FAE5', fg: colors.primaryDark },
  success: { bg: colors.successMuted, fg: '#166534' },
  warning: { bg: colors.warningMuted, fg: '#92400E' },
  destructive: { bg: colors.destructiveMuted, fg: '#991B1B' },
  secondary: { bg: colors.surfaceMuted, fg: colors.text },
  info: { bg: colors.infoMuted, fg: '#1E40AF' },
};

const VARIANT_DARK: Record<BadgeVariant, { bg: string; fg: string }> = {
  default: { bg: '#14532D', fg: colors.primaryLight },
  success: { bg: '#14532D', fg: '#86EFAC' },
  warning: { bg: '#78350F', fg: '#FCD34D' },
  destructive: { bg: '#7F1D1D', fg: '#FCA5A5' },
  secondary: { bg: colors.surfaceMutedDark, fg: colors.textDark },
  info: { bg: '#1E3A8A', fg: '#BFDBFE' },
};

export function Badge({ label, variant = 'default', style }: BadgeProps): React.ReactElement {
  const scheme = useColorScheme();
  const palette = scheme === 'dark' ? VARIANT_DARK[variant] : VARIANT_LIGHT[variant];
  return (
    <View style={[styles.base, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
});
