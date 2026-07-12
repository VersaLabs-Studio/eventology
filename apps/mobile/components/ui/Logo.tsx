// ============================================================================
// Logo — official Eventology brand mark + wordmark
// ============================================================================
// Renders the real brand art (apps/web/public/logo.svg, rasterized into
// assets/logo.png — the infinity "∞" mark holding the calendar + location
// glyphs). `markOnly` shows the mark alone (auth hero, not-found); the default
// pairs the mark with the "Eventology" wordmark, themed to the palette so it
// reads in light and dark. Same public API as before so every caller upgrades
// without changes.
// ============================================================================

import React from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { usePalette } from '@/lib/palette';
import { colors, spacing } from '@/lib/theme';

// Tight infinity mark, transparent. Natural size 1024×506 → aspect ~2.02.
const MARK = require('../../assets/logo.png');
const MARK_ASPECT = 2.02;

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Hide the wordmark and render the mark alone. */
  markOnly?: boolean;
  /** Force light text — for use over a photo or brand wash. */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Mark height when it stands alone. */
const MARK_H = { sm: 30, md: 42, lg: 60 } as const;
/** Mark height + wordmark size when paired. */
const INLINE = {
  sm: { mark: 22, text: 17 },
  md: { mark: 28, text: 21 },
  lg: { mark: 40, text: 30 },
} as const;

export function Logo({ size = 'md', markOnly = false, onDark = false, style }: LogoProps): React.ReactElement {
  const p = usePalette();

  if (markOnly) {
    const h = MARK_H[size];
    return (
      <View style={style}>
        <Image
          source={MARK}
          style={{ width: h * MARK_ASPECT, height: h }}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Eventology"
        />
      </View>
    );
  }

  const s = INLINE[size];
  const wordColor = onDark ? colors.white : p.text;
  const tailColor = onDark ? 'rgba(255,255,255,0.62)' : p.textMuted;

  return (
    <View style={[styles.row, style]}>
      <Image
        source={MARK}
        style={{ width: s.mark * MARK_ASPECT, height: s.mark }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Eventology"
      />
      <Text style={[styles.word, { fontSize: s.text, color: wordColor }]}>
        Event
        <Text style={{ color: tailColor, fontWeight: '600' }}>ology</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  word: { fontWeight: '800', letterSpacing: -0.5 },
});
