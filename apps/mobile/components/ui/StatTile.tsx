// ============================================================================
// StatTile — a single dashboard metric
// ============================================================================
// The native counterpart of the web's gradient stat card
// (apps/web/src/components/shared/stat-card.tsx): a surface tile with a
// saturated brand-gradient icon chip, a large value, and a caption. Used on
// the organizer home; kept generic so any future dashboard can reuse it.
// ============================================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gradient } from '@/components/ui/Gradient';
import { usePalette } from '@/lib/palette';
import { mono } from '@/lib/fonts';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface StatTileProps {
  label: string;
  value: string;
  icon?: IoniconName;
  /** Emerald (organizer default) or warm-orange chip. */
  tone?: 'brand' | 'ember';
}

export function StatTile({ label, value, icon, tone = 'brand' }: StatTileProps): React.ReactElement {
  const p = usePalette();
  return (
    <View style={[styles.tile, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}>
      {icon ? (
        <Gradient
          colors={tone === 'ember' ? gradients.ember : gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chip}
        >
          <Ionicons name={icon} size={16} color={colors.white} />
        </Gradient>
      ) : null}
      <Text style={[styles.value, { color: p.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: p.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  chip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  value: { ...typography.h2, fontSize: 22, fontFamily: mono('700'), letterSpacing: -0.5 },
  label: { ...typography.small, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
});
