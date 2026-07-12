// ============================================================================
// RecommendationRail — "Recommended for you" (mobile)
// ============================================================================
// Native counterpart of the web recommendations-rail. Fetches the signed-in
// user's AI picks (GET /api/protected/recommendations → event_id + reason +
// match_score) and resolves them against the events already loaded on Discover
// — no second round-trip for event bodies. Renders nothing for signed-out
// users, while loading, or when the model returns no picks (new users), so the
// rail is purely additive and never leaves an empty shell.
// ============================================================================

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecommendations, type AiRecommendation } from '@/lib/ai';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, spacing, typography } from '@/lib/theme';

const CARD_WIDTH = 280;

interface Props {
  events: MobileEvent[];
  onOpen: (slug: string) => void;
}

export function RecommendationRail({ events, onOpen }: Props): React.ReactElement | null {
  const p = usePalette();
  const { t } = useLocale();
  const { user } = useAuth();

  const recsQ = useQuery<AiRecommendation[]>({
    queryKey: ['ai', 'recommendations'],
    queryFn: fetchRecommendations,
    enabled: !!user,
    staleTime: 60 * 60_000, // 1h — mirrors the server-side recommendation cache
  });

  if (!user) return null;

  const recs = recsQ.data ?? [];
  const byId = new Map(events.map((e) => [e.id, e]));
  const resolved = recs
    .map((r) => ({ rec: r, event: byId.get(r.event_id) }))
    .filter((x): x is { rec: AiRecommendation; event: MobileEvent } => !!x.event);

  if (resolved.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.titleRow}>
          <View style={[styles.sparkChip, { backgroundColor: `${colors.primary}1A` }]}>
            <Ionicons name="sparkles" size={13} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: p.text }]}>{t('ai.recommended')}</Text>
        </View>
        <Text style={[styles.subtitle, { color: p.textMuted }]}>{t('ai.recommendedSubtitle')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.md}
        snapToAlignment="start"
        contentContainerStyle={styles.row}
      >
        {resolved.map(({ rec, event }) => (
          <View key={event.id} style={{ width: CARD_WIDTH, gap: spacing.xs }}>
            <EventCard event={event} onPress={() => onOpen(event.slug)} />
            <View style={[styles.reason, { backgroundColor: p.surface, borderColor: p.border }]}>
              <Ionicons name="sparkles-outline" size={12} color={colors.primary} />
              <Text style={[styles.reasonText, { color: p.textMuted }]} numberOfLines={2}>
                {rec.reason}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  heading: { gap: 3, paddingHorizontal: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sparkChip: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h2 },
  subtitle: { ...typography.body, fontSize: 13 },
  row: { gap: spacing.md, paddingHorizontal: spacing.md },
  reason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  reasonText: { ...typography.small, fontSize: 11, flex: 1, lineHeight: 15 },
});
