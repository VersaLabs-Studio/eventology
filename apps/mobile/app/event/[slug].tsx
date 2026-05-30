import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography, shadows } from "../../lib/theme";
import { getEventBySlug } from "../../lib/mock-data";
import EmptyState from "../../components/EmptyState";

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const event = getEventBySlug(slug ?? "");

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="alert-circle-outline"
          title="Event not found"
          description="This event may have been removed or doesn't exist."
        />
      </SafeAreaView>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const lowestPrice = Math.min(...event.ticketTiers.map((t) => t.price));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image source={{ uri: event.bannerImage }} style={styles.banner} />
          <View style={styles.bannerOverlay} />

          {/* Back Button */}
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </Pressable>

          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category.name}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Meta Rows */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.metaLabel}>Date & Time</Text>
                <Text style={styles.metaValue}>
                  {formatDate(event.date)}
                </Text>
                <Text style={styles.metaSub}>
                  {event.time} — {event.endTime}
                </Text>
              </View>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Ionicons name="location-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.metaValue}>{event.location}</Text>
                <Text style={styles.metaSub}>{event.address}</Text>
              </View>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaRow}>
              <View style={styles.metaIcon}>
                <Ionicons name="people-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.metaLabel}>Attendees</Text>
                <Text style={styles.metaValue}>
                  {event.registrations} / {event.capacity} registered
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.shortDescription}</Text>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {event.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ticket Tiers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tickets</Text>
            {event.ticketTiers.map((tier) => {
              const remaining = tier.capacity - tier.sold;
              const isSoldOut = remaining <= 0;
              return (
                <View key={tier.id} style={styles.tierCard}>
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.tierPrice}>
                      {tier.price === 0 ? "Free" : `${tier.price} ${tier.currency}`}
                    </Text>
                  </View>
                  <Text style={styles.tierDesc}>{tier.description}</Text>
                  <View style={styles.tierFooter}>
                    <Text style={styles.tierCapacity}>
                      {isSoldOut ? "Sold Out" : `${remaining} remaining`}
                    </Text>
                    {isSoldOut && (
                      <View style={styles.soldOutBadge}>
                        <Text style={styles.soldOutText}>SOLD OUT</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Organizer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organizer</Text>
            <View style={styles.organizerCard}>
              <Image
                source={{ uri: event.organizer.avatar }}
                style={styles.organizerAvatar}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.organizerNameRow}>
                  <Text style={styles.organizerName}>{event.organizer.name}</Text>
                  {event.organizer.verified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </View>
                <Text style={styles.organizerStats}>
                  {event.organizer.eventsCount} events · {event.organizer.totalAttendees.toLocaleString()} attendees
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}>
            {event.ticketType === "free" ? "Free" : `From ${lowestPrice} ETB`}
          </Text>
          <Text style={styles.bottomMeta}>
            {event.registrations} registered
          </Text>
        </View>
        <Pressable style={styles.registerButton}>
          <Text style={styles.registerText}>Register Now</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Banner
  bannerContainer: { height: 260, position: "relative" },
  banner: { width: "100%", height: "100%", resizeMode: "cover" },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  backButton: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadge: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  categoryText: { ...typography.small, color: colors.white, fontWeight: "600" },

  // Content
  content: {
    padding: spacing.lg,
    marginTop: -spacing.lg,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  title: {
    ...typography.h1,
    color: colors.foreground,
    marginBottom: spacing.md,
  },

  // Meta Card
  metaCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.lg,
  },
  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  metaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  metaLabel: { ...typography.small, color: colors.muted },
  metaValue: { ...typography.bodyBold, color: colors.foreground, marginTop: 2 },
  metaSub: { ...typography.caption, color: colors.muted, marginTop: 1 },
  metaDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.muted,
    lineHeight: 22,
  },

  // Tags
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: {
    backgroundColor: colors.primary + "10",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  tagText: { ...typography.small, color: colors.primary },

  // Ticket Tiers
  tierCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierName: { ...typography.bodyBold, color: colors.foreground },
  tierPrice: { ...typography.h3, color: colors.primary },
  tierDesc: { ...typography.caption, color: colors.muted, marginTop: 4 },
  tierFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  tierCapacity: { ...typography.small, color: colors.muted },
  soldOutBadge: {
    backgroundColor: colors.destructive + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  soldOutText: { ...typography.small, color: colors.destructive, fontWeight: "700" },

  // Organizer
  organizerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  organizerAvatar: { width: 48, height: 48, borderRadius: 24 },
  organizerNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  organizerName: { ...typography.bodyBold, color: colors.foreground },
  organizerStats: { ...typography.caption, color: colors.muted, marginTop: 2 },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  bottomPrice: { ...typography.h2, color: colors.foreground },
  bottomMeta: { ...typography.small, color: colors.muted },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    ...shadows.md,
  },
  registerText: { ...typography.bodyBold, color: colors.white },
});
