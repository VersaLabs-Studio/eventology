import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography, shadows } from "../lib/theme";
import type { Event } from "../lib/mock-data";

interface EventCardProps {
  event: Event;
  variant?: "default" | "featured" | "compact";
}

export default function EventCard({ event, variant = "default" }: EventCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/event/${event.slug}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const lowestPrice = Math.min(...event.ticketTiers.map((t) => t.price));

  if (variant === "featured") {
    return (
      <Pressable onPress={handlePress} style={styles.featuredCard}>
        <Image source={{ uri: event.bannerImage }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay} />
        <View style={styles.featuredContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{event.category.name}</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.featuredMeta}>
            <Ionicons name="calendar-outline" size={14} color={colors.white} />
            <Text style={styles.featuredMetaText}>{formatDate(event.date)}</Text>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.white}
              style={{ marginLeft: spacing.sm }}
            />
            <Text style={styles.featuredMetaText}>{event.location}</Text>
          </View>
          <Text style={styles.featuredPrice}>
            {event.ticketType === "free" ? "Free" : `From ${lowestPrice} ${event.ticketTiers[0]?.currency ?? "ETB"}`}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (variant === "compact") {
    return (
      <Pressable onPress={handlePress} style={styles.compactCard}>
        <Image source={{ uri: event.bannerImage }} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.muted} />
            <Text style={styles.compactMeta}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.muted} />
            <Text style={styles.compactMeta} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Default variant
  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <Image source={{ uri: event.bannerImage }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoryPill, { backgroundColor: event.category.color + "20" }]}>
            <Text style={[styles.categoryPillText, { color: event.category.color }]}>
              {event.category.name}
            </Text>
          </View>
          {event.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={10} color={colors.warning} />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText}>{formatDate(event.date)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>
            {event.time} — {event.endTime}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.location}, {event.subCity}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>
            {event.ticketType === "free"
              ? "Free"
              : `From ${lowestPrice} ${event.ticketTiers[0]?.currency ?? "ETB"}`}
          </Text>
          <View style={styles.registrationsRow}>
            <Ionicons name="people-outline" size={14} color={colors.muted} />
            <Text style={styles.registrationsText}>
              {event.registrations}/{event.capacity}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ── Featured ────────────────────────────────────────────────────────────────
  featuredCard: {
    width: 300,
    height: 200,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginRight: spacing.md,
    ...shadows.lg,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  featuredContent: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.md,
    justifyContent: "flex-end",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  categoryBadgeText: {
    ...typography.small,
    color: colors.white,
    fontWeight: "600",
  },
  featuredTitle: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  featuredMetaText: {
    ...typography.caption,
    color: colors.white,
    marginLeft: 4,
    opacity: 0.9,
  },
  featuredPrice: {
    ...typography.bodyBold,
    color: colors.primaryLight,
  },

  // ── Default ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  cardBody: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  categoryPillText: {
    ...typography.small,
    fontWeight: "600",
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  featuredBadgeText: {
    ...typography.small,
    color: colors.warning,
    fontWeight: "600",
  },
  cardTitle: {
    ...typography.h3,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.muted,
    marginLeft: 4,
  },
  metaDot: {
    ...typography.caption,
    color: colors.muted,
    marginHorizontal: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  registrationsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  registrationsText: {
    ...typography.caption,
    color: colors.muted,
  },

  // ── Compact ─────────────────────────────────────────────────────────────────
  compactCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  compactImage: {
    width: 80,
    height: 80,
    resizeMode: "cover",
  },
  compactContent: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: "center",
  },
  compactTitle: {
    ...typography.bodyBold,
    color: colors.foreground,
    marginBottom: 2,
  },
  compactMeta: {
    ...typography.small,
    color: colors.muted,
    marginLeft: 4,
  },
});
