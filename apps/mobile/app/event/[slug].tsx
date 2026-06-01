/**
 * Eventology Mobile — Event Detail
 * Full-bleed parallax banner + organizer/about/tiers/venue sections +
 * sticky bottom CTA. Parallax uses `Animated.Value` driving a
 * `translateY` interpolation on the banner image at 0.5× scroll speed.
 *
 * The route param is the event's `slug`; we resolve via the
 * `getEventBySlug` helper and fall back to a by-id match so the
 * detail page is robust to either nav style.
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { events, getEventBySlug } from "../../lib/mock-data";
import { formatCurrencyETB, formatDate } from "../../lib/format";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "../../lib/theme";

const BANNER_HEIGHT = 320;
const PARALLAX_EXTRA = 200; // image headroom for the parallax movement

export default function EventDetailScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const event = useMemo(() => {
    if (!slug) return undefined;
    return getEventBySlug(slug) ?? events.find((e) => e.id === slug);
  }, [slug]);

  const [following, setFollowing] = useState<boolean>(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/(tabs)");
    }
  }, [router]);

  const handleShare = useCallback(() => {
    if (event) {
      Alert.alert("Share event", `Share "${event.title}" with friends?`);
    } else {
      Alert.alert("Share", "Share this event?");
    }
  }, [event]);

  const handleGetTickets = useCallback(() => {
    if (!event) return;
    router.push(`/event/register/${event.id}`);
  }, [event, router]);

  const handleDirections = useCallback(() => {
    if (!event) return;
    Alert.alert(
      "Directions",
      `Open maps for ${event.address}? (demo — no native maps yet)`
    );
  }, [event]);

  if (!event) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.notFoundSafe}>
          <View style={styles.notFound}>
            <View style={styles.notFoundIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={colors.muted}
              />
            </View>
            <Text style={styles.notFoundTitle}>Event not found</Text>
            <Text style={styles.notFoundSubtitle}>
              "{slug}" doesn't match any event.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.notFoundCta,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={18} color={colors.white} />
              <Text style={styles.notFoundCtaText}>Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const dateLabel = formatDate(event.date, "long");
  const lowestPrice = Math.min(...event.ticketTiers.map((t) => t.price));
  const isFreeEvent = event.ticketType === "free";

  // Banner image lags the scroll: at full banner-height scroll the
  // image has moved down by 0.5 × PARALLAX_EXTRA, giving a subtle
  // depth effect. Extrapolation is clamped so over-scroll doesn't
  // drag the image off-screen.
  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT],
    outputRange: [0, PARALLAX_EXTRA * 0.5],
    extrapolate: "clamp",
  });

  // Top-of-screen overlay dims as the user scrolls past the banner
  // so the floating header buttons stay legible against white
  // content below.
  const scrimOpacity = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT * 0.6, BANNER_HEIGHT],
    outputRange: [0, 0.35, 0.7],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* ── Banner ────────────────────────────────────────────────────── */}
        <View style={styles.banner}>
          <Animated.Image
            source={{ uri: event.bannerImage }}
            style={[
              styles.bannerImage,
              { transform: [{ translateY: imageTranslateY }] },
            ]}
          />
          {/* Stepped gradient: barely-there top, mid, dark base */}
          <View style={styles.gradientTop} />
          <View style={styles.gradientMid} />
          <View style={styles.gradientBase} />
          {/* White scrim that fades in as we scroll */}
          <Animated.View
            style={[styles.bannerScrim, { opacity: scrimOpacity }]}
            pointerEvents="none"
          />

          <View style={styles.bannerContent} pointerEvents="none">
            <View
              style={[
                styles.categoryPill,
                { backgroundColor: event.category.color },
              ]}
            >
              <Ionicons
                name={event.category.icon as keyof typeof Ionicons.glyphMap}
                size={12}
                color={colors.white}
              />
              <Text style={styles.categoryPillText}>
                {event.category.name}
              </Text>
            </View>
            {event.isFeatured && (
              <View style={styles.featuredPill}>
                <Ionicons name="star" size={12} color={colors.warning} />
                <Text style={styles.featuredPillText}>Featured</Text>
              </View>
            )}
            <Text style={styles.bannerTitle}>{event.title}</Text>
            <View style={styles.bannerMetaRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.white}
              />
              <Text style={styles.bannerMetaText}>{dateLabel}</Text>
            </View>
            <View style={styles.bannerMetaRow}>
              <Ionicons name="time-outline" size={14} color={colors.white} />
              <Text style={styles.bannerMetaText}>
                {event.time} — {event.endTime}
              </Text>
            </View>
            <View style={styles.bannerMetaRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.white}
              />
              <Text style={styles.bannerMetaText} numberOfLines={1}>
                {event.location}, {event.subCity}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Organizer ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ORGANIZER</Text>
          <View style={styles.organizerCard}>
            <Image
              source={{ uri: event.organizer.avatar }}
              style={styles.organizerAvatar}
            />
            <View style={styles.organizerInfo}>
              <View style={styles.organizerNameRow}>
                <Text
                  style={styles.organizerName}
                  numberOfLines={1}
                >
                  {event.organizer.name}
                </Text>
                {event.organizer.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.accent}
                  />
                )}
              </View>
              <Text style={styles.organizerStats} numberOfLines={1}>
                {event.organizer.eventsCount} events ·{" "}
                {event.organizer.totalAttendees.toLocaleString()} attendees
              </Text>
            </View>
            <Pressable
              onPress={() => setFollowing((f) => !f)}
              style={({ pressed }) => [
                styles.followButton,
                following && styles.followButtonActive,
                pressed && styles.ctaButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: following }}
            >
              <Ionicons
                name={following ? "checkmark" : "add"}
                size={14}
                color={following ? colors.primary : colors.white}
              />
              <Text
                style={[
                  styles.followButtonText,
                  following && styles.followButtonTextActive,
                ]}
              >
                {following ? "Following" : "Follow"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── About ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT THIS EVENT</Text>
          <Text style={styles.aboutText}>{event.shortDescription}</Text>
          <View style={styles.tagsRow}>
            {event.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Ticket Tiers ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TICKET TIERS</Text>
          {event.ticketTiers.map((tier, idx) => {
            const remaining = Math.max(tier.capacity - tier.sold, 0);
            const soldRatio =
              tier.capacity > 0 ? tier.sold / tier.capacity : 0;
            const isSoldOut = remaining === 0;
            const isAlmostOut = !isSoldOut && soldRatio > 0.85;
            const barColor = isSoldOut
              ? colors.destructive
              : isAlmostOut
                ? colors.warning
                : colors.primary;
            return (
              <View
                key={tier.id}
                style={[
                  styles.tierCard,
                  idx === event.ticketTiers.length - 1 && styles.tierCardLast,
                ]}
              >
                <View style={styles.tierHeader}>
                  <View style={styles.tierHeaderText}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.tierDescription} numberOfLines={2}>
                      {tier.description}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.tierPrice,
                      isFreeEvent && tier.price === 0 && styles.tierPriceFree,
                    ]}
                  >
                    {tier.price === 0
                      ? "Free"
                      : formatCurrencyETB(tier.price)}
                  </Text>
                </View>
                <View style={styles.tierMetaRow}>
                  <View style={styles.capacityBar}>
                    <View
                      style={[
                        styles.capacityFill,
                        {
                          width: `${Math.min(soldRatio * 100, 100)}%`,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.tierMetaText}>
                    {tier.sold}/{tier.capacity}
                  </Text>
                </View>
                {isSoldOut && (
                  <View style={styles.soldOutBadge}>
                    <Ionicons
                      name="lock-closed"
                      size={10}
                      color={colors.destructive}
                    />
                    <Text style={styles.soldOutText}>Sold out</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Venue ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VENUE</Text>
          <View style={styles.venueCard}>
            <View style={styles.venueInfo}>
              <Text style={styles.venueName}>{event.location}</Text>
              <Text style={styles.venueAddress}>{event.address}</Text>
              <View style={styles.venueSubRow}>
                <Ionicons
                  name="navigate-outline"
                  size={14}
                  color={colors.muted}
                />
                <Text style={styles.venueSubText}>
                  {event.subCity} Sub-city
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.directionsButton,
                  pressed && styles.directionsButtonPressed,
                ]}
                onPress={handleDirections}
              >
                <Ionicons
                  name="navigate-circle-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.directionsText}>Get directions</Text>
              </Pressable>
            </View>
            <View style={styles.mapPlaceholder}>
              <Ionicons
                name="map-outline"
                size={56}
                color={colors.mutedLight}
              />
              <Text style={styles.mapPlaceholderText}>Map preview</Text>
              <View style={styles.mapPin} pointerEvents="none">
                <Ionicons
                  name="location-sharp"
                  size={20}
                  color={colors.white}
                />
              </View>
              <View style={styles.mapFooter}>
                <Ionicons
                  name="pin"
                  size={12}
                  color={colors.foreground}
                />
                <Text style={styles.mapFooterText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Spacer clears the sticky CTA */}
        <View style={styles.ctaSpacer} />
      </Animated.ScrollView>

      {/* ── Floating header (back + share) ──────────────────────────────── */}
      <View style={styles.floatingHeader} pointerEvents="box-none">
        <View style={styles.floatingHeaderRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.floatingButton,
              pressed && styles.floatingButtonPressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.white}
            />
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.floatingButton,
              pressed && styles.floatingButtonPressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Share event"
          >
            <Ionicons
              name="share-outline"
              size={22}
              color={colors.white}
            />
          </Pressable>
        </View>
      </View>

      {/* ── Sticky bottom CTA ───────────────────────────────────────────── */}
      <View style={styles.ctaWrap} pointerEvents="box-none">
        <View style={styles.ctaBar}>
          <View style={styles.ctaPriceCol}>
            <Text style={styles.ctaPriceLabel}>
              {isFreeEvent ? "Entry" : "From"}
            </Text>
            <Text style={styles.ctaPriceValue}>
              {isFreeEvent
                ? "Free"
                : formatCurrencyETB(lowestPrice)}
            </Text>
          </View>
          <Pressable
            onPress={handleGetTickets}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Get tickets"
          >
            <Text style={styles.ctaButtonText}>Get Tickets</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.white}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },

  // ── Banner ───────────────────────────────────────────────────────────────
  banner: {
    height: BANNER_HEIGHT,
    overflow: "hidden",
    backgroundColor: colors.backgroundDark,
    justifyContent: "flex-end",
  },
  bannerImage: {
    position: "absolute",
    top: -PARALLAX_EXTRA / 2,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT + PARALLAX_EXTRA,
    width: "100%",
    resizeMode: "cover",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT * 0.4,
    backgroundColor: colors.gradientTopSoft,
  },
  gradientMid: {
    position: "absolute",
    top: BANNER_HEIGHT * 0.4,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT * 0.3,
    backgroundColor: colors.gradientMidSoft,
  },
  gradientBase: {
    position: "absolute",
    top: BANNER_HEIGHT * 0.7,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT * 0.3,
    backgroundColor: colors.gradientBaseStrong,
  },
  bannerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
  },
  bannerContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 4,
  },
  categoryPillText: {
    ...typography.small,
    color: colors.white,
    fontWeight: "700",
  },
  featuredPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.overlayLight,
  },
  featuredPillText: {
    ...typography.small,
    color: colors.white,
    fontWeight: "700",
  },
  bannerTitle: {
    ...typography.display,
    color: colors.white,
    width: "100%",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    textShadowColor: colors.textShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 2,
  },
  bannerMetaText: {
    ...typography.caption,
    color: colors.white,
    marginLeft: 6,
    fontWeight: "500",
  },

  // ── Sections ─────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionLabel: {
    ...typography.small,
    color: colors.muted,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },

  // ── Organizer ────────────────────────────────────────────────────────────
  organizerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  organizerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    marginRight: spacing.md,
  },
  organizerInfo: { flex: 1, marginRight: spacing.sm },
  organizerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  organizerName: {
    ...typography.bodyBold,
    color: colors.foreground,
    flexShrink: 1,
  },
  organizerStats: {
    ...typography.small,
    color: colors.muted,
    marginTop: 2,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minHeight: 44,
  },
  followButtonActive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "700",
  },
  followButtonTextActive: {
    color: colors.primary,
  },

  // ── About ────────────────────────────────────────────────────────────────
  aboutText: {
    ...typography.body,
    color: colors.foreground,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipText: {
    ...typography.small,
    color: colors.muted,
    fontWeight: "500",
  },

  // ── Ticket Tiers ─────────────────────────────────────────────────────────
  tierCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  tierCardLast: { marginBottom: 0 },
  tierHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  tierHeaderText: {
    flex: 1,
    marginRight: spacing.md,
  },
  tierName: {
    ...typography.bodyBold,
    color: colors.foreground,
  },
  tierDescription: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  tierPrice: {
    ...typography.h3,
    color: colors.primary,
  },
  tierPriceFree: {
    color: colors.success,
  },
  tierMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  capacityBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
    borderRadius: 3,
  },
  tierMetaText: {
    ...typography.small,
    color: colors.muted,
    fontWeight: "600",
    minWidth: 56,
    textAlign: "right",
  },
  soldOutBadge: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.destructive + "1F",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  soldOutText: {
    ...typography.small,
    color: colors.destructive,
    fontWeight: "700",
  },

  // ── Venue ────────────────────────────────────────────────────────────────
  venueCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  venueInfo: { marginBottom: spacing.md },
  venueName: {
    ...typography.bodyBold,
    color: colors.foreground,
  },
  venueAddress: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  venueSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  venueSubText: {
    ...typography.caption,
    color: colors.muted,
    marginLeft: 4,
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    gap: 4,
    paddingVertical: 4,
  },
  directionsButtonPressed: {
    opacity: 0.6,
  },
  directionsText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  mapPlaceholder: {
    height: 160,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  mapPlaceholderText: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
    fontWeight: "500",
  },
  mapPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.destructive,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.md,
  },
  mapFooter: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 4,
    ...shadows.sm,
  },
  mapFooterText: {
    ...typography.small,
    color: colors.foreground,
    fontWeight: "600",
    flex: 1,
  },

  // ── Floating Header ──────────────────────────────────────────────────────
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  floatingHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: 50, // iOS notch clearance
    paddingBottom: spacing.sm,
  },
  floatingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  floatingButtonPressed: {
    backgroundColor: colors.overlayPressed,
  },

  // ── Sticky CTA ───────────────────────────────────────────────────────────
  ctaWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    ...shadows.lg,
  },
  ctaPriceCol: { flex: 1 },
  ctaPriceLabel: {
    ...typography.small,
    color: colors.muted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  ctaPriceValue: {
    ...typography.h2,
    color: colors.foreground,
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    ...shadows.md,
  },
  ctaButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  ctaButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  ctaSpacer: {
    height: 120,
  },

  // ── Not Found ────────────────────────────────────────────────────────────
  notFoundSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  notFoundIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  notFoundTitle: {
    ...typography.h1,
    color: colors.foreground,
  },
  notFoundSubtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  notFoundCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  notFoundCtaText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});
