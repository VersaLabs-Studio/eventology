// ============================================================================
// Event detail screen
// ============================================================================
// Loads /api/public/events/[slug]. Renders banner, title, organizer,
// venue, description, ticket tiers. The Register button is a DISABLED
// "Coming soon" affordance — registration is wired in Rotation 2 (P18).
// ============================================================================

import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiClientError } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/EmptyState';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { formatDate, formatDateTime, formatETB } from '@eventology/utils';

interface Organizer {
  id: string;
  name: string;
  slug: string;
  is_verified: boolean;
  bio: string | null;
  website: string | null;
  avatar_url: string | null;
}

interface TicketTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  capacity: number;
  sold_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  short_description: string | null;
  banner_image: string | null;
  start_date: string;
  end_date: string;
  event_type: string;
  ticket_type: 'free' | 'paid';
  venue_name: string | null;
  venue_address: string | null;
  sub_city: string | null;
  capacity: number;
  registrations_count: number;
  is_featured: boolean;
  organizer: Organizer | null;
  category: Category | null;
  ticket_tiers: TicketTier[] | null;
}

async function fetchEvent(slug: string): Promise<EventDetail> {
  return api.get<EventDetail>(`/api/public/events/${encodeURIComponent(slug)}`);
}

export default function EventDetailScreen(): React.ReactElement {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const border = isDark ? colors.borderDark : colors.border;

  const eventQ = useQuery({
    queryKey: ['events', 'detail', slug],
    queryFn: () => fetchEvent(slug),
    enabled: !!slug,
  });

  const event = eventQ.data;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <Stack.Screen options={{ title: event?.title ?? 'Event' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {eventQ.isLoading && (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={220} radius={0} />
            <View style={{ padding: spacing.md, gap: spacing.md }}>
              <Skeleton height={28} width="70%" />
              <Skeleton height={16} width="40%" />
              <Skeleton height={120} />
            </View>
          </View>
        )}

        {eventQ.error && (
          <View style={{ padding: spacing.lg }}>
            <EmptyState
              icon="alert-circle-outline"
              title="Couldn't load this event"
              description={eventQ.error instanceof ApiClientError ? eventQ.error.message : 'Try again later.'}
            />
          </View>
        )}

        {event && (
          <>
            <View style={styles.bannerWrap}>
              {event.banner_image ? (
                <Image source={{ uri: event.banner_image }} style={styles.banner} resizeMode="cover" />
              ) : (
                <View style={[styles.banner, styles.bannerPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="image-outline" size={48} color={textMuted} />
                </View>
              )}
            </View>

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: text }]} numberOfLines={3}>
                  {event.title}
                </Text>
                {event.category && (
                  <Badge
                    label={event.category.name}
                    variant="default"
                    style={{ backgroundColor: `${event.category.color}22`, borderColor: `${event.category.color}66` }}
                  />
                )}
              </View>

              {event.organizer && (
                <View style={styles.organizerRow}>
                  <Ionicons name="person-circle" size={20} color={textMuted} />
                  <Text style={[styles.organizerName, { color: text }]} numberOfLines={1}>
                    {event.organizer.name}
                  </Text>
                  {event.organizer.is_verified && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
                </View>
              )}

              {/* Meta */}
              <Card padding="md" variant="default">
                <View style={styles.metaList}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metaLabel, { color: textMuted }]}>Starts</Text>
                      <Text style={[styles.metaValue, { color: text }]}>{formatDateTime(event.start_date)}</Text>
                    </View>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metaLabel, { color: textMuted }]}>Ends</Text>
                      <Text style={[styles.metaValue, { color: text }]}>{formatDateTime(event.end_date)}</Text>
                    </View>
                  </View>
                  {event.venue_name && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location" size={16} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.metaLabel, { color: textMuted }]}>Venue</Text>
                        <Text style={[styles.metaValue, { color: text }]}>{event.venue_name}</Text>
                        {event.sub_city && (
                          <Text style={[styles.metaSub, { color: textMuted }]} numberOfLines={1}>
                            {event.sub_city}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </Card>

              {/* Description */}
              {event.description && (
                <View>
                  <Text style={[styles.sectionTitle, { color: text }]}>About</Text>
                  <Text style={[styles.description, { color: text }]}>{event.description}</Text>
                </View>
              )}

              {/* Tiers */}
              {event.ticket_tiers && event.ticket_tiers.length > 0 && (
                <View>
                  <Text style={[styles.sectionTitle, { color: text }]}>Tickets</Text>
                  <View style={{ gap: spacing.sm }}>
                    {event.ticket_tiers.map((tier) => {
                      const remaining = Math.max(0, tier.capacity - tier.sold_count);
                      const soldOut = remaining === 0;
                      return (
                        <Card key={tier.id} padding="md" variant="default">
                          <View style={styles.tierHeader}>
                            <Text style={[styles.tierName, { color: text }]}>{tier.name}</Text>
                            <Text style={[styles.tierPrice, { color: text }]}>
                              {tier.price === 0 ? 'Free' : formatETB(tier.price)}
                            </Text>
                          </View>
                          {tier.description && (
                            <Text style={[styles.tierDescription, { color: textMuted }]}>{tier.description}</Text>
                          )}
                          <Text style={[styles.tierMeta, { color: textMuted }]}>
                            {soldOut ? 'Sold out' : `${remaining} of ${tier.capacity} left`}
                          </Text>
                        </Card>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky register CTA — disabled "coming soon" (P18 wires this) */}
      {event && (
        <View style={[styles.cta, { borderTopColor: border, backgroundColor: isDark ? colors.surfaceDark : colors.surface }]}>
          <Button
            label="Register — coming soon"
            leftIcon="time-outline"
            disabled
            fullWidth
            onPress={() => {
              /* wired in P18 */
            }}
          />
        </View>
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  bannerWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surfaceMuted },
  banner: { width: '100%', height: '100%' },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  title: { ...typography.h1, fontSize: 22, lineHeight: 28, flex: 1 },
  sectionTitle: { ...typography.h2, fontSize: 18, marginBottom: spacing.xs },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  organizerName: { ...typography.bodyBold, fontSize: 14 },
  metaList: { gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaLabel: { ...typography.small, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { ...typography.body, fontSize: 14, fontWeight: '600' },
  metaSub: { ...typography.caption, fontSize: 12 },
  description: { ...typography.body, fontSize: 14, lineHeight: 22 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  tierName: { ...typography.bodyBold, fontSize: 15, fontWeight: '700' },
  tierPrice: { ...typography.bodyBold, fontSize: 15, fontWeight: '700' },
  tierDescription: { ...typography.caption, fontSize: 12, marginBottom: spacing.xs },
  tierMeta: { ...typography.small, fontSize: 11 },
  cta: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
});
