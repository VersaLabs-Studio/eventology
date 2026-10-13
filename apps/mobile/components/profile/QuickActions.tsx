// ============================================================================
// QuickActions — 2x2 action grid on the Account tab (HO-3)
// ============================================================================
// Four primary destinations surfaced directly on the profile hub:
//   My tickets · My events · Saved · Notifications
// Each cell is an icon tile + label that routes via the injected callbacks.
// Kept generic so the parent owns navigation (mirrors EventRail's callback
// pattern rather than reaching for the router directly).

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '@/lib/palette';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface QuickAction {
  key: string;
  label: string;
  icon: IoniconName;
  onPress: () => void;
  tone?: 'brand' | 'ember';
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps): React.ReactElement {
  const p = usePalette();

  return (
    <View style={styles.grid}>
      {actions.map((a) => {
        const chipColor = a.tone === 'ember' ? colors.accent : colors.primary;
        return (
          <Pressable
            key={a.key}
            onPress={a.onPress}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            style={({ pressed }) => [
              styles.cell,
              { backgroundColor: p.surface, borderColor: p.border },
              shadows.sm,
              pressed ? { opacity: 0.92 } : null,
            ]}
          >
            <View style={[styles.chip, { backgroundColor: `${chipColor}1A` }]}>
              <Ionicons name={a.icon} size={18} color={chipColor} />
            </View>
            <Text style={[styles.label, { color: p.text }]} numberOfLines={1}>
              {a.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginHorizontal: spacing.md,
  },
  cell: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.bodyBold, fontSize: 14, fontWeight: '700', flex: 1, minWidth: 0 },
});
