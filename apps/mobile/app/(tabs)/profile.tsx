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
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography, shadows } from "../../lib/theme";
import { mockUser, mockTickets } from "../../lib/mock-data";

const menuItems = [
  { icon: "ticket-outline" as const, label: "My Tickets", count: mockTickets.length },
  { icon: "heart-outline" as const, label: "Favorites", count: 8 },
  { icon: "calendar-outline" as const, label: "Calendar", count: 0 },
  { icon: "notifications-outline" as const, label: "Notifications", count: 3 },
  { icon: "card-outline" as const, label: "Payment Methods", count: 0 },
  { icon: "globe-outline" as const, label: "Language", value: "English" },
  { icon: "moon-outline" as const, label: "Dark Mode", toggle: true },
  { icon: "help-circle-outline" as const, label: "Help & Support", count: 0 },
  { icon: "information-circle-outline" as const, label: "About Eventology", count: 0 },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <Image source={{ uri: mockUser.avatar }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{mockUser.name}</Text>
              <Text style={styles.userEmail}>{mockUser.email}</Text>
              <View style={styles.badge}>
                <Ionicons name="star" size={12} color={colors.primary} />
                <Text style={styles.badgeText}>Attendee</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{mockUser.eventsAttended}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{mockUser.ticketsCount}</Text>
              <Text style={styles.statLabel}>Tickets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <Pressable key={index} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <View style={styles.menuRight}>
                {item.value && (
                  <Text style={styles.menuValue}>{item.value}</Text>
                )}
                {item.count > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{item.count}</Text>
                  </View>
                )}
                {item.toggle && (
                  <View style={styles.toggleOff}>
                    <View style={styles.toggleDot} />
                  </View>
                )}
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.muted}
                />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        {/* Version */}
        <Text style={styles.version}>Eventology v1.0.0 — Demo</Text>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },

  // Profile Card
  profileCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  avatarRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  profileInfo: { marginLeft: spacing.md, flex: 1 },
  userName: { ...typography.h2, color: colors.foreground },
  userEmail: { ...typography.caption, color: colors.muted, marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary + "15",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  badgeText: { ...typography.small, color: colors.primary, fontWeight: "600" },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { ...typography.h2, color: colors.foreground },
  statLabel: { ...typography.small, color: colors.muted, marginTop: 2 },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: -4,
  },

  // Menu
  menuSection: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: { ...typography.body, color: colors.foreground },
  menuRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  menuValue: { ...typography.caption, color: colors.muted },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  countText: { ...typography.small, color: colors.white, fontWeight: "700" },
  toggleOff: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.destructive + "10",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.destructive + "30",
  },
  logoutText: { ...typography.body, color: colors.destructive, fontWeight: "600" },

  version: {
    ...typography.small,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
