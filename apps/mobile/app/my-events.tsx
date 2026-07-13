// ============================================================================
// My Events — the caller's registration history
// ============================================================================
// Upcoming / Past / Cancelled tabs over a single GET /api/protected/registrations
// fetch (filtered client-side by event end date + registration status, mirroring
// the web my-events page which reuses the same endpoint). Each row links to the
// event; when a ticket was issued, a shortcut opens the ticket page.
// ============================================================================

import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EventImage } from '@/components/ui/EventImage';
import { Scrim } from '@/components/ui/Gradient';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';
import { formatDate } from '@eventology/utils';

type BadgeVariant = 'success' | 'outline' | 'destructive' | 'secondary';

interface RegistrationRow {
  id: string;
  status: 'confirmed' | 'pending_payment' | 'cancelled' | 'checked_in' | 'waitlisted' | 'no_show';
  waitlist_position: number | null;
  event: {
    id: string;
    title: string;
    slug: string;
    banner_image: string | null;
    start_date: string;
    end_date: string;
    venue_name: string | null;
  } | null;
  ticket: { id: string; ticket_number: string; status: string } | null;
}

interface RegistrationsResponse {
  data: RegistrationRow[];
  meta: { total: number; page: number; limit: number };
}

type TabKey = 'upcoming' | 'past' | 'cancelled';

async function fetchRegistrations(): Promise<RegistrationsResponse> {
  return api.get<RegistrationsResponse>('/api/protected/registrations?limit=100');
}

