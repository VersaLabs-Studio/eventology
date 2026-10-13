// ============================================================================
// CategoryGrid — 2-column category tiles (Home multi-rail redesign)
// ============================================================================
// Replaces the old single-row category pills with a richer 2-column grid of
// category tiles, each tinted by its own colour and carrying its icon. Tapping
// a tile routes to /search?category=slug. Data comes from the existing
// GET /api/public/categories endpoint (shared with the old pill rail).
//
// The grid lives inside the Home FlatList header, so it is a plain View grid
// (not a nested VirtualizedList) — satisfies the "no nested vertical lists"
// constraint.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { categoryColor, categoryIcon, type CategoryLike } from '@/lib/category';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, shadows, spacing, typography } from '@/lib/theme';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface CategoriesResponse {
  data: Category[];
}

interface CategoryGridProps {
  onOpenCategory: (slug: string) => void;
}

export function CategoryGrid({ onOpenCategory }: CategoryGridProps): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();

  const categoriesQ = useQuery<CategoriesResponse>({
    queryKey: ['categories', 'list'],
    queryFn: () => api.get<CategoriesResponse>('/api/public/categories'),
    staleTime: 5 * 60_000,
  });

  const categories = categoriesQ.data?.data ?? [];

  if (categoriesQ.isLoading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={72} radius={radius.lg} />
        ))}
      </View>
    );
  }

  if (categories.length === 0) return <View />;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: p.text }]}>{t('home.browseCategories')}</Text>
      <View style={styles.grid}>
        {categories.map((c) => {
          const cat: CategoryLike = { slug: c.slug, color: c.color };
          const tint = categoryColor(cat);
          return (
            <Pressable
              key={c.id}
              onPress={() => onOpenCategory(c.slug)}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: p.surface, borderColor: p.border },
                shadows.sm,
                pressed ? { opacity: 0.92 } : null,
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${tint}1A` }]}>
                <Ionicons name={categoryIcon(c.slug)} size={18} color={tint} />
              </View>
              <Text style={[styles.label, { color: p.text }]} numberOfLines={1}>
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  heading: { ...typography.h2, paddingHorizontal: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  tile: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.bodyBold, fontSize: 14, fontWeight: '700', flex: 1, minWidth: 0 },
});
