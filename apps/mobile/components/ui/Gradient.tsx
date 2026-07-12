// ============================================================================
// Gradient — linear gradient fill, drawn with react-native-svg
// ============================================================================
// The web leans on `bg-gradient-to-t` everywhere (hero scrims, the featured
// card overlay, the brand wash). Native has no CSS gradients.
//
// We deliberately do NOT pull in `expo-linear-gradient` for this: the Expo Go
// setup on this project only just stabilised, and react-native-svg is already
// a dependency (react-native-qrcode-svg needs it) and already version-pinned in
// the root package.json `overrides`. One fewer native module to keep aligned.
//
// Colours accept any RN colour string, including `rgba(...)` — which is how the
// scrim fades from transparent to black without a separate opacity prop.
// ============================================================================

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export interface GradientProps {
  /** Two or more colour stops, in draw order. */
  colors: readonly string[];
  /**
   * Stop offsets in [0,1], one per colour. Defaults to an even distribution.
   */
  locations?: readonly number[];
  /** Unit-square start/end. Default is top → bottom. */
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Fills its own bounds. Give it a size via `style`, or use
 * `style={StyleSheet.absoluteFill}` to overlay a sibling.
 */
export function Gradient({
  colors,
  locations,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  style,
  children,
}: GradientProps): React.ReactElement {
  // Two <Gradient/>s on one screen must not share a <Defs> id or the second
  // silently inherits the first's stops. useId() emits ":r0:" — the colons are
  // not safe inside url(#…), so strip everything but word characters.
  const rawId = React.useId();
  const gradientId = React.useMemo(() => `grad${rawId.replace(/\W/g, '')}`, [rawId]);

  const stops = React.useMemo(() => {
    const n = colors.length;
    return colors.map((color, i) => ({
      color,
      offset: locations?.[i] ?? (n === 1 ? 0 : i / (n - 1)),
    }));
  }, [colors, locations]);

  return (
    <View style={style} pointerEvents="box-none">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id={gradientId} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
            {stops.map((stop, i) => (
              <Stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={1} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
      {children}
    </View>
  );
}

/**
 * Bottom-up dark scrim, sized to its parent. Anything drawn after it (title,
 * badges) stays legible over an arbitrary photo.
 */
export function Scrim({
  colors: stops,
  locations,
  style,
}: Pick<GradientProps, 'colors' | 'locations' | 'style'>): React.ReactElement {
  return <Gradient colors={stops} locations={locations} style={[StyleSheet.absoluteFill, style]} />;
}
