// ============================================================================
// Discover (Home) screen
// ============================================================================
// Mirrors the web landing page's information architecture:
//   brand row → greeting → search affordance → category rail →
//   featured carousel → upcoming list.
//
// Selecting a category re-queries the server rather than filtering the loaded
// page, so the list isn't silently capped at whatever the first 30 rows held.
// The featured carousel hides while a category filter is active — the web does
// the same, because "featured" is a global editorial slot, not a per-category one.
// ============================================================================

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
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { RecommendationRail } from '@/components/ai/RecommendationRail';
import { Logo } from '@/components/ui/Logo';
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

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface CategoriesResponse {
  data: Category[];
}

async function fetchEvents(category: string): Promise<EventsResponse> {
  return api.get<EventsResponse>('/api/public/events', {
    query: { sort: 'date-desc', limit: 30, ...(category ? { category } : {}) },
  });
}

async function fetchCategories(): Promise<CategoriesResponse> {
  return api.get<CategoriesResponse>('/api/public/categories');
}

export default function DiscoverScreen(): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();

  const [category, setCategory] = React.useState('');

  const eventsQ = useQuery({
    queryKey: ['events', 'discover', category],
    queryFn: () => fetchEvents(category),
  });

  const categoriesQ = useQuery({
    queryKey: ['categories', 'list'],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });

  const events = eventsQ.data?.data ?? [];
  const categories = categoriesQ.data?.data ?? [];

  const featured = category ? [] : events.filter((e) => e.is_featured).slice(0, 5);
  const featuredIds = new Set(featured.map((e) => e.id));
  const upcoming = events.filter((e) => !featuredIds.has(e.id));

  const firstName = (user as { name?: string } | null)?.name?.split(' ')[0];
  const loading = eventsQ.isLoading;

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <EventCard event={item} onPress={() => router.push(`/event/${item.slug}`)} />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={eventsQ.isFetching && !eventsQ.isLoading}
              onRefresh={() => void eventsQ.refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              {/* Brand row */}
              <View style={styles.brandRow}>
                <Logo size="sm" />
                <Pressable
                  onPress={() => router.push('/notifications')}
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
                  {firstName ? `Hi, ${firstName}` : t('nav.home')}
                </Text>
                <Text style={[styles.tagline, { color: p.textMuted }]}>
                  {t('common.tagline')}
                </Text>
              </View>

              {/* Search affordance — routes to the real search tab */}
              <Pressable
                onPress={() => router.push('/search')}
                accessibilityRole="search"
                style={[styles.searchBar, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}
              >
                <Ionicons name="search" size={18} color={p.textMuted} />
                <Text style={[styles.searchText, { color: p.textSubtle }]} numberOfLines={1}>
                  Search events, organizers, tags…
                </Text>
              </Pressable>

              {/* Category rail */}
              {categories.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.railRow}
                >
                  <CategoryPill
                    label="All"
                    selected={category === ''}
                    onPress={() => setCategory('')}
                    category={{ slug: 'business' }}
                  />
                  {categories.map((c) => (
                    <CategoryPill
                      key={c.id}
                      label={c.name}
                      category={c}
                      showIcon
                      selected={category === c.slug}
                      onPress={() => setCategory(category === c.slug ? '' : c.slug)}
                    />
                  ))}
                </ScrollView>
              ) : null}

              {loading ? (
                <View style={[styles.section, styles.sectionTitlePad]}>
                  <Skeleton height={300} radius={radius.xl} />
                  <Skeleton height={22} width="45%" />
                  <Skeleton height={260} radius={radius.lg} />
                </View>
              ) : null}

              {/* AI recommendations — signed-in users, unfiltered view only.
                  Resolves against the loaded events, so it's hidden while a
                  category filter narrows the set. */}
              {!loading && category === '' ? (
                <RecommendationRail
                  events={events}
                  onOpen={(slug) => router.push(`/event/${slug}`)}
                />
              ) : null}

              {/* Featured carousel */}
              {!loading && featured.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, styles.sectionTitlePad, { color: p.text }]}>
                    {t('events.featured')}
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
                          onPress={() => router.push(`/event/${event.slug}`)}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* Upcoming heading */}
              {!loading && upcoming.length > 0 ? (
                <View style={styles.sectionHeading}>
                  <Text style={[styles.sectionTitle, { color: p.text }]}>{t('events.upcoming')}</Text>
                  <Text style={[styles.sectionCount, { color: p.textMuted }]}>
                    {eventsQ.data?.meta?.total ?? upcoming.length}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            loading ? null : eventsQ.error ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="Couldn't load events"
                description="Check your connection and pull down to retry."
              />
            ) : (
              <EmptyState
                icon="calendar-outline"
                title={category ? 'Nothing in this category yet' : 'No events yet'}
                description={
                  category
                    ? 'Try another category — new events are added weekly.'
                    : 'Check back soon — events are being added.'
                }
                action={category ? { label: 'Show all events', onClick: () => setCategory('') } : undefined}
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

  railRow: { gap: spacing.sm, paddingHorizontal: spacing.md },

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
