// ============================================================================
// Discover (Home) screen
// ============================================================================
// Loads /api/public/events on focus. Shows a hero "Featured" carousel-like
// section (top 3 featured), then a sectioned "Upcoming events" list.
// ============================================================================

import React from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/lib/i18n';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';

interface EventsResponse {
  data: MobileEvent[];
  meta: { total: number; page: number; limit: number };
}

async function fetchEvents(): Promise<EventsResponse> {
  return api.get<EventsResponse>('/api/public/events', {
    query: { sort: 'date-desc', limit: 30 },
  });
}

export default function DiscoverScreen(): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { t } = useLocale();
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['events', 'discover'],
    queryFn: fetchEvents,
  });

  const events = query.data?.data ?? [];
  const featured = events.filter((e) => e.is_featured).slice(0, 5);
  const upcoming = events.filter((e) => !featured.includes(e)).slice(0, 20);

  return (
      <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <FlatList
        data={upcoming}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} onPress={() => {/* TODO: open event detail in P18 */}} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.greeting}>
              <Text style={[styles.greetingText, { color: isDark ? colors.textDark : colors.text }]}>
                {user ? `Hi, ${(user as { name?: string }).name ?? 'there'}` : t('nav.home')}
              </Text>
              <Text style={[styles.tagline, { color: isDark ? colors.textMutedDark : colors.textMuted }]}>
                {t('common.appName')} · {t('common.tagline')}
              </Text>
            </View>

            {query.isLoading && (
              <View style={styles.section}>
                <Skeleton height={180} radius={16} style={{ marginBottom: spacing.md }} />
                <View style={{ gap: spacing.sm }}>
                  <Skeleton height={120} radius={16} />
                  <Skeleton height={120} radius={16} />
                </View>
              </View>
            )}

            {!query.isLoading && featured.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
                  {t('events.featured')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRow}
                >
                  {featured.map((event) => (
                    <View key={event.id} style={styles.featuredItem}>
                      <EventCard event={event} onPress={() => {/* TODO: open event detail in P18 */}} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {!query.isLoading && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
                  {t('events.upcoming')}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          query.isLoading ? null : (
            <EmptyState
              icon="calendar-outline"
              title="No events yet"
              description="Check back soon — events are being added."
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />
        }
      />
        </SafeAreaView>
      </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingBottom: spacing.xl, gap: spacing.md },
  header: { padding: spacing.md, gap: spacing.lg },
  greeting: { gap: 2 },
  greetingText: { ...typography.h1 },
  tagline: { ...typography.caption },
  section: { gap: spacing.md },
  sectionTitle: { ...typography.h2 },
  featuredRow: { gap: spacing.md, paddingRight: spacing.md },
  featuredItem: { width: 280 },
});
