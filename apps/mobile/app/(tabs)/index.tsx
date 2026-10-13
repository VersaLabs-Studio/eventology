// ============================================================================
// Discover (Home) screen — multi-rail curated redesign (HO-2)
// ============================================================================
// Replaces the single flat grid with a sectioned, streaming-style home:
//
//   brand row → greeting → search → quick-filter chips → featured hero
//   carousel → themed horizontal rails → category grid → "All upcoming" grid
//
// Each rail owns its own useQuery (see components/home/EventRail.tsx) and
// skeletons/fails independently — a failing or empty rail hides itself and
// never blanks the page. The outer scroll is a single parent FlatList whose
// data is the "All upcoming" grid; its ListHeaderComponent holds the hero,
// chips, rails, and category grid. Horizontal rails are ScrollViews inside
// the header (allowed). No nested vertical VirtualizedLists.
//
// Greeting reflects time of day + first name; degrades gracefully when
// signed out. Pull-to-refresh refetches the grid and invalidates rail queries.

import React from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { Logo } from '@/components/ui/Logo';
import { EventRail } from '@/components/home/EventRail';
import { QuickFilters } from '@/components/home/QuickFilters';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { RecommendationRail } from '@/components/ai/RecommendationRail';
import { NearbyRail } from '@/components/NearbyRail';
import { usePalette } from '@/lib/palette';
import { useLocale } from '@/lib/i18n';
import { colors, radius, shadows, spacing, typography } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_WIDTH = Math.round(SCREEN_WIDTH * 0.82);
const FEATURED_GAP = spacing.md;

interface EventsResponse {
  data: MobileEvent[];
  meta: { total: number; page: number; limit: number };
}

async function fetchUpcoming(): Promise<EventsResponse> {
  return api.get<EventsResponse>('/api/public/events', {
    query: { date: 'upcoming', sort: 'date-asc', limit: 20 },
  });
}

async function fetchFeatured(): Promise<EventsResponse> {
  return api.get<EventsResponse>('/api/public/events', {
    query: { featured: 'true', limit: 6 },
  });
}

