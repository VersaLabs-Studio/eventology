// ============================================================================
// Organizer area home — Phase 3 Rotation 3
// ============================================================================
// Lists the caller's organizer events (any status) so they can jump into
// per-event check-in / analytics. Also surfaces the organizer profile +
// 30-day totals from /api/protected/organizers/[id]/stats. Frees up the
// "Profile" screen — no more stuffing organizer features in there.
// ============================================================================

import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api, ApiClientError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/lib/theme';

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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const border = isDark ? colors.borderDark : colors.border;
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
      <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <View style={{ padding: spacing.md }}>
            <EmptyState
              icon="briefcase-outline"
              title="Not an organizer yet"
              description="Sign in as an organizer on the web to create your first event. Mobile is read-only for organizers today."
              action={{ label: 'Back to Discover', onClick: () => router.push('/(tabs)/index') }}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
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
            />
          }
          ListHeaderComponent={
            <View style={{ gap: spacing.lg, padding: spacing.md }}>
              {/* Greeting card */}
              <Card padding="md">
                <View style={styles.profileRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.accentMuted }]}>
                    <Ionicons name="briefcase" size={24} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.h1, { color: text }]} numberOfLines={1}>
                      {meQ.data?.name ?? t('organizer.title')}
                    </Text>
                    <Text style={[styles.caption, { color: textMuted }]} numberOfLines={1}>
                      {user ? `Hi, ${(user as { name?: string }).name ?? 'there'}` : t('organizer.organizerArea')}
                    </Text>
                    {meQ.data?.isVerified && (
                      <Badge
                        label={t('organizer.verified')}
                        variant="default"
                        style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}
                      />
                    )}
                  </View>
                </View>
              </Card>

              {/* Stats grid */}
              {statsQ.data && (
                <View style={styles.statsRow}>
                  <StatTile label={t('organizer.totalAttendees')} value={String(statsQ.data.totalRegistrations)} />
                  <StatTile label="Views" value={String(statsQ.data.totalViews)} />
                  <StatTile
                    label="Conv."
                    value={`${Math.round(statsQ.data.conversionRate * 100)}%`}
                  />
                </View>
              )}

              {/* Section title */}
              <Text style={[styles.h2, { color: text }]}>{t('organizer.manageEvents')}</Text>

              {isLoading && (
                <View style={{ gap: spacing.md }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={96} radius={12} />
                  ))}
                </View>
              )}

              {isError && (
                <View
                  style={{
                    backgroundColor: colors.destructiveMuted,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
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

function StatTile({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  return (
    <View
      style={[
        styles.statTile,
        {
          backgroundColor: isDark ? colors.surfaceDark : colors.surface,
          borderColor: isDark ? colors.borderDark : colors.border,
        },
      ]}
    >
      <Text style={[styles.statValue, { color: text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function OrganizerEventCard({
  event,
  router,
}: {
  event: MyEventRow;
  router: ReturnType<typeof useRouter>;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const { t } = useLocale();

  return (
    <Card padding="md">
      <View style={{ gap: spacing.sm }}>
        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, { color: text }]} numberOfLines={2}>
            {event.title}
          </Text>
          <Badge
            label={event.status}
            variant={
              event.status === 'approved'
                ? 'default'
                : event.status === 'pending'
                  ? 'outline'
                  : event.status === 'rejected'
                    ? 'destructive'
                    : 'outline'
            }
          />
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar" size={14} color={textMuted} />
          <Text style={[styles.meta, { color: textMuted }]} numberOfLines={1}>
            {new Date(event.start_date).toLocaleDateString()}
          </Text>
          <View style={[styles.dot, { backgroundColor: textMuted }]} />
          <Text style={[styles.meta, { color: textMuted }]} numberOfLines={1}>
            {event.registrations_count} registrations
          </Text>
          <View style={[styles.dot, { backgroundColor: textMuted }]} />
          <Text style={[styles.meta, { color: textMuted }]} numberOfLines={1}>
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
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingBottom: spacing.xxl },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: { ...typography.h2, fontSize: 18 },
  h2: { ...typography.h2, fontSize: 16 },
  caption: { ...typography.caption, fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statTile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: { ...typography.h2, fontSize: 22, fontWeight: '800' },
  statLabel: { ...typography.caption, fontSize: 11, marginTop: 2, textTransform: 'uppercase' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { ...typography.bodyBold, fontSize: 15, fontWeight: '700', flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  meta: { ...typography.caption, fontSize: 12 },
  dot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.4 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
