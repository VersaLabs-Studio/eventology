// ============================================================================
// EventCard — list item for events
// ============================================================================
// Three variants, matching apps/web/src/components/shared/event-card.tsx:
//
//   grid       — default. Banner on top, meta below, organizer + price footer.
//   featured   — full-bleed photo with a scrim and the title overlaid. Used in
//                the Discover carousel.
//   horizontal — compact row for dense lists (search results).
//
// Category colour comes from `categoryColor()`, never from `category.color`
// directly — the API hands back a Tailwind class, not a hex. See lib/category.ts.
// ============================================================================

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventImage } from '@/components/ui/EventImage';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { Scrim } from '@/components/ui/Gradient';
import { usePalette } from '@/lib/palette';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';
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

export type EventCardVariant = 'grid' | 'featured' | 'horizontal';

interface EventCardProps {
  event: MobileEvent;
  variant?: EventCardVariant;
  onPress?: () => void;
}

/** "Free" or "ETB 450" — the cheapest tier wins, matching the web. */
function priceLabel(event: MobileEvent): string {
  if (event.ticket_type === 'free') return 'Free';
  const tiers = event.ticket_tiers ?? [];
  if (tiers.length === 0) return 'Soon';
  const min = Math.min(...tiers.map((t) => t.price));
  if (min === 0) return 'Free';
  const currency = tiers[0]?.currency ?? 'ETB';
  return `${currency} ${min.toLocaleString()}`;
}

function locationLabel(event: MobileEvent): string | null {
  return event.sub_city ?? event.venue_name ?? null;
}

