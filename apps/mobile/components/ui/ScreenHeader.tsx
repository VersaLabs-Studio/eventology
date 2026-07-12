// ============================================================================
// ScreenHeader — consistent title / subtitle / trailing-action row
// ============================================================================
// Every tab screen drew its own title row at a slightly different size and
// padding. This is the one shape they all share.
// ============================================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePalette } from '@/lib/palette';
import { spacing, typography } from '@/lib/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Rendered right-aligned, vertically centred against the title. */
  action?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, action }: ScreenHeaderProps): React.ReactElement {
  const p = usePalette();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: p.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: p.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...typography.display, fontSize: 26, lineHeight: 32 },
  subtitle: { ...typography.caption },
  action: { flexShrink: 0 },
});
