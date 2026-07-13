// ============================================================================
// StarRating — 1–5 tap input with haptic feedback
// ============================================================================
// Interactive by default (tap a star to set the rating). Pass `readOnly` to
// render a static rating (e.g. inside a review card). Haptics fire on each
// selection change, per the mobile design system (§8.4 haptic feedback on key
// actions); they degrade to a no-op on platforms without a haptics engine.
// ============================================================================

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, size = 34, readOnly = false }: StarRatingProps): React.ReactElement {
  const handlePress = (star: number) => {
    if (readOnly || !onChange) return;
    void Haptics.selectionAsync().catch(() => {
      /* haptics unavailable — no-op */
    });
    onChange(star);
  };

  return (
    <View style={styles.row} accessibilityRole={readOnly ? 'image' : 'adjustable'}>
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        const filled = star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => handlePress(star)}
            disabled={readOnly}
            hitSlop={6}
            accessibilityRole={readOnly ? undefined : 'button'}
            accessibilityLabel={readOnly ? undefined : `Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? colors.accent : colors.border}
              style={styles.star}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  star: { marginHorizontal: 1 },
});
