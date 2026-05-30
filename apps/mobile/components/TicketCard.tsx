import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography, shadows } from "../lib/theme";
import type { MockTicket } from "../lib/mock-data";

interface TicketCardProps {
  ticket: MockTicket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const statusColor =
    ticket.status === "valid"
      ? colors.success
      : ticket.status === "used"
        ? colors.muted
        : colors.destructive;

  const statusLabel =
    ticket.status === "valid" ? "Valid" : ticket.status === "used" ? "Used" : "Cancelled";

  return (
    <View style={styles.card}>
      {/* Event Image Header */}
      <Image source={{ uri: ticket.eventImage }} style={styles.image} />

      {/* Ticket Body */}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {ticket.eventTitle}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText}>
            {formatDate(ticket.eventDate)} · {ticket.eventTime}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {ticket.eventLocation}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="ticket-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText}>{ticket.ticketTier}</Text>
        </View>

        {/* QR Code Placeholder */}
        <View style={styles.qrSection}>
          <View style={styles.qrBox}>
            <Ionicons name="qr-code-outline" size={64} color={colors.foreground} />
          </View>
          <Text style={styles.qrData}>{ticket.qrData}</Text>
          <Text style={styles.qrHint}>Show this QR at the entrance</Text>
        </View>
      </View>

      {/* Perforated edge */}
      <View style={styles.perforation}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View key={i} style={styles.perfDot} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  body: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  eventTitle: {
    ...typography.h3,
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.small,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.muted,
    marginLeft: 6,
  },
  qrSection: {
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: "dashed",
  },
  qrBox: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  qrData: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: "600",
    letterSpacing: 1,
  },
  qrHint: {
    ...typography.small,
    color: colors.muted,
    marginTop: 2,
  },
  perforation: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: "dashed",
  },
  perfDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
});
