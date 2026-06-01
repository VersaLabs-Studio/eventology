/**
 * Eventology Mobile — Tickets Tab
 * Three-tab list (Upcoming / Past / All) of the current user's tickets.
 * Filtering is performed on a `now` timestamp captured at mount and
 * refreshed on pull-to-refresh so tickets crossing the date boundary
 * re-classify without a full app restart.
 *
 * Tabs are local state — this screen does not own a route param.
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import EmptyState from "../../components/EmptyState";
import TicketCard from "../../components/TicketCard";
import { TICKET_TABS } from "../../lib/constants";
import { mockTickets } from "../../lib/mock-data";
import { colors, radius, spacing, typography } from "../../lib/theme";
import type { Ticket, TicketTab } from "../../lib/types";

type TabCounts = Record<TicketTab, number>;

function partitionTickets(
  tickets: Ticket[],
  tab: TicketTab,
  now: number
): Ticket[] {
  // Always sort chronologically — Upcoming is most-relevant-first,
  // Past is most-recent-first, All is interleaved. Sorting once and
  // filtering is cheaper than sorting per-tab.
  const sorted = [...tickets].sort(
    (a, b) =>
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );
  if (tab === "all") return sorted;
  if (tab === "upcoming") {
    return sorted.filter((t) => new Date(t.eventDate).getTime() >= now);
  }
  return sorted.filter((t) => new Date(t.eventDate).getTime() < now);
}

function countTickets(tickets: Ticket[], now: number): TabCounts {
  let upcoming = 0;
  let past = 0;
  for (const t of tickets) {
    if (new Date(t.eventDate).getTime() >= now) upcoming += 1;
    else past += 1;
  }
  return { upcoming, past, all: tickets.length };
}

function emptyStateCopy(tab: TicketTab): { title: string; description: string } {
  if (tab === "upcoming") {
    return {
      title: "No upcoming tickets",
      description: "Browse events and grab tickets for what's next.",
    };
  }
  if (tab === "past") {
    return {
      title: "No past tickets",
      description: "Events you've attended will appear here.",
    };
  }
  return {
    title: "No tickets yet",
    description: "Tickets you purchase will live here.",
  };
}

export default function TicketsScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TicketTab>("upcoming");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  // Captured once at mount; bumped on pull-to-refresh.
  const [now, setNow] = useState<number>(() => Date.now());

  const tickets = useMemo(
    () => partitionTickets(mockTickets, activeTab, now),
    [activeTab, now]
  );

  const counts = useMemo(() => countTickets(mockTickets, now), [now]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Fake refresh — in V2 this would re-fetch from the API.
    setTimeout(() => {
      setNow(Date.now());
      setRefreshing(false);
    }, 1200);
  }, []);

  const copy = emptyStateCopy(activeTab);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
        <Text style={styles.subtitle}>
          {tickets.length}{" "}
          {activeTab === "all"
            ? `of ${counts.all} total`
            : activeTab}
        </Text>
      </View>

      <View style={styles.tabsRow}>
        {TICKET_TABS.map((tab) => {
          const isActive = tab.value === activeTab;
          const count = counts[tab.value];
          return (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={({ pressed }) => [
                styles.segment,
                isActive && styles.segmentActive,
                pressed && !isActive && styles.segmentPressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.segmentText,
                  isActive && styles.segmentTextActive,
                ]}
              >
                {tab.label}
              </Text>
              <Text
                style={[
                  styles.segmentCount,
                  isActive && styles.segmentCountActive,
                ]}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TicketCard ticket={item} />}
        contentContainerStyle={[
          styles.listContent,
          tickets.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="ticket-outline"
            title={copy.title}
            description={copy.description}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    ...typography.display,
    color: colors.foreground,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
    textTransform: "capitalize",
  },
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
  },
  segmentActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentPressed: {
    backgroundColor: colors.background,
  },
  segmentText: {
    ...typography.bodyBold,
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.white,
  },
  segmentCount: {
    ...typography.small,
    color: colors.muted,
    fontWeight: "700",
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    overflow: "hidden",
    minWidth: 22,
    textAlign: "center",
  },
  segmentCountActive: {
    color: colors.primary,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
