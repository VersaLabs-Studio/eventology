// ============================================================================
// QuickFilters — navigational filter chips (Home multi-rail redesign)
// ============================================================================
// A single horizontal row of chips (Today / This week / Free / Popular). Each
// chip is purely navigational: tapping it routes to the Search tab with the
// matching preset applied (router.push('/search?…')). There is no inline
// filter state on Home — the Search screen owns filtering, per the plan.
//
// Mirrors the CategoryPill rail pattern but is a fixed, curated set rather
// than data-driven from the API.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, spacing, typography } from '@/lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface QuickFilter {
  key: string;
  labelKey: string;
  icon: IoniconName;
  /** Query string appended to /search. */
  query: string;
}

const FILTERS: QuickFilter[] = [
  { key: 'today', labelKey: 'home.filters.today', icon: 'today-outline', query: '?date=today' },
  { key: 'thisWeek', labelKey: 'home.filters.thisWeek', icon: 'calendar-outline', query: '?date=this-week' },
  { key: 'free', labelKey: 'home.filters.free', icon: 'pricetag-outline', query: '?price=free' },
  { key: 'popular', labelKey: 'home.filters.popular', icon: 'trending-up-outline', query: '?sort=popular' },
];

export function QuickFilters(): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map((f) => (
        <Pressable
          key={f.key}
          onPress={() => router.push(`/search${f.query}` as never)}
          accessibilityRole="button"
          accessibilityLabel={t(f.labelKey)}
          style={({ pressed }) => [
            styles.chip,
            { backgroundColor: p.surface, borderColor: p.border },
            pressed ? { backgroundColor: p.surfaceMuted } : null,
          ]}
        >
          <Ionicons name={f.icon} size={15} color={colors.primary} />
          <Text style={[styles.label, { color: p.text }]}>{t(f.labelKey)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },
});