export function EventCard({ event, variant = 'grid', onPress }: EventCardProps): React.ReactElement {
  const p = usePalette();

  // ── featured: photo-first, title over a scrim ──
  if (variant === 'featured') {
    const place = locationLabel(event);
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.featuredRoot,
          shadows.lg,
          pressed ? styles.pressed : null,
        ]}
      >
        <EventImage
          uri={event.banner_image}
          title={event.title}
          categorySlug={event.category?.slug}
          style={styles.featuredImage}
        >
          <Scrim colors={gradients.scrim} locations={[0, 0.45, 1]} />

          <View style={styles.featuredTopRow}>
            {event.category ? (
              <CategoryPill label={event.category.name} category={event.category} variant="glass" showIcon />
            ) : (
              <View />
            )}
            {event.is_featured ? (
              <View style={styles.featuredPill}>
                <Ionicons name="star" size={10} color={colors.white} />
                <Text style={styles.featuredPillText}>Featured</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.featuredBody}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.featuredMetaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={colors.primaryLight} />
                <Text style={styles.featuredMeta}>{formatDate(event.start_date)}</Text>
              </View>
              {place ? (
                <View style={[styles.metaItem, styles.shrink]}>
                  <Ionicons name="location-outline" size={13} color={colors.accentLight} />
                  <Text style={styles.featuredMeta} numberOfLines={1}>
                    {place}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </EventImage>
      </Pressable>
    );
  }

  // ── horizontal: compact row ──
  if (variant === 'horizontal') {
    const place = locationLabel(event);
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.hRoot,
          { backgroundColor: p.surface, borderColor: p.border },
          shadows.sm,
          pressed ? styles.pressed : null,
        ]}
      >
        <EventImage
          uri={event.banner_image}
          title={event.title}
          categorySlug={event.category?.slug}
          style={styles.hImage}
        />
        <View style={styles.hBody}>
          <View style={styles.hTopRow}>
            {event.category ? (
              <CategoryPill label={event.category.name} category={event.category} />
            ) : null}
          </View>
          <Text style={[styles.hTitle, { color: p.text }]} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.hMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={colors.primary} />
              <Text style={[styles.metaText, { color: p.textMuted }]}>{formatDate(event.start_date)}</Text>
            </View>
            {place ? (
              <View style={[styles.metaItem, styles.shrink]}>
                <Ionicons name="location-outline" size={12} color={colors.accent} />
                <Text style={[styles.metaText, { color: p.textMuted }]} numberOfLines={1}>
                  {place}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.priceInline, { color: colors.primary }]}>{priceLabel(event)}</Text>
        </View>
      </Pressable>
    );
  }

  // ── grid (default) ──
  const place = locationLabel(event);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.gridRoot,
        { backgroundColor: p.surface, borderColor: p.border },
        shadows.md,
        pressed ? styles.pressed : null,
      ]}
    >
      <EventImage
        uri={event.banner_image}
        title={event.title}
        categorySlug={event.category?.slug}
        style={styles.gridImage}
      >
        <View style={styles.gridTopRow}>
          {event.category ? (
            <CategoryPill label={event.category.name} category={event.category} variant="glass" />
          ) : (
            <View />
          )}
          {event.is_featured ? (
            <View style={styles.featuredPill}>
              <Ionicons name="star" size={10} color={colors.white} />
              <Text style={styles.featuredPillText}>Featured</Text>
            </View>
          ) : null}
        </View>
      </EventImage>

      <View style={styles.gridBody}>
        <Text style={[styles.gridTitle, { color: p.text }]} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.gridMetaCol}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[styles.metaText, { color: p.textMuted }]}>{formatDate(event.start_date)}</Text>
          </View>
          {place ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.accent} />
              <Text style={[styles.metaText, { color: p.textMuted }]} numberOfLines={1}>
                {place}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.gridFooter, { borderTopColor: p.border }]}>
          <View style={styles.organizerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
              <Text style={styles.avatarText}>
                {(event.organizer?.name ?? 'Org').slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.organizer, { color: p.textMuted }]} numberOfLines={1}>
              {event.organizer?.name ?? 'Eventology'}
            </Text>
            {event.organizer?.is_verified ? (
              <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
            ) : null}
          </View>

          <View style={[styles.priceChip, { backgroundColor: `${colors.primary}1A` }]}>
            <Text style={styles.priceChipText}>{priceLabel(event)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { ...typography.caption, fontSize: 12 },
  shrink: { flexShrink: 1, minWidth: 0 },

  // grid
  gridRoot: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  gridImage: { width: '100%', aspectRatio: 16 / 10 },
  gridTopRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.sm + 2,
  },
  gridBody: { padding: spacing.md, gap: spacing.sm },
  gridTitle: { ...typography.h3, fontSize: 16, lineHeight: 21 },
  gridMetaCol: { gap: 5 },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.sm + 2,
    marginTop: 2,
    borderTopWidth: 1,
  },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  avatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '800', color: colors.primaryDeep },
  organizer: { ...typography.caption, flexShrink: 1 },
  priceChip: { paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: radius.sm + 2 },
  priceChipText: { ...typography.bodyBold, fontSize: 13, fontWeight: '800', color: colors.primaryDark },

  // featured
  featuredRoot: { borderRadius: radius.xl, overflow: 'hidden' },
  featuredImage: { width: '100%', height: 300 },
  featuredTopRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  featuredBody: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, gap: spacing.sm },
  featuredTitle: { ...typography.h2, fontSize: 21, lineHeight: 27, color: colors.white, fontWeight: '800' },
  featuredMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featuredMeta: { ...typography.caption, fontSize: 12, color: 'rgba(255,255,255,0.88)' },
  featuredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  featuredPillText: { color: colors.white, fontSize: 10, fontWeight: '800' },

  // horizontal
  hRoot: { flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  // `alignSelf: stretch`, not `height: '100%'` — the row has no explicit height
  // for a percentage to resolve against, so 100% would collapse to 0.
  hImage: { width: 112, alignSelf: 'stretch', minHeight: 132 },
  hBody: { flex: 1, minWidth: 0, padding: spacing.md, gap: 5, justifyContent: 'center' },
  hTopRow: { flexDirection: 'row' },
  hTitle: { ...typography.bodyBold, fontSize: 15, lineHeight: 20 },
  hMetaRow: { gap: 4 },
  priceInline: { ...typography.bodyBold, fontSize: 13, fontWeight: '800', marginTop: 2 },
});
