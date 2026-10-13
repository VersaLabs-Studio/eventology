// ============================================================================
// EventRail — titled horizontal events rail (Home multi-rail redesign)
// ============================================================================
// A self-contained section: a heading (title + optional icon + "See all")
// above a horizontal scroll of EventCard(horizontal). Owns its own useQuery
// against GET /api/public/events with the given params, so it loads,
// skeletons, errors, and hides independently of every other rail. A failing
// or empty rail renders null — it never blanks the page.
//
// Mirrors the rail pattern in components/ai/RecommendationRail.tsx and
// components/NearbyRail.tsx, but is data-driven via the `params` prop so the
// Home screen can declare many rails from a small config. The parent owns
// navigation, so `onOpenEvent` / `onSeeAll` are injected callbacks.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, spacing, typography } from '@/lib/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface EventsResponse {
  data: MobileEvent[];
  meta: { total: number; page: number; limit: number };
}

interface EventRailProps {
  /** i18n key for the section title (resolved via t()). */
  titleKey: string;
  /** Leading icon for the title row. */
  icon?: IoniconName;
  /** Query params passed to GET /api/public/events. */
  params: Record<string, string | number | undefined>;
  /** Query key fragment — must be unique per rail. */
  queryKey: string[];
  /** Opens an event (slug). */
  onOpenEvent: (slug: string) => void;
  /** "See all" affordance. */
  onSeeAll: () => void;
  /** Semantic tone for the title icon chip. */
  tone?: 'brand' | 'ember';
}

const CARD_WIDTH = 280;

export function EventRail({
  titleKey,
  icon = 'flash',
  params,
  queryKey,
  onOpenEvent,
  onSeeAll,
  tone = 'brand',
}: EventRailProps): React.ReactElement | null {
  const p = usePalette();
  const { t } = useLocale();

  const railQ = useQuery<EventsResponse>({
    queryKey: ['home', 'rail', ...queryKey],
    queryFn: () => api.get<EventsResponse>('/api/public/events', { query: params }),
    staleTime: 30_000,
  });

  const events = railQ.data?.data ?? [];

  // Hide on error, and hide empty results entirely (graceful degradation).
  if (railQ.isError) return null;
  if (!railQ.isLoading && events.length === 0) return null;

  const chipColor = tone === 'ember' ? colors.accent : colors.primary;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.titleRow}>
          <View style={[styles.iconChip, { backgroundColor: `${chipColor}1A` }]}>
            <Ionicons name={icon} size={13} color={chipColor} />
          </View>
          <Text style={[styles.title, { color: p.text }]}>{t(titleKey)}</Text>
        </View>
        <Pressable
          onPress={onSeeAll}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
        >
          <Text style={[styles.seeAll, { color: chipColor }]}>{t('home.seeAll')}</Text>
        </Pressable>
      </View>

      {railQ.isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          scrollEnabled={false}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width={CARD_WIDTH} height={132} radius={radius.lg} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + spacing.md}
          snapToAlignment="start"
          contentContainerStyle={styles.row}
        >
          {events.map((event) => (
            <View key={event.id} style={{ width: CARD_WIDTH }}>
              <EventCard event={event} variant="horizontal" onPress={() => onOpenEvent(event.slug)} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h2 },
  seeAll: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },
  row: { gap: spacing.md, paddingHorizontal: spacing.md },
});