/** Local time-of-day greeting key — name is concatenated outside t(). */
function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'home.greetingMorning';
  if (h < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

export default function DiscoverScreen(): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const upcomingQ = useQuery({
    queryKey: ['home', 'upcoming'],
    queryFn: fetchUpcoming,
  });

  const featuredQ = useQuery({
    queryKey: ['home', 'featured'],
    queryFn: fetchFeatured,
    staleTime: 30_000,
  });

  const upcoming = upcomingQ.data?.data ?? [];
  const featured = featuredQ.data?.data ?? [];

  const firstName = (user as { name?: string } | null)?.name?.split(' ')[0];
  const loading = upcomingQ.isLoading;

  const onRefresh = React.useCallback(() => {
    void upcomingQ.refetch();
    // Invalidate every home rail query so they re-fetch too.
    void qc.invalidateQueries({ queryKey: ['home', 'rail'] });
    void qc.invalidateQueries({ queryKey: ['categories', 'list'] });
  }, [qc, upcomingQ]);

  const openEvent = (slug: string) => router.push(`/event/${slug}` as never);
  const openSearch = (query: string) => router.push(`/search${query}` as never);

  const header = (
    <View style={styles.header}>
      {/* Brand row */}
      <View style={styles.brandRow}>
        <Logo size="sm" />
        <Pressable
          onPress={() => router.push('/notifications' as never)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={[styles.iconButton, { backgroundColor: p.surface, borderColor: p.border }]}
        >
          <Ionicons name="notifications-outline" size={19} color={p.text} />
        </Pressable>
      </View>

      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: p.text }]}>
          {firstName ? `${t(greetingKey())}, ${firstName}` : t('nav.home')}
        </Text>
        <Text style={[styles.tagline, { color: p.textMuted }]}>
          {t('common.tagline')}
        </Text>
      </View>

      {/* Search affordance — routes to the real search tab */}
      <Pressable
        onPress={() => router.push('/search' as never)}
        accessibilityRole="search"
        style={[styles.searchBar, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}
      >
        <Ionicons name="search" size={18} color={p.textMuted} />
        <Text style={[styles.searchText, { color: p.textSubtle }]} numberOfLines={1}>
          Search events, organizers, tags…
        </Text>
      </Pressable>

      {/* Quick-filter chips (navigational) */}
      <QuickFilters />

      {/* Featured hero carousel */}
      {featuredQ.isLoading ? (
        <View style={styles.section}>
          <Skeleton height={300} radius={radius.xl} />
        </View>
      ) : featured.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitlePad, { color: p.text }]}>
            {t('home.rails.featured')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={FEATURED_WIDTH + FEATURED_GAP}
            snapToAlignment="start"
            contentContainerStyle={styles.featuredRow}
          >
            {featured.map((event) => (
              <View key={event.id} style={{ width: FEATURED_WIDTH }}>
                <EventCard
                  event={event}
                  variant="featured"
                  onPress={() => openEvent(event.slug)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Themed horizontal rails — each owns its query + skeleton + hide-on-empty */}
      <EventRail
        titleKey="home.rails.thisWeek"
        icon="calendar-outline"
        queryKey={['this-week']}
        params={{ date: 'this-week', sort: 'date-asc', limit: 10 }}
        onOpenEvent={openEvent}
        onSeeAll={() => openSearch('?date=this-week&sort=date-asc')}
      />
      <EventRail
        titleKey="home.rails.popular"
        icon="trending-up-outline"
        queryKey={['popular']}
        params={{ sort: 'popular', limit: 10 }}
        onOpenEvent={openEvent}
        onSeeAll={() => openSearch('?sort=popular')}
      />
      <EventRail
        titleKey="home.rails.free"
        icon="pricetag-outline"
        tone="ember"
        queryKey={['free']}
        params={{ price: 'free', sort: 'date-asc', limit: 10 }}
        onOpenEvent={openEvent}
        onSeeAll={() => openSearch('?price=free&sort=date-asc')}
      />

      {/* Near you — existing opt-in GPS proximity rail */}
      <NearbyRail onOpen={openEvent} />

      {/* For you — signed-in AI recommendations */}
      <RecommendationRail events={upcoming} onOpen={openEvent} />

      {/* Category grid */}
      <CategoryGrid onOpenCategory={(slug) => openSearch(`?category=${slug}`)} />

      {/* All-upcoming heading */}
      {!loading && upcoming.length > 0 ? (
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: p.text }]}>{t('home.rails.allUpcoming')}</Text>
          <Text style={[styles.sectionCount, { color: p.textMuted }]}>
            {upcomingQ.data?.meta?.total ?? upcoming.length}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <EventCard event={item} onPress={() => openEvent(item.slug)} />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={upcomingQ.isFetching && !upcomingQ.isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={header}
          ListEmptyComponent={
            loading ? null : upcomingQ.error ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="Couldn't load events"
                description="Check your connection and pull down to retry."
              />
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="No events yet"
                description="Check back soon — events are being added."
              />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  list: { paddingBottom: spacing.xxl },
  gridItem: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },

  header: { gap: spacing.lg, paddingBottom: spacing.md },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greeting: { gap: 3, paddingHorizontal: spacing.md },
  greetingText: { ...typography.display },
  tagline: { ...typography.body, fontSize: 14 },

  searchBar: {
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchText: { ...typography.body, fontSize: 14, flex: 1 },

  section: { gap: spacing.md },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  sectionTitle: { ...typography.h2 },
  /** Only for section titles that aren't already inside a padded row. */
  sectionTitlePad: { paddingHorizontal: spacing.md },
  sectionCount: { ...typography.caption },
  featuredRow: { gap: FEATURED_GAP, paddingHorizontal: spacing.md },
});
