// ============================================================================
// Event detail screen — Phase 3 Rotation 2
// ============================================================================
// Loads /api/public/events/[slug]. Renders banner, title, organizer,
// venue, description, ticket tiers. The Register button is now wired
// to a real registration flow (free + paid + paid webview).
// ============================================================================

import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/EmptyState';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { formatDate, formatDateTime, formatETB } from '@eventology/utils';
import { paymentsEnabled } from '@/lib/features';

interface Organizer {
  id: string;
  name: string;
  slug: string;
  is_verified: boolean;
  bio: string | null;
  website: string | null;
  avatar_url: string | null;
}

interface TicketTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  capacity: number;
  sold_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  short_description: string | null;
  banner_image: string | null;
  start_date: string;
  end_date: string;
  event_type: string;
  ticket_type: 'free' | 'paid';
  venue_name: string | null;
  venue_address: string | null;
  sub_city: string | null;
  capacity: number;
  registrations_count: number;
  is_featured: boolean;
  organizer: Organizer | null;
  category: Category | null;
  ticket_tiers: TicketTier[] | null;
}

interface RegistrationResponse {
  success: boolean;
  registration: { id: string; status: 'confirmed' | 'pending_payment' };
  ticket?: { id: string; ticket_number: string; qr_data: string };
  checkout_url?: string;
  final_price?: number;
  discount_applied?: number;
}

async function fetchEvent(slug: string): Promise<EventDetail> {
  return api.get<EventDetail>(`/api/public/events/${encodeURIComponent(slug)}`);
}

