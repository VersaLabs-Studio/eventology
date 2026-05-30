import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography } from "../../lib/theme";
import { events, categories, searchEvents, getEventsByCategory } from "../../lib/mock-data";
import type { Event } from "../../lib/mock-data";
import EventCard from "../../components/EventCard";
import CategoryChip from "../../components/CategoryChip";
import EmptyState from "../../components/EmptyState";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const results: Event[] = useMemo(() => {
    let filtered: Event[];

    if (query.trim().length > 0) {
      filtered = searchEvents(query);
    } else {
      filtered = events;
    }

    if (selectedCategory) {
      filtered = filtered.filter((e) => e.category.slug === selectedCategory);
    }

    return filtered;
  }, [query, selectedCategory]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, organizers, venues..."
            placeholderTextColor={colors.mutedLight}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <View
              onTouchEnd={() => setQuery("")}
              // eslint-disable-next-line react/no-children-prop
            >
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </View>
          )}
        </View>

        {/* Category Filters */}
        <View style={styles.filterSection}>
          <FlatList
            data={[{ id: "all", name: "All", slug: "all", icon: "grid-outline", description: "", eventCount: events.length, color: colors.primary }, ...categories]}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md }}
            renderItem={({ item }) => (
              <CategoryChip
                category={item}
                selected={
                  item.slug === "all"
                    ? selectedCategory === null
                    : selectedCategory === item.slug
                }
                onPress={() =>
                  setSelectedCategory(item.slug === "all" ? null : item.slug)
                }
              />
            )}
          />
        </View>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No results found"
              description="Try a different search term or category."
            />
          }
          renderItem={({ item }) => <EventCard event={item} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.foreground,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.foreground,
    padding: 0,
  },
  filterSection: {
    paddingVertical: spacing.sm,
  },
  resultsHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  resultsCount: {
    ...typography.caption,
    color: colors.muted,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
