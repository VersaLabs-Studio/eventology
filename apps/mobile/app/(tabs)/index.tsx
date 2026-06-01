import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { categories, events, mockUser } from "../../lib/mock-data";
import { colors, radius, shadows, spacing, typography } from "../../lib/theme";

import {
  CategoryChip,
  EmptyState,
  EventCard,
  SearchBar,
  SectionHeader,
} from "../../components";

// ─── Derived data (static — no state needed) ─────────────────────────────────

const featuredEvents = events.filter((e) => e.isFeatured);

const upcomingThisWeek = events
  .filter((e) => {
    const d = new Date(e.date).getTime();
    const now = Date.now();
    const week = now + 7 * 24 * 60 * 60 * 1000;
    return d >= now && d <= week;
  })
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  .slice(0, 5);

// "Recommended" = anything not in the hero rail (featured) or the upcoming
// rail, capped at 6. Real recommendation logic arrives in a later task.
const usedIds = new Set<string>([
  ...featuredEvents.map((e) => e.id),
  ...upcomingThisWeek.map((e) => e.id),
]);
const recommendedEvents = events.filter((e) => !usedIds.has(e.id)).slice(0, 5);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getFirstName(fullName: string): string {
  const first = fullName.split(" ")[0];
  return first && first.length > 0 ? first : fullName;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const greeting = getGreeting();
  const firstName = getFirstName(mockUser.name);
  const city = "Addis Ababa";

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(0)}
          style={styles.hero}
        >
          <View style={styles.heroTextBlock}>
            <Text style={styles.greeting} numberOfLines={1}>
              {greeting}, {firstName}
            </Text>
            <View style={styles.locationPill}>
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {city}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.muted} />
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/search")}
            style={({ pressed }) => [styles.bell, pressed ? styles.bellPressed : null]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
          </Pressable>
        </Animated.View>

        {/* ── Search ───────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          style={styles.searchWrap}
        >
          <SearchBar onPress={() => router.push("/search")} />
        </Animated.View>

        {/* ── Featured carousel ────────────────────────────────────────── */}
        <SectionHeader
          title="Featured"
          subtitle="Hand-picked events in your city"
        />
        {featuredEvents.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}
          >
            {featuredEvents.map((event, index) => (
              <Animated.View
                key={event.id}
                entering={FadeInDown.duration(400).delay(160 + index * 60)}
              >
                <EventCard event={event} variant="featured" />
              </Animated.View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="sparkles-outline"
              title="No featured events"
              description="Check back soon for curated picks."
            />
          </View>
        )}

        {/* ── Browse by category ───────────────────────────────────────── */}
        <SectionHeader
          title="Browse by category"
          subtitle="Find your kind of event"
        />
        <View style={styles.categoryGrid}>
          {categories.map((cat, index) => (
            <Animated.View
              key={cat.id}
              entering={FadeInDown.duration(400).delay(240 + index * 40)}
              style={styles.categoryCell}
            >
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/discover",
                    params: { category: cat.slug },
                  })
                }
                style={({ pressed }) => [
                  styles.categoryCard,
                  { borderColor: cat.color + "33" },
                  pressed ? styles.categoryCardPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Browse ${cat.name}`}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    { backgroundColor: cat.color + "22" },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={cat.color}
                  />
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>
                  {cat.name}
                </Text>
                <Text style={styles.categoryCount}>
                  {cat.eventCount} events
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* ── Upcoming this week ───────────────────────────────────────── */}
        <SectionHeader
          title="Upcoming this week"
          actionLabel="See all"
          onActionPress={() => router.push("/discover")}
        />
        {upcomingThisWeek.length > 0 ? (
          <View style={styles.verticalList}>
            {upcomingThisWeek.map((event, index) => (
              <Animated.View
                key={event.id}
                entering={FadeInDown.duration(400).delay(320 + index * 60)}
              >
                <EventCard event={event} variant="default" />
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="calendar-outline"
              title="Nothing this week"
              description="New events drop every day — check back soon."
            />
          </View>
        )}

        {/* ── Recommended for you ──────────────────────────────────────── */}
        <SectionHeader title="Recommended for you" />
        {recommendedEvents.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalRow}
          >
            {recommendedEvents.map((event, index) => (
              <Animated.View
                key={event.id}
                entering={FadeInDown.duration(400).delay(400 + index * 50)}
                style={styles.compactItem}
              >
                <EventCard event={event} variant="compact" />
              </Animated.View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="heart-outline"
              title="No recommendations yet"
              description="Save events you like to improve suggestions."
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  // Hero
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    ...typography.h1,
    color: colors.foreground,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    gap: 4,
  },
  locationText: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: "600",
  },
  bell: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellPressed: {
    opacity: 0.6,
  },

  // Search
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  // Horizontal rails
  horizontalRow: {
    paddingHorizontal: spacing.lg,
  },
  compactItem: {
    marginRight: spacing.md,
  },

  // Category grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryCell: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: "center",
    minHeight: 120,
    ...shadows.sm,
  },
  categoryCardPressed: {
    opacity: 0.85,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  categoryName: {
    ...typography.bodyBold,
    color: colors.foreground,
    textAlign: "center",
    marginBottom: 2,
  },
  categoryCount: {
    ...typography.small,
    color: colors.muted,
  },

  // Vertical list
  verticalList: {
    paddingHorizontal: spacing.lg,
  },
  emptyWrap: {
    paddingHorizontal: spacing.lg,
  },
});
