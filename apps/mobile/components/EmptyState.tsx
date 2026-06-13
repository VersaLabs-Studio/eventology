// ============================================================================
// EmptyState — placeholder for empty lists / errors
// ============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void } | React.ReactNode;
}

export function EmptyState({ icon = 'file-tray-outline', title, description, action }: EmptyStateProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  // Normalize legacy `{label, onClick}` shape → button-like node
  const actionNode: React.ReactNode =
    action && typeof action === 'object' && 'label' in action && 'onClick' in action ? (
      <Pressable
        onPress={action.onClick}
        style={({ pressed }) => [
          {
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 12,
            backgroundColor: pressed ? colors.primaryDark : colors.primary,
          },
        ]}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{action.label}</Text>
      </Pressable>
    ) : (
      (action as React.ReactNode)
    );
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
      {actionNode ? <View style={styles.action}>{actionNode}</View> : null}
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
