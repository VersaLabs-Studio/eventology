/**
 * Eventology Mobile — Notifications Screen
 * FlatList of mock notifications with read/unread state. Tapping a
 * row marks it as read locally. A "Mark all as read" header button
 * clears the unread flag across all items.
 *
 * Mock-only: no backend, no store. All state is local.
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, typography } from "../lib/theme";

// ─── Local types ─────────────────────────────────────────────────────────────

type NotificationType = "ticket" | "event" | "system" | "social";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timeAgo: string;
  read: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
}

interface NotificationRowProps {
  item: NotificationItem;
  onPress: (id: string) => void;
}

// ─── Mock data (6–8 items) ──────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n_001",
    type: "ticket",
    title: "Your ticket is ready",
    body: "Addis Tech Summit 2026 — VIP Pass is now available in your wallet.",
    timeAgo: "2m ago",
    read: false,
    iconName: "ticket",
  },
  {
    id: "n_002",
    type: "event",
    title: "Event starts in 24 hours",
    body: "Ethiopian Coffee Masterclass begins tomorrow at Tomoca Coffee Bole.",
    timeAgo: "1h ago",
    read: false,
    iconName: "calendar",
  },
  {
    id: "n_003",
    type: "social",
    title: "Selam invited you",
    body: "Selam Wellness Center invited you to Addis Yoga & Meditation Retreat.",
    timeAgo: "3h ago",
    read: false,
    iconName: "person-add",
  },
  {
    id: "n_004",
    type: "system",
    title: "Payment successful",
    body: "We received ETB 500 for your General Admission to Addis Tech Summit 2026.",
    timeAgo: "Yesterday",
    read: true,
    iconName: "card",
  },
  {
    id: "n_005",
    type: "event",
    title: "Schedule update",
    body: "Startup Pitch Night: Bole moved to BlueMoon Hotel — same time.",
    timeAgo: "2d ago",
    read: true,
    iconName: "alert-circle",
  },
  {
    id: "n_006",
    type: "ticket",
    title: "Ticket transferred",
    body: "Your Festival Pass has been transferred to ticket code TKT-005-W4X5Y6.",
    timeAgo: "3d ago",
    read: true,
    iconName: "swap-horizontal",
  },
  {
    id: "n_007",
    type: "social",
    title: "New follower",
    body: "Ethiopian Business Forum started following you.",
    timeAgo: "5d ago",
    read: true,
    iconName: "people",
  },
  {
    id: "n_008",
    type: "system",
    title: "Welcome to Eventology",
    body: "Discover events, save favorites, and manage your tickets in one place.",
    timeAgo: "1w ago",
    read: true,
    iconName: "sparkles",
  },
];

// ─── Subcomponents ───────────────────────────────────────────────────────────

function NotificationRow({ item, onPress }: NotificationRowProps): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        !item.read && styles.rowUnread,
      ]}
    >
      {/* Unread indicator strip on the left edge */}
      {!item.read && <View style={styles.unreadStrip} />}

      <View style={styles.iconWrap}>
        <Ionicons name={item.iconName} size={20} color={colors.primary} />
      </View>

      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text
            style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.rowTime} numberOfLines={1}>
            {item.timeAgo}
          </Text>
        </View>
        <Text style={styles.rowBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function NotificationsScreen(): React.ReactElement {
  const [items, setItems] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => items.filter((i) => !i.read).length,
    [items]
  );

  const handleRowPress = useCallback((id: string) => {
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, read: true } : i))
    );
  }, []);

  const handleMarkAll = useCallback(() => {
    setItems((current) => current.map((i) => ({ ...i, read: true })));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <NotificationRow item={item} onPress={handleRowPress} />
    ),
    [handleRowPress]
  );

  const keyExtractor = useCallback((item: NotificationItem) => item.id, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        <Pressable
          onPress={handleMarkAll}
          disabled={unreadCount === 0}
          style={[styles.markAllButton, unreadCount === 0 && styles.markAllButtonDisabled]}
          accessibilityLabel="Mark all notifications as read"
        >
          <Ionicons
            name="checkmark-done"
            size={16}
            color={unreadCount === 0 ? colors.mutedLight : colors.primary}
          />
          <Text
            style={[
              styles.markAllText,
              unreadCount === 0 && styles.markAllTextDisabled,
            ]}
          >
            Mark all
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Separator(): React.ReactElement {
  return <View style={styles.separator} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.foreground,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  markAllButtonDisabled: {
    opacity: 0.6,
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  markAllTextDisabled: {
    color: colors.mutedLight,
  },

  listContent: {
    paddingVertical: spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 36 + spacing.md,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  rowUnread: {
    backgroundColor: colors.primary + "08",
  },
  unreadStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
    gap: spacing.sm,
  },
  rowTitle: {
    ...typography.body,
    color: colors.foreground,
    flexShrink: 1,
  },
  rowTitleUnread: {
    fontWeight: "700",
  },
  rowTime: {
    ...typography.small,
    color: colors.muted,
  },
  rowBody: {
    ...typography.caption,
    color: colors.muted,
  },
});
