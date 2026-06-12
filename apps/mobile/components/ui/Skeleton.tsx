// ============================================================================
// Skeleton — animated loading placeholder
// ============================================================================
import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, useColorScheme } from 'react-native';
import { colors, radius } from '@/lib/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, radius: r = radius.sm, style }: SkeletonProps) {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? colors.surfaceMutedDark : colors.surfaceMuted;
  return <View style={[{ width, height, borderRadius: r, backgroundColor: bg }, style]} />;
}

const styles = StyleSheet.create({});
