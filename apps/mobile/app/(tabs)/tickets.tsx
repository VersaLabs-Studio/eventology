// ============================================================================
// My Tickets tab — Phase 3 Rotation 2 (restyled Rotation 4)
// ============================================================================
// Lists the caller's tickets from /api/protected/tickets, renders a
// QR code for each, and persists the ticket list to AsyncStorage so it
// renders without network (offline mode at the venue).
//
// Restyle: usePalette + ScreenHeader, and each card carries an EventImage
// banner strip (branded gradient fallback) so a ticket reads like the event
// it belongs to instead of a plain text row.
// ============================================================================

import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { EventImage } from '@/components/ui/EventImage';
import { Scrim } from '@/components/ui/Gradient';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { TicketQR } from '@/components/TicketQR';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';
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
    banner_image?: string | null;
    category?: { slug: string } | null;
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
  const p = usePalette();
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
      <View style={[styles.root, { backgroundColor: p.background }]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.signedOut}>
            <View style={[styles.signedOutIcon, { backgroundColor: `${colors.primary}1A` }]}>
              <Ionicons name="ticket-outline" size={30} color={colors.primary} />
            </View>
            <Text style={[styles.signedOutTitle, { color: p.text }]}>Sign in to see your tickets</Text>
            <Text style={[styles.signedOutBody, { color: p.textMuted }]}>
              Tickets you purchase or receive will appear here.
            </Text>
            <View style={styles.signedOutActions}>
              <Link href="/auth/login" asChild>
                <Button label="Sign in" leftIcon="log-in-outline" fullWidth />
              </Link>
              <Link href="/auth/signup" asChild>
                <Button label="Create account" variant="outline" leftIcon="person-add-outline" fullWidth />
              </Link>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const unusedCount = tickets.filter((t) => t.status === 'valid').length;

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScreenHeader
          title={t('tickets.title')}
          subtitle={tickets.length > 0 ? `${unusedCount} valid · ${tickets.length} total` : undefined}
        />

        {(isOffline || (params.registered === '1' && tickets.length > 0)) && (
          <View style={styles.banners}>
            {isOffline && (
              <View style={[styles.banner, { backgroundColor: colors.warningMuted, borderColor: colors.warning }]}>
                <Ionicons name="cloud-offline-outline" size={14} color={colors.warning} />
                <Text style={[styles.bannerText, { color: colors.warning }]}>
                  Offline — showing cached tickets
                </Text>
              </View>
            )}
            {params.registered === '1' && tickets.length > 0 && (
              <View style={[styles.banner, { backgroundColor: colors.successMuted, borderColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.bannerText, { color: colors.success }]}>
                  Registration confirmed! Your ticket is ready.
                </Text>
              </View>
            )}
          </View>
        )}

        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              isSelected={selectedTicketId === item.id}
              onPress={() => setSelectedTicketId(item.id === selectedTicketId ? null : item.id)}
              onOpen={() => router.push(`/ticket/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            ticketsQ.isLoading ? (
              <View style={{ gap: spacing.md }}>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} height={168} radius={16} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="ticket-outline"
                title="No tickets yet"
                description="Register for an event to see your tickets here."
                action={{ label: 'Discover events', onClick: () => router.push('/') }}
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
  isSelected: boolean;
  onPress: () => void;
  onOpen: () => void;
}

function TicketCard({ ticket, isSelected, onPress, onOpen }: TicketCardProps) {
  const p = usePalette();

  const statusVariant =
    ticket.status === 'valid' ? 'success' :
    ticket.status === 'used' ? 'outline' :
    'destructive';

  return (
    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}>
      {/* Banner strip — tap opens the full ticket page; falls back to a branded
          gradient carrying the title. */}
      <Pressable onPress={onOpen} accessibilityRole="button">
        <EventImage
          uri={ticket.event?.banner_image}
          title={ticket.event?.title}
          categorySlug={ticket.event?.category?.slug}
          style={styles.cardImage}
        >
          <Scrim colors={gradients.scrimSoft} />
          <View style={styles.cardImageTop}>
            <Badge label={ticket.status} variant={statusVariant} />
          </View>
          <View style={styles.cardImageBody}>
            <Text style={styles.cardImageTitle} numberOfLines={2}>
              {ticket.event?.title ?? 'Event'}
            </Text>
          </View>
        </EventImage>
      </Pressable>

      {/* Tap target: the meta + expand row */}
      <Pressable style={styles.cardBody} onPress={onPress} accessibilityRole="button">
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.cardTier, { color: p.text }]} numberOfLines={1}>
            {ticket.tier_name} · #{ticket.ticket_number}
          </Text>
          {ticket.event && (
            <Text style={[styles.cardMeta, { color: p.textMuted }]} numberOfLines={1}>
              {formatDate(ticket.event.start_date)}
              {ticket.event.venue_name ? ` · ${ticket.event.venue_name}` : ''}
            </Text>
          )}
        </View>
        <View style={styles.expandHint}>
          <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
          <Ionicons name={isSelected ? 'chevron-up' : 'chevron-down'} size={16} color={p.textSubtle} />
        </View>
      </Pressable>

      {isSelected && (
        <View style={[styles.qrWrap, { borderTopColor: p.border }]}>
          <TicketQR value={ticket.qr_data} size={220} />
          <Text style={[styles.qrHint, { color: p.textMuted }]}>
            Show this code at the door. Works offline.
          </Text>
          <Text style={[styles.qrMeta, { color: p.textSubtle }]}>
            Issued {formatDateTime(ticket.issued_at)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banners: { paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bannerText: { fontSize: 12, fontWeight: '600' },
  list: { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xxl, gap: spacing.md },

  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 120 },
  cardImageTop: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  cardImageBody: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.sm },
  cardImageTitle: { ...typography.h3, fontSize: 16, color: colors.white, fontWeight: '800' },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardTier: { ...typography.bodyBold, fontSize: 14 },
  cardMeta: { ...typography.caption, fontSize: 12, marginTop: 2 },
  expandHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  qrWrap: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
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
  signedOutIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  signedOutTitle: { ...typography.h2, textAlign: 'center', marginTop: spacing.xs },
  signedOutBody: { ...typography.body, textAlign: 'center', maxWidth: 320 },
  signedOutActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
});
