import React from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography, shadows } from "../../lib/theme";
import {
  categories,
  getFeaturedEvents,
  getUpcomingEvents,
} from "../../lib/mock-data";
import EventCard from "../../components/EventCard";

export default function HomeScreen() {
  const router = useRouter();
  const featured = getFeaturedEvents();
  const upcoming = getUpcomingEvents().slice(0, 6);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Abebe 👋</Text>
            <Text style={styles.subtitle}>Discover events near you</Text>
          </View>
          <Pressable style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Featured Events Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Events</Text>
          <FlatList
            data={featured}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md }}
            renderItem={({ item }) => <EventCard event={item} variant="featured" />}
          />
        </View>

        {/* Category Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => router.push("/discover")}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + "15" }]}>
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={cat.color}
                  />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={styles.categoryCount}>{cat.eventCount} events</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <Pressable onPress={() => router.push("/discover")}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      </ScrollView>
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
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: {
    ...typography.h1,
    color: colors.foreground,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: 2,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  seeAll: {
    ...typography.bodyBold,
    color: colors.primary,
    paddingHorizontal: spacing.md,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryItem: {
    width: "22%",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryName: {
    ...typography.small,
    color: colors.foreground,
    fontWeight: "600",
    textAlign: "center",
  },
  categoryCount: {
    ...typography.small,
    color: colors.muted,
    fontSize: 10,
  },
});