export default function MyEventsScreen(): React.ReactElement {
  const p = usePalette();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocale();
  const [tab, setTab] = React.useState<TabKey>('upcoming');

  const q = useQuery({
    queryKey: ['registrations', 'mine'],
    queryFn: fetchRegistrations,
    enabled: !!user,
  });

  const all = q.data?.data ?? [];
  const now = Date.now();

  const buckets = React.useMemo(() => {
    const upcoming: RegistrationRow[] = [];
    const past: RegistrationRow[] = [];
    const cancelled: RegistrationRow[] = [];
    for (const r of all) {
      if (r.status === 'cancelled' || r.status === 'no_show') {
        cancelled.push(r);
        continue;
      }
      const ended = r.event ? new Date(r.event.end_date).getTime() < now : false;
      if (ended) past.push(r);
      else upcoming.push(r);
    }
    return { upcoming, past, cancelled };
  }, [all, now]);

  const rows = buckets[tab];

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'upcoming', label: t('myEvents.upcoming'), count: buckets.upcoming.length },
    { key: 'past', label: t('myEvents.past'), count: buckets.past.length },
    { key: 'cancelled', label: t('myEvents.cancelled'), count: buckets.cancelled.length },
  ];

  const header = (
    <View style={[styles.topbar, { borderBottomColor: p.border }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.back')}>
        <Ionicons name="chevron-back" size={24} color={p.text} />
      </Pressable>
      <Text style={[styles.topbarTitle, { color: p.text }]}>{t('myEvents.title')}</Text>
      <View style={styles.topbarSpacer} />
    </View>
  );

  if (!user) {
    return (
      <View style={[styles.root, { backgroundColor: p.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={styles.flex}>
          {header}
          <View style={styles.signedOut}>
            <EmptyState
              icon="person-outline"
              title={t('myEvents.signInTitle')}
              description={t('myEvents.signInBody')}
              action={{ label: t('common.signIn'), onClick: () => router.push('/auth/login') }}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.flex}>
        {header}

        {/* segmented tabs */}
        <View style={styles.tabs}>
          {TABS.map((tb) => {
            const active = tb.key === tab;
            return (
              <Pressable
                key={tb.key}
                onPress={() => setTab(tb.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[
                  styles.tab,
                  { backgroundColor: active ? colors.primary : p.surface, borderColor: active ? colors.primary : p.border },
                ]}
              >
                <Text style={[styles.tabLabel, { color: active ? colors.white : p.text }]}>
                  {tb.label} {tb.count > 0 ? `(${tb.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <RegistrationCard
              row={item}
              onOpenEvent={() => item.event && router.push(`/event/${item.event.slug}`)}
              onOpenTicket={item.ticket ? () => router.push(`/ticket/${item.ticket!.id}`) : undefined}
            />
          )}
          ListEmptyComponent={
            q.isLoading ? (
              <View style={{ gap: spacing.md }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={132} radius={16} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="calendar-outline"
                title={t(`myEvents.empty.${tab}` as Parameters<typeof t>[0])}
                description={t('myEvents.emptyBody')}
                action={{ label: t('myEvents.discover'), onClick: () => router.push('/') }}
              />
            )
          }
          refreshControl={
            <RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />
          }
        />
      </SafeAreaView>
    </View>
  );
}

function statusMeta(status: RegistrationRow['status']): { variant: BadgeVariant; key: string } {
  switch (status) {
    case 'confirmed':
      return { variant: 'success', key: 'status.confirmed' };
    case 'checked_in':
      return { variant: 'success', key: 'status.checkedIn' };
    case 'waitlisted':
      return { variant: 'secondary', key: 'status.waitlisted' };
    case 'pending_payment':
      return { variant: 'secondary', key: 'status.pending' };
    case 'cancelled':
      return { variant: 'destructive', key: 'status.cancelled' };
    case 'no_show':
      return { variant: 'outline', key: 'status.noShow' };
  }
}

function RegistrationCard({
  row,
  onOpenEvent,
  onOpenTicket,
}: {
  row: RegistrationRow;
  onOpenEvent: () => void;
  onOpenTicket?: () => void;
}): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const meta = statusMeta(row.status);

  return (
    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}>
      <Pressable onPress={onOpenEvent} accessibilityRole="button">
        <EventImage uri={row.event?.banner_image} title={row.event?.title} style={styles.cardImage}>
          <Scrim colors={gradients.scrimSoft} />
          <View style={styles.cardBadge}>
            <Badge label={t(meta.key as Parameters<typeof t>[0])} variant={meta.variant} />
          </View>
          <View style={styles.cardImageBody}>
            <Text style={styles.cardImageTitle} numberOfLines={2}>
              {row.event?.title ?? t('myEvents.untitled')}
            </Text>
          </View>
        </EventImage>
      </Pressable>

      <View style={styles.cardBody}>
        <View style={styles.flexMin}>
          {row.event ? (
            <Text style={[styles.cardMeta, { color: p.textMuted }]} numberOfLines={1}>
              {formatDate(row.event.start_date)}
              {row.event.venue_name ? ` · ${row.event.venue_name}` : ''}
            </Text>
          ) : null}
          {row.status === 'waitlisted' && row.waitlist_position ? (
            <Text style={[styles.cardMeta, { color: colors.accent }]}>
              {t('myEvents.waitlistPos')} #{row.waitlist_position}
            </Text>
          ) : null}
        </View>
        {onOpenTicket ? (
          <Button label={t('myEvents.viewTicket')} variant="ghost" size="sm" leftIcon="ticket-outline" onPress={onOpenTicket} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  flexMin: { flex: 1, minWidth: 0 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topbarTitle: { ...typography.h2, fontSize: 18, marginLeft: spacing.sm },
  topbarSpacer: { flex: 1 },
  tabs: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm + 2, alignItems: 'center', borderRadius: radius.md, borderWidth: 1 },
  tabLabel: { ...typography.bodyBold, fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  signedOut: { flex: 1, justifyContent: 'center', padding: spacing.lg },

  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 120 },
  cardBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  cardImageBody: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.sm },
  cardImageTitle: { ...typography.h3, fontSize: 16, color: colors.white, fontWeight: '800' },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  cardMeta: { ...typography.caption, fontSize: 12 },
});
