import React from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, shadows, spacing, typography } from "../../lib/theme";
import { mockUser } from "../../lib/mock-data";
import type { User } from "../../lib/types";

// ─── Static data ────────────────────────────────────────────────────────────

/** Hard-coded stats for the demo. Will move to `mockUser` in V2. */
const STATS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "12", label: "Events" },
  { value: "5", label: "Following" },
  { value: "0", label: "Reviews" },
] as const;

const ROW_HEIGHT = 56;

/**
 * Discriminated action union — every menu row carries one of these so
 * the renderer can statically decide between `router.push` and a
 * placeholder `Alert`. Avoids `any` and runtime string matching.
 */
type MenuAction =
  | { kind: "navigate"; href: "/tickets" | "/notifications" }
  | { kind: "placeholder"; message: string }
  | { kind: "signOut" };

interface MenuRowDef {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Right-aligned accessory text (e.g. "English ▾"). Hidden when undefined. */
  rightText?: string;
  /** True for the destructive "Sign Out" row — slightly muted label. */
  destructive?: boolean;
  action: MenuAction;
}

const MENU_ROWS: ReadonlyArray<MenuRowDef> = [
  {
    icon: "ticket-outline",
    label: "My Tickets",
    action: { kind: "navigate", href: "/tickets" },
  },
  {
    icon: "heart-outline",
    label: "Favorites",
    action: { kind: "placeholder", message: "Favorites is coming soon." },
  },
  {
    icon: "people-outline",
    label: "Following",
    action: { kind: "placeholder", message: "Following is coming soon." },
  },
  {
    icon: "notifications-outline",
    label: "Notifications",
    action: { kind: "navigate", href: "/notifications" },
  },
  {
    icon: "settings-outline",
    label: "Settings",
    action: { kind: "placeholder", message: "Settings is coming soon." },
  },
  {
    icon: "globe-outline",
    label: "Language",
    rightText: "English ▾",
    action: { kind: "placeholder", message: "Language picker is coming soon." },
  },
  {
    icon: "help-circle-outline",
    label: "Help & Support",
    action: { kind: "placeholder", message: "Help & Support is coming soon." },
  },
  {
    icon: "log-out-outline",
    label: "Sign Out",
    destructive: true,
    action: { kind: "signOut" },
  },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Derive uppercase initials from a full name. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const first = parts[0]![0] ?? "";
  const last = parts[parts.length - 1]![0] ?? "";
  return (first + last).toUpperCase();
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

interface MenuRowProps {
  row: MenuRowDef;
  onPress: (row: MenuRowDef) => void;
  isLast: boolean;
}

function MenuRow({ row, onPress, isLast }: MenuRowProps): React.ReactElement {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={row.label}
        onPress={() => onPress(row)}
        style={({ pressed }) => [
          styles.menuRow,
          pressed && styles.menuRowPressed,
        ]}
      >
        <View style={styles.menuIconWrap}>
          <Ionicons name={row.icon} size={22} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.menuLabel,
            row.destructive && styles.menuLabelDestructive,
          ]}
        >
          {row.label}
        </Text>
        {row.rightText !== undefined && (
          <Text style={styles.menuRightText}>{row.rightText}</Text>
        )}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.mutedLight}
        />
      </Pressable>
      {!isLast && <View style={styles.divider} />}
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function ProfileScreen(): React.ReactElement {
  const router = useRouter();
  const user: User = mockUser;
  const initials = getInitials(user.name);

  const handleRowPress = (row: MenuRowDef): void => {
    switch (row.action.kind) {
      case "navigate":
        router.push(row.action.href);
        return;
      case "placeholder":
        Alert.alert("Coming soon", row.action.message);
        return;
      case "signOut":
        Alert.alert(
          "Sign Out",
          "You will be returned to the sign-in screen.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign Out",
              style: "destructive",
              onPress: () => router.replace("/auth/login"),
            },
          ]
        );
        return;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.memberSince}>Member since 2024</Text>
        </View>

        {/* ── Stats row ─────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          {STATS.map((stat, idx) => (
            <React.Fragment key={stat.label}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              {idx < STATS.length - 1 && (
                <View style={styles.statDivider} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* ── Menu ──────────────────────────────────────────────── */}
        <View style={styles.menuCard}>
          {MENU_ROWS.map((row, idx) => (
            <MenuRow
              key={row.label}
              row={row}
              onPress={handleRowPress}
              isLast={idx === MENU_ROWS.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },

  // ── Header ─────────────────────────────────────────────────────────
  header: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.5,
  },
  name: {
    ...typography.h1,
    color: colors.foreground,
  },
  email: {
    ...typography.body,
    color: colors.muted,
    marginTop: 2,
  },
  memberSince: {
    ...typography.caption,
    color: colors.mutedLight,
    marginTop: spacing.xs,
  },

  // ── Stats card ─────────────────────────────────────────────────────
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    color: colors.foreground,
  },
  statLabel: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },

  // ── Menu card ──────────────────────────────────────────────────────
  menuCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.sm,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  menuRowPressed: {
    backgroundColor: colors.background,
  },
  menuIconWrap: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  menuLabel: {
    ...typography.bodyBold,
    color: colors.foreground,
    flex: 1,
  },
  menuLabelDestructive: {
    color: colors.destructive,
  },
  menuRightText: {
    ...typography.body,
    color: colors.muted,
    marginRight: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 28 + spacing.md,
  },
});
