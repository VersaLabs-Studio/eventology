// ============================================================================
// Organizer area home — Phase 3 Rotation 3 (restyled Rotation 4)
// ============================================================================
// Lists the caller's organizer events (any status) so they can jump into
// per-event check-in / analytics. Also surfaces the organizer profile +
// 30-day totals from /api/protected/organizers/[id]/stats.
//
// Restyle: brand-gradient identity header, gradient StatTiles, and each event
// card carries an EventImage banner — matching the revamped Discover screen.
// ============================================================================

import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api, ApiClientError } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatTile } from '@/components/ui/StatTile';
import { EventImage } from '@/components/ui/EventImage';
import { Gradient, Scrim } from '@/components/ui/Gradient';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MeOrganizer {
  organizerId: string | null;
  name: string | null;
  isVerified: boolean;
}

interface MyEventRow {
  id: string;
  slug: string;
  title: string;
  banner_image: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  start_date: string;
  end_date: string;
  event_type: string;
  ticket_type: 'free' | 'paid';
  capacity: number;
  registrations_count: number;
  views_count: number;
  is_featured: boolean;
  created_at: string;
  category?: { slug: string } | null;
}

interface MyEventsResponse {
  data: MyEventRow[];
  meta: { total: number; page: number; limit: number };
}

interface OrganizerStats {
  totalEvents: number;
  totalRegistrations: number;
  totalViews: number;
  conversionRate: number;
  generatedAt: string;
}

async function fetchMe(): Promise<MeOrganizer> {
  return api.get<MeOrganizer>('/api/protected/organizers/me');
}

async function fetchMyEvents(): Promise<MyEventsResponse> {
  return api.get<MyEventsResponse>('/api/protected/events', { query: { limit: 50 } });
}

