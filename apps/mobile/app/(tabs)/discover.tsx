import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { colors, spacing, typography } from "../../lib/theme";
import { events, categories, getEventsByCategory } from "../../lib/mock-data";
import type { Event } from "../../lib/mock-data";
import EventCard from "../../components/EventCard";
import CategoryChip from "../../components/CategoryChip";
import EmptyState from "../../components/EmptyState";

export default function DiscoverScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredEvents: Event[] = selectedCategory
    ? getEventsByCategory(selectedCategory)
    : events;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
          </Text>
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

        {/* Event List */}
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No events found"
              description="Try selecting a different category or check back later."
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
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: 2,
  },
  filterSection: {
    paddingVertical: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
