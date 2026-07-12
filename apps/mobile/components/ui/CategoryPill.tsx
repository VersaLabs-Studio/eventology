// ============================================================================
// CategoryPill — category chip, tinted by the category's own colour
// ============================================================================
// Two flavours:
//   • `variant="tint"`  — translucent tint of the category colour, for pills
//                          that sit on a card surface.
//   • `variant="glass"` — frosted white on a dark scrim, for pills over photos.
//
// Selectable pills (the Discover / Search rails) fill solid when active.
// ============================================================================

import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoryIcon, categoryTint, type CategoryLike } from '@/lib/category';
import { usePalette } from '@/lib/palette';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface CategoryPillProps {
  label: string;
  category?: CategoryLike | null;
  variant?: 'tint' | 'glass';
  showIcon?: boolean;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function CategoryPill({
  label,
  category,
  variant = 'tint',
  showIcon = false,
  selected = false,
  onPress,
  style,
}: CategoryPillProps): React.ReactElement {
  const p = usePalette();
  const tint = categoryTint(category);

  const surface: ViewStyle =
    selected
      ? { backgroundColor: tint.fg, borderColor: tint.fg }
      : variant === 'glass'
        ? { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.28)' }
        : { backgroundColor: tint.bg, borderColor: tint.border };

  const fg = selected ? colors.white : variant === 'glass' ? colors.white : tint.fg;

  const body = (
    <View style={[styles.base, surface, style]}>
      {showIcon ? <Ionicons name={categoryIcon(category?.slug)} size={12} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: { ...typography.caption, fontSize: 11, fontWeight: '700' },
});
