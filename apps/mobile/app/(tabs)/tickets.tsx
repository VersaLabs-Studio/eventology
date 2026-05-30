import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../lib/theme";
import { mockTickets } from "../../lib/mock-data";
import TicketCard from "../../components/TicketCard";
import EmptyState from "../../components/EmptyState";

type Tab = "upcoming" | "past";

export default function TicketsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const now = new Date();
  const upcoming = mockTickets.filter(
    (t) => new Date(t.eventDate) >= now && t.status === "valid"
  );
  const past = mockTickets.filter(
    (t) => new Date(t.eventDate) < now || t.status === "used" || t.status === "cancelled"
  );

  const tickets = activeTab === "upcoming" ? upcoming : past;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
        <Text style={styles.subtitle}>{mockTickets.length} tickets total</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}
          >
            Upcoming ({upcoming.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "past" && styles.tabActive]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}
          >
            Past ({past.length})
          </Text>
        </Pressable>
      </View>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <EmptyState
          icon="ticket-outline"
          title={`No ${activeTab} tickets`}
          description={
            activeTab === "upcoming"
              ? "Browse events and register to get your first ticket!"
              : "Your past event tickets will appear here."
          }
        />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h1, color: colors.foreground },
  subtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: { ...typography.body, color: colors.muted, fontWeight: "600" },
  tabTextActive: { color: colors.white },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
