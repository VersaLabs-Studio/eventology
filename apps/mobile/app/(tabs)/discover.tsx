/**
 * Eventology Mobile — Discover Tab
 * Hero header, horizontal category filter, sort row, and a 2-col
 * grid of EventCards. Initial render shows 6 skeleton cards for
 * 300ms (mock loading) before revealing the real data.
 *
 * Mock data only — the `onEndReached` handler logs a placeholder
 * comment instead of triggering real pagination.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import CategoryChip from "../../components/CategoryChip";
import EmptyState from "../../components/EmptyState";
import EventCard from "../../components/EventCard";
import { SORT_OPTIONS, type SortOptionMeta } from "../../lib/constants";
import { categories, events, type Category } from "../../lib/mock-data";
import { colors, radius, spacing, typography } from "../../lib/theme";
import type { Event, SortOption } from "../../lib/types";

// ─── Synthetic "All" category used as the default filter chip ────────────────
const ALL_CATEGORY: Category = {
  id: "all",
  name: "All",
  slug: "all",
  icon: "apps-outline",
  description: "All categories",
  eventCount: 0,
  color: colors.primary,
};

const FILTERABLE_CATEGORIES: readonly Category[] = [ALL_CATEGORY, ...categories];

// ─── Inline Sort Pill (segmented control — no new dep) ──────────────────────
interface SortPillProps {
  option: SortOptionMeta;
  active: boolean;
  onPress: () => void;
}

function SortPill({ option, active, onPress }: SortPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.sortPill, active && styles.sortPillActive]}
    >
      <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>
        {option.label}
      </Text>
    </Pressable>
  );
}

// ─── Inline Skeleton Card (pulsing placeholder) ─────────────────────────────
function SkeletonCard() {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.skeletonCard, animatedStyle]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonPill} />
        <View style={[styles.skeletonLine, { width: "85%" }]} />
        <View style={[styles.skeletonLine, { width: "60%" }]} />
        <View style={[styles.skeletonLine, { width: "75%" }]} />
      </View>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function DiscoverScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("trending");

  // Initial mount only — 300ms mock loading per spec.
  useEffect(() => {
    const handle = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(handle);
  }, []);

  // Derived: filtered + sorted events.
  const visible = useMemo<Event[]>(() => {
    const filtered =
      selectedCategoryId === "all"
        ? events
        : events.filter((e) => e.category.id === selectedCategoryId);

    const copy = [...filtered];
    switch (sortOption) {
      case "trending":
        copy.sort((a, b) => b.views - a.views);
        return copy;
      case "upcoming":
        copy.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        return copy;
      case "free":
        return copy.filter((e) => e.ticketType === "free");
      case "paid":
        return copy.filter((e) => e.ticketType === "paid");
    }
  }, [selectedCategoryId, sortOption]);

  // MOCK: this is mock data — no real pagination exists. In production
  // this would dispatch a fetch for the next page of events.
  const handleEndReached = () => {
    console.log(
      "[Discover] onEndReached — mock data, no real pagination in V1"
    );
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<Event>) => (
    <Animated.View
      entering={FadeIn.delay(index * 40).duration(280)}
      style={styles.listCell}
    >
      <EventCard event={item} />
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.heroTitle}>Discover</Text>
        <Text style={styles.heroSubtitle}>Find events you'll love</Text>
      </View>

      <View style={styles.chipsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          {FILTERABLE_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              selected={selectedCategoryId === cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <SortPill
            key={opt.value}
            option={opt}
            active={sortOption === opt.value}
            onPress={() => setSortOption(opt.value)}
          />
        ))}
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          numColumns={2}
          keyExtractor={(item) => `skel-${item}`}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.listRow}
          renderItem={() => (
            <View style={styles.listCell}>
              <SkeletonCard />
            </View>
          )}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No events found"
          description="Try a different category or sort option."
        />
      ) : (
        <FlatList
          data={visible}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.listRow}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  heroTitle: {
    ...typography.display,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.muted,
  },

  chipsRow: {
    paddingBottom: spacing.md,
  },
  chipsContent: {
    paddingHorizontal: spacing.lg,
  },

  sortRow: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  sortPill: {
    flex: 1,
    minHeight: 44,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sortPillActive: {
    backgroundColor: colors.primary,
  },
  sortPillText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: "600",
  },
  sortPillTextActive: {
    color: colors.white,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  listRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  listCell: { flex: 1 },

  // Skeleton
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonImage: {
    width: "100%",
    height: 120,
    backgroundColor: colors.border,
  },
  skeletonBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  skeletonPill: {
    width: 60,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  skeletonLine: {
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
});
