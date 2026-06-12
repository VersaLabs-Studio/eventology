// ============================================================================
// EventCard — list item for events
// ============================================================================
import React from 'react';
import { Image, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { formatDate } from '@eventology/utils';

// Public event shape returned by /api/public/events (subset)
export interface MobileEvent {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description?: string | null;
  banner_image: string | null;
  start_date: string;
  end_date: string;
  event_type: string;
  ticket_type: 'free' | 'paid';
  sub_city: string | null;
  venue_name: string | null;
  is_featured: boolean;
  registrations_count: number;
  category: { id: string; name: string; slug: string; color: string; icon?: string | null } | null;
  organizer: { id: string; name: string; slug: string; is_verified: boolean } | null;
  ticket_tiers?: Array<{ id: string; name: string; price: number; currency: string }>;
}

interface EventCardProps {
  event: MobileEvent;
  onPress?: () => void;
}

export function EventCard({ event, onPress }: EventCardProps): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const minPrice = event.ticket_tiers?.length
    ? Math.min(...event.ticket_tiers.map((t) => t.price))
    : null;
  const currency = event.ticket_tiers?.[0]?.currency ?? 'ETB';

  return (
    <Card onPress={onPress} variant="default" padding="none">
      <View style={styles.banner}>
        {event.banner_image ? (
          <Image source={{ uri: event.banner_image }} style={styles.bannerImage} resizeMode="cover" />
        ) : (
          <View style={[styles.bannerImage, styles.bannerPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="image-outline" size={32} color={textMuted} />
          </View>
        )}
        {event.is_featured && (
          <View style={styles.featuredPill}>
            <Ionicons name="star" size={10} color="#FFFFFF" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        {event.category && (
          <View style={[styles.categoryPill, { backgroundColor: `${event.category.color}22`, borderColor: `${event.category.color}66` }]}>
            <Text style={[styles.categoryText, { color: event.category.color }]} numberOfLines={1}>
              {event.category.name}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: text }]} numberOfLines={2}>
          {event.title}
        </Text>
        {event.short_description && (
          <Text style={[styles.description, { color: textMuted }]} numberOfLines={2}>
            {event.short_description}
          </Text>
        )}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={textMuted} />
            <Text style={[styles.metaText, { color: textMuted }]}>{formatDate(event.start_date)}</Text>
          </View>
          {event.sub_city && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={textMuted} />
              <Text style={[styles.metaText, { color: textMuted }]} numberOfLines={1}>
                {event.sub_city}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            {event.organizer && (
              <Text style={[styles.organizer, { color: textMuted }]} numberOfLines={1}>
                {event.organizer.name}
              </Text>
            )}
            {event.organizer?.is_verified && (
              <Ionicons name="checkmark-circle" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
            )}
          </View>
          <View>
            {event.ticket_type === 'free' ? (
              <Badge label="Free" variant="success" />
            ) : minPrice !== null ? (
              <Text style={[styles.price, { color: text }]}>
                {currency} {minPrice.toFixed(0)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceMuted,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  featuredPill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  featuredText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  categoryPill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  categoryText: { fontSize: 10, fontWeight: '700' },
  body: { padding: spacing.md, gap: spacing.xs },
  title: { ...typography.h3, fontSize: 15, lineHeight: 20 },
  description: { ...typography.body, fontSize: 13 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.small, fontSize: 11 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  organizer: { ...typography.caption, flexShrink: 1 },
  price: { ...typography.bodyBold, fontSize: 14, fontWeight: '700' },
});
