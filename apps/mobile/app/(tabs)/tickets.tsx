// ============================================================================
// My Tickets tab — Phase 3 Rotation 2
// ============================================================================
// Lists the caller's tickets from /api/protected/tickets, renders a
// QR code for each, and persists the ticket list to AsyncStorage so it
// renders without network (offline mode at the venue).
// ============================================================================

import React from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { TicketQR } from '@/components/TicketQR';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { formatDate, formatDateTime } from '@eventology/utils';

const OFFLINE_CACHE_KEY = 'tickets:cache:v1';

interface TicketRow {
  id: string;
  ticket_number: string;
  qr_data: string;
  status: 'valid' | 'used' | 'cancelled';
  tier_name: string;
  used_at: string | null;
  issued_at: string;
  event?: {
    id: string;
    title: string;
    slug: string;
    start_date: string;
    end_date: string;
    venue_name: string | null;
  } | null;
}

interface TicketsResponse {
  data: TicketRow[];
  meta: { total: number; page: number; limit: number };
}

interface CachedTickets {
  data: TicketRow[];
  cachedAt: string;
}

async function fetchTickets(): Promise<TicketsResponse> {
  return api.get<TicketsResponse>('/api/protected/tickets?limit=100');
}

async function loadCached(): Promise<CachedTickets | null> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedTickets;
  } catch {
    return null;
  }
}

export default function MyTicketsScreen(): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const border = isDark ? colors.borderDark : colors.border;
  const { user } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ registered?: string }>();

  const [cached, setCached] = React.useState<CachedTickets | null>(null);
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);

  // Load cache on mount (synchronous render-blocking so the offline
  // view is there before the network request finishes)
  React.useEffect(() => {
    void loadCached().then(setCached);
  }, []);

  const ticketsQ = useQuery({
    queryKey: ['tickets', 'mine'],
    queryFn: fetchTickets,
  });

  // Persist the latest fetch to cache whenever it changes
  React.useEffect(() => {
    if (ticketsQ.data) {
      void AsyncStorage.setItem(
        OFFLINE_CACHE_KEY,
        JSON.stringify({ data: ticketsQ.data.data, cachedAt: new Date().toISOString() } satisfies CachedTickets)
      ).catch(() => {
        // best-effort
      });
    }
  }, [ticketsQ.data]);

  const liveTickets = ticketsQ.data?.data ?? [];
  // When the network fails, fall back to the offline cache
  const tickets = ticketsQ.isError ? cached?.data ?? [] : liveTickets;
  const isOffline = ticketsQ.isError && !!cached;

  // "Just registered" highlight — for one minute after a registration,
  // show a banner + auto-select the new ticket.
  React.useEffect(() => {
    if (params.registered === '1' && tickets.length > 0) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [params.registered, tickets.length]);

  // Not signed in: prompt to sign in
  if (!user) {
    return (
      <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.signedOut}>
            <Ionicons name="ticket-outline" size={64} color={textMuted} />
            <Text style={[styles.signedOutTitle, { color: text }]}>Sign in to see your tickets</Text>
            <Text style={[styles.signedOutBody, { color: textMuted }]}>
              Tickets you purchase or receive will appear here.
            </Text>
            <Link href="/auth/login" asChild>
              <Button label="Sign in" leftIcon="log-in-outline" />
            </Link>
            <View style={{ height: spacing.sm }} />
            <Link href="/auth/signup" asChild>
              <Button label="Create account" variant="outline" leftIcon="person-add-outline" />
            </Link>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: text }]}>My Tickets</Text>
          {isOffline && (
            <View style={[styles.offlineBanner, { backgroundColor: colors.warningMuted, borderColor: colors.warning }]}>
              <Ionicons name="cloud-offline-outline" size={14} color={colors.warning} />
              <Text style={[styles.offlineText, { color: colors.warning }]}>
                Offline — showing cached tickets
              </Text>
            </View>
          )}
          {params.registered === '1' && tickets.length > 0 && (
            <View style={[styles.successBanner, { backgroundColor: colors.successMuted, borderColor: colors.success }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.successText, { color: colors.success }]}>
                Registration confirmed! Your ticket is ready.
              </Text>
            </View>
          )}
        </View>

        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              isDark={isDark}
              isSelected={selectedTicketId === item.id}
              onPress={() => setSelectedTicketId(item.id === selectedTicketId ? null : item.id)}
            />
          )}
          ListEmptyComponent={
            ticketsQ.isLoading ? (
              <View style={{ gap: spacing.md }}>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} height={120} radius={16} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="ticket-outline"
                title="No tickets yet"
                description="Register for an event to see your tickets here."
                action={{ label: 'Discover events', onClick: () => router.push('/(tabs)/index') }}
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={ticketsQ.isFetching}
              onRefresh={() => ticketsQ.refetch()}
              tintColor={colors.primary}
            />
          }
        />
      </SafeAreaView>
    </View>
  );
}

interface TicketCardProps {
  ticket: TicketRow;
  isDark: boolean;
  isSelected: boolean;
  onPress: () => void;
}

function TicketCard({ ticket, isDark, isSelected, onPress }: TicketCardProps) {
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const border = isDark ? colors.borderDark : colors.border;

  const statusVariant =
    ticket.status === 'valid' ? 'success' :
    ticket.status === 'used' ? 'outline' :
    'destructive';

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Card onPress={onPress} padding="md" variant="default">
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.cardTitle, { color: text }]} numberOfLines={2}>
              {ticket.event?.title ?? 'Event'}
            </Text>
            <Text style={[styles.cardTier, { color: textMuted }]}>
              {ticket.tier_name} · #{ticket.ticket_number}
            </Text>
            {ticket.event && (
              <Text style={[styles.cardMeta, { color: textMuted }]}>
                {formatDate(ticket.event.start_date)}
                {ticket.event.venue_name ? ` · ${ticket.event.venue_name}` : ''}
              </Text>
            )}
          </View>
          <Badge label={ticket.status} variant={statusVariant} />
        </View>

        {isSelected && (
          <View style={[styles.qrWrap, { borderTopColor: border }]}>
            <TicketQR value={ticket.qr_data} size={220} />
            <Text style={[styles.qrHint, { color: textMuted }]}>
              Show this code at the door. Works offline.
            </Text>
            <Text style={[styles.qrMeta, { color: textMuted }]}>
              Issued {formatDateTime(ticket.issued_at)}
            </Text>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.sm },
  title: { ...typography.h1, fontSize: 24 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  offlineText: { fontSize: 12, fontWeight: '600' },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  successText: { fontSize: 12, fontWeight: '600' },
  list: { padding: spacing.md, paddingTop: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { ...typography.h3, fontSize: 15, lineHeight: 20 },
  cardTier: { ...typography.caption, fontSize: 12, marginTop: 2 },
  cardMeta: { ...typography.small, fontSize: 11, marginTop: 4 },
  qrWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  qrHint: { ...typography.small, fontSize: 12, marginTop: spacing.xs },
  qrMeta: { ...typography.small, fontSize: 10 },
  signedOut: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  signedOutTitle: { ...typography.h2, textAlign: 'center', marginTop: spacing.md },
  signedOutBody: { ...typography.body, textAlign: 'center', maxWidth: 320, marginBottom: spacing.md },
});
