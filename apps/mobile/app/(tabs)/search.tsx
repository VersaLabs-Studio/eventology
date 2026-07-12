// ============================================================================
// Search screen
// ============================================================================
// Keyword + faceted filtering over the public events endpoint. Beyond the
// category rail, a collapsible panel exposes the facets the API already
// supports — sort, date window, price, and event type — plus active-filter
// chips and a live result count.
//
// The /api/public/search/interpret NLP endpoint expands a free-text query into
// a category (and surfaces its understood intent as a hint) when the user types
// 2+ chars. It is best-effort: a failure or slow response never blocks search.
// ============================================================================

import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { interpretSearch } from '@/lib/ai';
import { Skeleton } from '@/components/ui/Skeleton';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { usePalette } from '@/lib/palette';
import { useLocale } from '@/lib/i18n';
import { colors, radius, shadows, spacing, typography } from '@/lib/theme';

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

interface Facets {
  search: string;
  category: string;
  sort: string;
  price: string;
  date: string;
  type: string;
}

const EVENT_TYPES = [
  'conference',
  'workshop',
  'meetup',
  'seminar',
  'networking',
  'concert',
  'exhibition',
  'training',
] as const;

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function fetchEvents(f: Facets): Promise<EventsResponse> {
  return api.get<EventsResponse>('/api/public/events', {
    query: {
      search: f.search,
      category: f.category,
      sort: f.sort,
      price: f.price || undefined,
      date: f.date || undefined,
      type: f.type || undefined,
      limit: 30,
    },
  });
}

async function fetchCategories(): Promise<{ data: Category[] }> {
  return api.get<{ data: Category[] }>('/api/public/categories');
}