async function fetchStats(organizerId: string): Promise<OrganizerStats> {
  return api.get<OrganizerStats>(`/api/protected/organizers/${organizerId}/stats`);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrganizerHomeScreen(): React.ReactElement {
  const p = usePalette();
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const meQ = useQuery({
    queryKey: ['organizer', 'me'],
    queryFn: fetchMe,
  });
  const organizerId = meQ.data?.organizerId ?? null;

  const eventsQ = useQuery({
    queryKey: ['organizer', 'events'],
    queryFn: fetchMyEvents,
    enabled: !!organizerId,
  });
  const statsQ = useQuery({
    queryKey: ['organizer', 'stats', organizerId],
    queryFn: () => fetchStats(organizerId!),
    enabled: !!organizerId,
  });

  const events = eventsQ.data?.data ?? [];
  const isLoading = meQ.isLoading;
  const isError = meQ.isError;

  // Not an organizer — show empty CTA (rare path; the Profile screen
  // is the primary entry point and only organizers see this link).
  if (!isLoading && !meQ.data?.organizerId) {
    return (
      <View style={[styles.root, { backgroundColor: p.background }]}>
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <View style={{ padding: spacing.md }}>
            <EmptyState
              icon="briefcase-outline"
              title="Not an organizer yet"
              description="Sign in as an organizer on the web to create your first event. Mobile is read-only for organizers today."
              action={{ label: 'Back to Discover', onClick: () => router.push('/') }}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={eventsQ.isFetching}
              onRefresh={() => {
                eventsQ.refetch();
                statsQ.refetch();
              }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={{ gap: spacing.lg, padding: spacing.md }}>
              {/* Brand identity header */}
              <Gradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.identityCard, shadows.md]}
              >
                <View style={styles.identityRow}>
                  <View style={styles.identityAvatar}>
                    <Ionicons name="briefcase" size={24} color={colors.white} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.identityName} numberOfLines={1}>
                      {meQ.data?.name ?? t('organizer.title')}
                    </Text>
                    <Text style={styles.identitySub} numberOfLines={1}>
                      {user ? `Hi, ${(user as { name?: string }).name ?? 'there'}` : t('organizer.organizerArea')}
                    </Text>
                  </View>
                  {meQ.data?.isVerified ? (
                    <View style={styles.verifiedPill}>
                      <Ionicons name="checkmark-circle" size={13} color={colors.white} />
                      <Text style={styles.verifiedText}>{t('organizer.verified')}</Text>
                    </View>
                  ) : null}
                </View>
              </Gradient>

              {/* Stats grid */}
              {statsQ.data && (
                <View style={styles.statsRow}>
                  <StatTile
                    icon="people-outline"
                    label={t('organizer.totalAttendees')}
                    value={String(statsQ.data.totalRegistrations)}
                  />
                  <StatTile icon="eye-outline" label="Views" value={String(statsQ.data.totalViews)} />
                  <StatTile
                    icon="trending-up-outline"
                    label="Conv."
                    value={`${Math.round(statsQ.data.conversionRate * 100)}%`}
                    tone="ember"
                  />
                </View>
              )}

              {/* Revenue entry point */}
              <Button
                label={t('organizer.revenue.cta')}
                leftIcon="cash-outline"
                variant="outline"
                onPress={() => router.push('/organizer/revenue')}
                fullWidth
              />

              {/* Section title */}
              <Text style={[styles.sectionTitle, { color: p.text }]}>{t('organizer.manageEvents')}</Text>

              {isLoading && (
                <View style={{ gap: spacing.md }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={168} radius={16} />
                  ))}
                </View>
              )}

              {isError && (
                <View style={[styles.errorBox, { backgroundColor: colors.destructiveMuted }]}>
                  <Ionicons name="alert-circle" size={18} color={colors.destructive} />
                  <Text style={{ color: colors.destructive, flex: 1, fontSize: 13 }}>
                    {meQ.error instanceof ApiClientError
                      ? meQ.error.message
                      : 'Failed to load your organizer area.'}
                  </Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
              <OrganizerEventCard event={item} router={router} />
            </View>
          )}
          ListEmptyComponent={
            !isLoading && !isError ? (
              <View style={{ padding: spacing.lg }}>
                <EmptyState
                  icon="calendar-outline"
                  title={t('organizer.noEvents')}
                  description={t('organizer.noEventsBody')}
                />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OrganizerEventCard({
  event,
  router,
}: {
  event: MyEventRow;
  router: ReturnType<typeof useRouter>;
}) {
  const p = usePalette();
  const { t } = useLocale();

  const statusVariant =
    event.status === 'approved'
      ? 'success'
      : event.status === 'pending'
        ? 'outline'
        : event.status === 'rejected'
          ? 'destructive'
          : 'warning';

  return (
    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}>
      <EventImage
        uri={event.banner_image}
        title={event.title}
        categorySlug={event.category?.slug}
        style={styles.cardImage}
      >
        <Scrim colors={gradients.scrimSoft} />
        <View style={styles.cardImageTop}>
          <Badge label={event.status} variant={statusVariant} />
          {event.is_featured ? (
            <View style={styles.featuredPill}>
              <Ionicons name="star" size={10} color={colors.white} />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardImageBody}>
          <Text style={styles.cardImageTitle} numberOfLines={2}>
            {event.title}
          </Text>
        </View>
      </EventImage>

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={p.textMuted} />
          <Text style={[styles.meta, { color: p.textMuted }]} numberOfLines={1}>
            {new Date(event.start_date).toLocaleDateString()}
          </Text>
          <View style={[styles.dot, { backgroundColor: p.textSubtle }]} />
          <Text style={[styles.meta, { color: p.textMuted }]} numberOfLines={1}>
            {event.registrations_count} registrations
          </Text>
          <View style={[styles.dot, { backgroundColor: p.textSubtle }]} />
          <Text style={[styles.meta, { color: p.textMuted }]} numberOfLines={1}>
            {event.ticket_type === 'free' ? t('organizer.free') : t('organizer.paid')}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Button
            label={t('organizer.checkIn')}
            leftIcon="qr-code-outline"
            variant="outline"
            onPress={() =>
              router.push({
                pathname: '/organizer/checkin/[eventId]',
                params: { eventId: event.id },
              })
            }
            style={{ flex: 1 }}
          />
          <Button
            label={t('organizer.analytics')}
            leftIcon="bar-chart-outline"
            onPress={() =>
              router.push({
                pathname: '/organizer/analytics/[eventId]',
                params: { eventId: event.id },
              })
            }
            style={{ flex: 1 }}
          />
        </View>
        <Button
          label={t('organizer.attendees.cta')}
          leftIcon="people-outline"
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: '/organizer/attendees/[eventId]',
              params: { eventId: event.id },
            })
          }
          fullWidth
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingBottom: spacing.xxl },

  identityCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  identityName: { ...typography.h2, fontSize: 18, color: colors.white },
  identitySub: { ...typography.caption, fontSize: 12, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  verifiedText: { color: colors.white, fontSize: 10, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { ...typography.h2, fontSize: 16 },
  errorBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 130 },
  cardImageTop: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardImageBody: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.sm },
  cardImageTitle: { ...typography.h3, fontSize: 16, color: colors.white, fontWeight: '800' },
  featuredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  featuredText: { color: colors.white, fontSize: 10, fontWeight: '800' },

  cardBody: { padding: spacing.md, gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  meta: { ...typography.caption, fontSize: 12 },
  dot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.5 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
