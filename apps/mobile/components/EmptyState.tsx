// ============================================================================
// EmptyState — placeholder for empty lists / errors
// ============================================================================
import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/lib/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'file-tray-outline', title, description, action }: EmptyStateProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: isDark ? colors.surfaceMutedDark : colors.surfaceMuted },
        ]}
      >
        <Ionicons name={icon} size={28} color={textMuted} />
      </View>
      <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: textMuted }]}>{description}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, textAlign: 'center', marginBottom: spacing.xs },
  description: { ...typography.body, textAlign: 'center', maxWidth: 280 },
  action: { marginTop: spacing.lg },
});