export default function EventDetailScreen(): React.ReactElement {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const border = isDark ? colors.borderDark : colors.border;
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();

  const eventQ = useQuery({
    queryKey: ['events', 'detail', slug],
    queryFn: () => fetchEvent(slug),
    enabled: !!slug,
  });

  const event = eventQ.data;

  // Payments-off parity (R3 / B4): when payments are disabled, hide
  // paid tiers. If every tier is paid, the form replaces the tier
  // list with a "Tickets on sale soon" placeholder.
  const paymentsOn = paymentsEnabled();

  // Selected tier — null means "first tier" / "free if no tiers".
  const [selectedTierId, setSelectedTierId] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);

  const selectableTiers = React.useMemo(() => {
    const all = event?.ticket_tiers ?? [];
    if (paymentsOn) return all;
    return all.filter((t) => t.price === 0);
  }, [event, paymentsOn]);

  // Free path: ticket is issued immediately. Paid path: route to webview.
  const register = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('Event not loaded');
      const tier = selectableTiers[0] ?? null;
      if (!tier && event.ticket_type === 'paid') {
        throw new Error('No ticket tiers available for this event');
      }
      return api.post<RegistrationResponse>('/api/protected/registrations', {
        event_id: event.id,
        ticket_tier_id: tier?.id ?? null,
        attendee_name: (user as { name?: string } | null)?.name ?? 'Guest',
        attendee_email: (user as { email?: string } | null)?.email ?? 'guest@eventology.app',
        attendee_phone: null,
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['events', 'detail', slug] });
      qc.invalidateQueries({ queryKey: ['events', 'detail'] });
      if (res.registration.status === 'pending_payment' && res.checkout_url && paymentsOn) {
        // Open the Chapa webview with the stub checkout URL
        router.push({
          pathname: '/payment/webview',
          params: { url: res.checkout_url, registrationId: res.registration.id },
        });
        return;
      }
      // Free path: confirmation modal + ticket added to My Tickets
      router.push({
        pathname: '/event/[slug]',
        params: { slug, registered: '1' },
      });
    },
    onError: (err) => {
      // Handled in the UI; toast is in the global handler
    },
  });

  // Resolve the initial tier when the event loads
  React.useEffect(() => {
    if (event && !selectedTierId && selectableTiers.length > 0) {
      setSelectedTierId(selectableTiers[0].id);
    }
    // If the previously selected tier is no longer selectable, clear it
    if (selectedTierId && !selectableTiers.find((t) => t.id === selectedTierId)) {
      setSelectedTierId(null);
    }
  }, [event, selectableTiers, selectedTierId]);

  const isFree = event?.ticket_type === 'free';
  const errorMessage =
    register.error instanceof ApiClientError
      ? register.error.message
      : register.error instanceof Error
        ? register.error.message
        : null;

  const onRegisterPress = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!event) return;
    register.mutate();
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <Stack.Screen options={{ title: event?.title ?? 'Event' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {eventQ.isLoading && (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={220} radius={0} />
            <View style={{ padding: spacing.md, gap: spacing.md }}>
              <Skeleton height={28} width="70%" />
              <Skeleton height={16} width="40%" />
              <Skeleton height={120} />
            </View>
          </View>
        )}

        {eventQ.error && (
          <View style={{ padding: spacing.lg }}>
            <EmptyState
              icon="alert-circle-outline"
              title="Couldn't load this event"
              description={eventQ.error instanceof ApiClientError ? eventQ.error.message : 'Try again later.'}
            />
          </View>
        )}

        {event && (
          <>
            <View style={styles.bannerWrap}>
              {event.banner_image ? (
                <Image source={{ uri: event.banner_image }} style={styles.banner} resizeMode="cover" />
              ) : (
                <View style={[styles.banner, styles.bannerPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="image-outline" size={48} color={textMuted} />
                </View>
              )}
            </View>

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: text }]} numberOfLines={3}>
                  {event.title}
                </Text>
                {event.category && (
                  <Badge
                    label={event.category.name}
                    variant="default"
                    style={{ backgroundColor: `${event.category.color}22`, borderColor: `${event.category.color}66` }}
                  />
                )}
              </View>

              {event.organizer && (
                <View style={styles.organizerRow}>
                  <Ionicons name="person-circle" size={20} color={textMuted} />
                  <Text style={[styles.organizerName, { color: text }]} numberOfLines={1}>
                    {event.organizer.name}
                  </Text>
                  {event.organizer.is_verified && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
                </View>
              )}

              <Card padding="md" variant="default">
                <View style={styles.metaList}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metaLabel, { color: textMuted }]}>Starts</Text>
                      <Text style={[styles.metaValue, { color: text }]}>{formatDateTime(event.start_date)}</Text>
                    </View>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar" size={16} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.metaLabel, { color: textMuted }]}>Ends</Text>
                      <Text style={[styles.metaValue, { color: text }]}>{formatDateTime(event.end_date)}</Text>
                    </View>
                  </View>
                  {event.venue_name && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location" size={16} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.metaLabel, { color: textMuted }]}>Venue</Text>
                        <Text style={[styles.metaValue, { color: text }]}>{event.venue_name}</Text>
                        {event.sub_city && (
                          <Text style={[styles.metaSub, { color: textMuted }]} numberOfLines={1}>
                            {event.sub_city}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </Card>

              {event.description && (
                <View>
                  <Text style={[styles.sectionTitle, { color: text }]}>About</Text>
                  <Text style={[styles.description, { color: text }]}>{event.description}</Text>
                </View>
              )}

              {event.ticket_tiers && event.ticket_tiers.length > 0 && (
                <View>
                  <Text style={[styles.sectionTitle, { color: text }]}>Tickets</Text>
                  <View style={{ gap: spacing.sm }}>
                    {event.ticket_tiers.map((tier) => {
                      const remaining = Math.max(0, tier.capacity - tier.sold_count);
                      const soldOut = remaining === 0;
                      const isPaid = tier.price > 0;
                      const disabled = soldOut || (!paymentsOn && isPaid);
                      const isSelected = selectedTierId === tier.id;
                      return (
                        <Card
                          key={tier.id}
                          padding="md"
                          variant={isSelected ? 'outline' : 'default'}
                          onPress={() => !disabled && setSelectedTierId(tier.id)}
                          style={isSelected ? { borderColor: colors.primary, borderWidth: 2 } : disabled ? { opacity: 0.6 } : {}}
                          accessibilityState={{ disabled }}
                        >
                          <View style={styles.tierHeader}>
                            <Text style={[styles.tierName, { color: text }]}>{tier.name}</Text>
                            <Text style={[styles.tierPrice, { color: text }]}>
                              {tier.price === 0 ? 'Free' : formatETB(tier.price)}
                            </Text>
                          </View>
                          {tier.description && (
                            <Text style={[styles.tierDescription, { color: textMuted }]}>{tier.description}</Text>
                          )}
                          <Text style={[styles.tierMeta, { color: textMuted }]}>
                            {!paymentsOn && isPaid
                              ? 'Soon'
                              : soldOut
                                ? 'Sold out'
                                : `${remaining} of ${tier.capacity} left`}
                          </Text>
                        </Card>
                      );
                    })}
                  </View>
                </View>
              )}

              {!paymentsOn && !isFree && selectableTiers.length === 0 && (
                <View
                  style={{
                    backgroundColor: colors.accentMuted,
                    borderColor: colors.accent,
                    borderWidth: 1,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons name="time-outline" size={20} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: text, fontWeight: '700', fontSize: 14 }}>
                      Tickets on sale soon
                    </Text>
                    <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
                      Payments are temporarily disabled. Check back shortly.
                    </Text>
                  </View>
                </View>
              )}

              {errorMessage && (
                <View
                  style={{
                    backgroundColor: colors.destructiveMuted,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                  <Text style={{ color: colors.destructive, flex: 1, fontSize: 13 }}>{errorMessage}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {event && (
        <View style={[styles.cta, { borderTopColor: border, backgroundColor: isDark ? colors.surfaceDark : colors.surface }]}>
          <Button
            label={
              isFree
                ? 'Register (free)'
                : !paymentsOn
                  ? 'Tickets on sale soon'
                  : 'Register'
            }
            leftIcon="ticket-outline"
            disabled={register.isPending || (!isFree && !paymentsOn)}
            fullWidth
            onPress={onRegisterPress}
          />
        </View>
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  bannerWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surfaceMuted },
  banner: { width: '100%', height: '100%' },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  title: { ...typography.h1, fontSize: 22, lineHeight: 28, flex: 1 },
  sectionTitle: { ...typography.h2, fontSize: 18, marginBottom: spacing.xs },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  organizerName: { ...typography.bodyBold, fontSize: 14 },
  metaList: { gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaLabel: { ...typography.small, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { ...typography.body, fontSize: 14, fontWeight: '600' },
  metaSub: { ...typography.caption, fontSize: 12 },
  description: { ...typography.body, fontSize: 14, lineHeight: 22 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  tierName: { ...typography.bodyBold, fontSize: 15, fontWeight: '700' },
  tierPrice: { ...typography.bodyBold, fontSize: 15, fontWeight: '700' },
  tierDescription: { ...typography.caption, fontSize: 12, marginBottom: spacing.xs },
  tierMeta: { ...typography.small, fontSize: 11 },
  cta: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
});