export default function SearchScreen(): React.ReactElement {
  const p = usePalette();
  const router = useRouter();
  const { t } = useLocale();

  const [query, setQuery] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  // Facets
  const [sort, setSort] = React.useState('date-desc');
  const [price, setPrice] = React.useState('');
  const [dateWindow, setDateWindow] = React.useState('');
  const [eventType, setEventType] = React.useState('');
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // AI understood-intent hint (surfaced from the interpret endpoint).
  const [aiIntent, setAiIntent] = React.useState('');

  /** A category the user tapped vs one the NLP endpoint guessed. */
  const [categoryPinned, setCategoryPinned] = React.useState(false);

  /** Held in a ref so a late categories fetch doesn't re-fire the AI call. */
  const categoriesRef = React.useRef<Category[]>([]);

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  React.useEffect(() => {
    if (debounced.length < 2) {
      setAiIntent('');
      if (!categoryPinned) setCategory('');
      return;
    }
    let cancelled = false;
    void interpretSearch(debounced).then((res) => {
      if (cancelled) return;
      setAiIntent(res.data?.intent ?? '');
      if (categoryPinned) return;
      const guesses = res.data?.filters?.categories ?? [];
      if (guesses.length === 0) return;
      const cats = categoriesRef.current;
      for (const g of guesses) {
        const gl = g.toLowerCase();
        const match = cats.find((c) => c.slug.toLowerCase() === gl || c.name.toLowerCase() === gl);
        if (match) {
          setCategory(match.slug);
          return;
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [debounced, categoryPinned]);

  const categoriesQ = useQuery({
    queryKey: ['categories', 'list'],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });

  const facets: Facets = { search: debounced, category, sort, price, date: dateWindow, type: eventType };

  const eventsQ = useQuery({
    queryKey: ['events', 'search', debounced, category, sort, price, dateWindow, eventType],
    queryFn: () => fetchEvents(facets),
    staleTime: 10_000,
  });

  const events = eventsQ.data?.data ?? [];
  const categories = categoriesQ.data?.data ?? [];
  categoriesRef.current = categories;
  const total = eventsQ.data?.meta?.total ?? events.length;

  const facetCount = (price ? 1 : 0) + (dateWindow ? 1 : 0) + (eventType ? 1 : 0);
  const hasFilter = debounced.length > 0 || category.length > 0 || facetCount > 0;

  const onSelectCategory = (slug: string) => {
    const next = category === slug ? '' : slug;
    setCategory(next);
    setCategoryPinned(next !== '');
  };

  const clearAll = () => {
    setQuery('');
    setCategory('');
    setCategoryPinned(false);
    setPrice('');
    setDateWindow('');
    setEventType('');
    setSort('date-desc');
  };

  const sortOptions = [
    { value: 'date-desc', label: t('search.sortNewest') },
    { value: 'date-asc', label: t('search.sortSoonest') },
    { value: 'popular', label: t('search.sortPopular') },
  ];
  const whenOptions = [
    { value: '', label: t('search.anyTime') },
    { value: 'today', label: t('search.today') },
    { value: 'this-week', label: t('search.thisWeek') },
    { value: 'this-month', label: t('search.thisMonth') },
  ];
  const priceOptions = [
    { value: '', label: t('search.anyPrice') },
    { value: 'free', label: t('search.free') },
    { value: 'paid', label: t('search.paid') },
  ];
  const typeOptions = [
    { value: '', label: t('search.anyType') },
    ...EVENT_TYPES.map((v) => ({ value: v, label: titleCase(v) })),
  ];

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScreenHeader
          title={t('search.title')}
          subtitle={hasFilter ? `${total} ${total === 1 ? t('search.result') : t('search.results')}` : t('search.subtitle')}
          action={
            hasFilter ? (
              <Pressable onPress={clearAll} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.clear, { color: colors.primary }]}>{t('search.clear')}</Text>
              </Pressable>
            ) : null
          }
        />

        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: p.surface,
                borderColor: focused ? colors.primary : p.border,
                borderWidth: focused ? 1.5 : 1,
              },
              shadows.sm,
            ]}
          >
            <Ionicons name="search" size={18} color={focused ? colors.primary : p.textMuted} />
            <TextInput
              style={[styles.input, { color: p.text }]}
              placeholder={t('search.placeholder')}
              placeholderTextColor={p.textSubtle}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel={t('search.clear')}>
                <Ionicons name="close-circle" size={18} color={p.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {/* AI understood-intent hint */}
          {aiIntent ? (
            <View style={[styles.aiHint, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}33` }]}>
              <Ionicons name="sparkles" size={12} color={colors.primary} />
              <Text style={[styles.aiHintText, { color: colors.primary }]} numberOfLines={1}>
                {t('search.aiUnderstood')}: {aiIntent}
              </Text>
            </View>
          ) : null}

          {/* Filters toggle */}
          <View style={styles.filterBar}>
            <Pressable
              onPress={() => setFiltersOpen((v) => !v)}
              style={[
                styles.filterToggle,
                { backgroundColor: filtersOpen || facetCount > 0 ? colors.primary : p.surface, borderColor: filtersOpen || facetCount > 0 ? colors.primary : p.border },
              ]}
              accessibilityRole="button"
            >
              <Ionicons name="options-outline" size={15} color={filtersOpen || facetCount > 0 ? colors.white : p.textMuted} />
              <Text style={[styles.filterToggleText, { color: filtersOpen || facetCount > 0 ? colors.white : p.textMuted }]}>
                {t('search.filters')}
                {facetCount > 0 ? ` · ${facetCount}` : ''}
              </Text>
              <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={14} color={filtersOpen || facetCount > 0 ? colors.white : p.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Collapsible filter panel */}
        {filtersOpen ? (
          <ScrollView style={styles.panel} contentContainerStyle={styles.panelBody} keyboardShouldPersistTaps="handled">
            <FilterGroup label={t('search.sortBy')} options={sortOptions} value={sort} onChange={(v) => setSort(v || 'date-desc')} allowEmpty={false} />
            <FilterGroup label={t('search.when')} options={whenOptions} value={dateWindow} onChange={setDateWindow} />
            <FilterGroup label={t('search.price')} options={priceOptions} value={price} onChange={setPrice} />
            <FilterGroup label={t('search.type')} options={typeOptions} value={eventType} onChange={setEventType} />
          </ScrollView>
        ) : null}

        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.railRow}
            style={styles.rail}
          >
            {categories.map((c) => (
              <CategoryPill
                key={c.id}
                label={c.name}
                category={c}
                showIcon
                selected={category === c.slug}
                onPress={() => onSelectCategory(c.slug)}
              />
            ))}
          </ScrollView>
        ) : null}

        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} variant="horizontal" onPress={() => router.push(`/event/${item.slug}`)} />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            eventsQ.isLoading ? (
              <View style={{ gap: spacing.md }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={132} radius={radius.lg} />
                ))}
              </View>
            ) : !hasFilter ? (
              <EmptyState
                icon="search-outline"
                title={t('search.emptyTitle')}
                description={t('search.emptyBody')}
              />
            ) : (
              <EmptyState
                icon="alert-circle-outline"
                title={t('search.noResults')}
                description={
                  debounced
                    ? `${t('search.noResultsQuery')} "${debounced}".`
                    : t('search.noResultsCategory')
                }
                action={{ label: t('search.clearFilters'), onClick: clearAll }}
              />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
  allowEmpty = true,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}): React.ReactElement {
  const p = usePalette();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupLabel, { color: p.textMuted }]}>{label}</Text>
      <View style={styles.groupPills}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <Pressable
              key={o.value || 'all'}
              onPress={() => onChange(active && allowEmpty ? '' : o.value)}
              style={[
                styles.fpill,
                {
                  backgroundColor: active ? colors.primary : p.surfaceMuted,
                  borderColor: active ? colors.primary : p.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.fpillText, { color: active ? colors.white : p.textMuted }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  clear: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    height: 48,
  },
  input: { flex: 1, ...typography.body, fontSize: 15, paddingVertical: 0 },

  aiHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  aiHintText: { ...typography.caption, fontSize: 12, fontWeight: '600', flexShrink: 1 },

  filterBar: { flexDirection: 'row' },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterToggleText: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },

  panel: { maxHeight: 260, flexGrow: 0 },
  panelBody: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.md },
  group: { gap: spacing.xs + 2 },
  groupLabel: { ...typography.small, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  groupPills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  fpill: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1 },
  fpillText: { ...typography.caption, fontSize: 12, fontWeight: '600' },

  rail: { flexGrow: 0 },
  railRow: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  list: { padding: spacing.md, paddingTop: spacing.xs, gap: spacing.md, paddingBottom: spacing.xxl },
});
