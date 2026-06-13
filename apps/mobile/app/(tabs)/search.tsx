// ============================================================================
// Search screen
// ============================================================================
// Keyword + category filter. Reuses the public events endpoint. The
// /api/public/search/interpret NLP endpoint is called when the user types
// 2+ chars to expand the query (best-effort — silently degrades).
// ============================================================================

import React from 'react';
import { FlatList, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { EmptyState } from '@/components/EmptyState';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface EventsResponse {
  data: MobileEvent[];
  meta: { total: number; page: number; limit: number };
}

interface InterpretResponse {
  interpreted: { search?: string; category?: string; date?: string };
}

async function fetchEvents(query: string, category: string): Promise<EventsResponse> {
  return api.get<EventsResponse>('/api/public/events', {
    query: { search: query, category: category, limit: 30, sort: 'date-desc' },
  });
}

async function interpretQuery(q: string): Promise<InterpretResponse | null> {
  try {
    return await api.post<InterpretResponse>('/api/public/search/interpret', { query: q });
  } catch {
    return null;
  }
}

export default function SearchScreen(): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [debounced, setDebounced] = React.useState('');

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  // NLP interpret when typing 2+ chars (best-effort)
  React.useEffect(() => {
    if (debounced.length < 2) {
      setCategory('');
      return;
    }
    let cancelled = false;
    void interpretQuery(debounced).then((res) => {
      if (cancelled || !res?.interpreted) return;
      if (res.interpreted.category) setCategory(res.interpreted.category);
    });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const eventsQ = useQuery({
    queryKey: ['events', 'search', debounced, category],
    queryFn: () => fetchEvents(debounced, category),
    staleTime: 10_000,
  });

  const events = eventsQ.data?.data ?? [];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? colors.surfaceDark : colors.surface,
              borderColor: isDark ? colors.borderDark : colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={isDark ? colors.textMutedDark : colors.textMuted} />
          <TextInput
            style={[styles.input, { color: isDark ? colors.textDark : colors.text }]}
            placeholder="Search events, organizers, tags..."
            placeholderTextColor={isDark ? colors.textMutedDark : colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color={isDark ? colors.textMutedDark : colors.textMuted}
              onPress={() => {
                setQuery('');
                setCategory('');
              }}
            />
          )}
        </View>
        {category.length > 0 && (
          <View style={styles.filterChipRow}>
            <Text style={[styles.filterChipLabel, { color: isDark ? colors.textMutedDark : colors.textMuted }]}>
              Category: {category}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} onPress={() => {/* TODO: open event detail in P18 */}} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          eventsQ.isLoading ? (
            <View style={{ padding: spacing.md, gap: spacing.sm }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height={120} radius={16} />
              ))}
            </View>
          ) : debounced.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Search events"
              description="Find tech meetups, concerts, business forums, and more across Addis Ababa."
            />
          ) : (
            <EmptyState
              icon="alert-circle-outline"
              title="No results"
              description={`No events match "${debounced}". Try a different keyword.`}
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
  searchWrap: { padding: spacing.md, gap: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
  },
  input: { flex: 1, ...typography.body, fontSize: 15, paddingVertical: 0 },
  filterChipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filterChipLabel: { ...typography.small, fontSize: 11 },
  list: { padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xl },
});
