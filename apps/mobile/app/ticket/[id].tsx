// ============================================================================
// Ticket detail screen
// ============================================================================
// A full-page view of a single ticket: the event banner hero, a large centered
// QR (the same value shown offline in the list), attendee + tier + status,
// event date/venue, and actions (view event, add to calendar, share). Loads
// GET /api/protected/tickets/[id]; RLS ensures only the owner/organizer sees it.
// ============================================================================

import React from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiClientError, API_BASE_URL } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/EmptyState';
import { EventImage } from '@/components/ui/EventImage';
import { Scrim } from '@/components/ui/Gradient';
import { TicketQR } from '@/components/TicketQR';
import { usePalette } from '@/lib/palette';
import { useLocale } from '@/lib/i18n';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';
import { formatDateTime } from '@eventology/utils';

interface TicketDetail {
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
    banner_image?: string | null;
    start_date: string;
    end_date: string;
    venue_name: string | null;
    category?: { slug: string } | null;
  } | null;
  registration?: {
    id: string;
    attendee_name: string;
    attendee_email: string;
    checked_in_at: string | null;
  } | null;
}

async function fetchTicket(id: string): Promise<TicketDetail> {
  return api.get<TicketDetail>(`/api/protected/tickets/${encodeURIComponent(id)}`);
}

export default function TicketDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = usePalette();
  const router = useRouter();
  const { t } = useLocale();

  const ticketQ = useQuery({
    queryKey: ['tickets', 'detail', id],
    queryFn: () => fetchTicket(id),
    enabled: !!id,
  });

  const ticket = ticketQ.data;
  const ev = ticket?.event;

  const statusVariant =
    ticket?.status === 'valid' ? 'success' : ticket?.status === 'used' ? 'outline' : 'destructive';

  const onShare = () => {
    if (!ev) return;
    const url = `${API_BASE_URL}/events/${ev.slug}`;
    void Share.share({ message: `${ev.title}\n${url}`, url, title: ev.title });
  };
  const onAddToCalendar = () => {
    if (!ev) return;
    void Linking.openURL(`${API_BASE_URL}/api/public/events/${encodeURIComponent(ev.slug)}/calendar`);
  };

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {ticketQ.isLoading ? (
          <View>
            <Skeleton height={200} radius={0} />
            <View style={{ padding: spacing.md, gap: spacing.md, alignItems: 'center' }}>
              <Skeleton height={240} width={240} radius={radius.lg} />
              <Skeleton height={20} width="60%" />
            </View>
          </View>
        ) : null}

        {ticketQ.error ? (
          <SafeAreaView edges={['top']}>
            <View style={{ padding: spacing.lg }}>
              <EmptyState
                icon="alert-circle-outline"
                title={t('ticket.loadErrorTitle')}
                description={
                  ticketQ.error instanceof ApiClientError ? ticketQ.error.message : t('ticket.loadErrorBody')
                }
                action={{ label: t('common.back'), onClick: () => router.back() }}
              />
            </View>
          </SafeAreaView>
        ) : null}

        {ticket ? (
          <>
            {/* ── Event banner hero ── */}
            <EventImage
              uri={ev?.banner_image}
              title={ev?.title}
              categorySlug={ev?.category?.slug}
              style={styles.hero}
            >
              <Scrim colors={gradients.scrim} locations={[0, 0.4, 1]} />
              <SafeAreaView edges={['top']} style={styles.heroSafe}>
                <View style={styles.heroTopRow}>
                  <Pressable
                    onPress={() => router.back()}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.back')}
                    style={styles.glassButton}
                  >
                    <Ionicons name="chevron-back" size={20} color={colors.white} />
                  </Pressable>
                  <Badge label={ticket.status} variant={statusVariant} />
                </View>
              </SafeAreaView>
              <View style={styles.heroBody}>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {ev?.title ?? t('ticket.title')}
                </Text>
              </View>
            </EventImage>

            <View style={styles.body}>
              {/* ── QR ── */}
              <View style={[styles.qrCard, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}>
                <TicketQR value={ticket.qr_data} size={240} />
                <Text style={[styles.qrNumber, { color: p.text }]}>#{ticket.ticket_number}</Text>
                <Text style={[styles.qrHint, { color: p.textMuted }]}>{t('ticket.showAtDoor')}</Text>
              </View>

              {/* ── Details ── */}
              <View style={[styles.detailCard, { backgroundColor: p.surface, borderColor: p.border }]}>
                <DetailRow icon="pricetag-outline" label={t('ticket.tier')} value={ticket.tier_name} />
                {ticket.registration?.attendee_name ? (
                  <DetailRow
                    icon="person-outline"
                    label={t('ticket.attendee')}
                    value={ticket.registration.attendee_name}
                  />
                ) : null}
                {ev ? (
                  <DetailRow icon="calendar-outline" label={t('ticket.when')} value={formatDateTime(ev.start_date)} />
                ) : null}
                {ev?.venue_name ? (
                  <DetailRow icon="location-outline" label={t('ticket.where')} value={ev.venue_name} />
                ) : null}
                <DetailRow
                  icon="time-outline"
                  label={t('ticket.issued')}
                  value={formatDateTime(ticket.issued_at)}
                />
                {ticket.registration?.checked_in_at ? (
                  <DetailRow
                    icon="checkmark-circle-outline"
                    label={t('ticket.checkedIn')}
                    value={formatDateTime(ticket.registration.checked_in_at)}
                  />
                ) : null}
              </View>

              {/* ── Actions ── */}
              <View style={styles.actions}>
                {ev ? (
                  <Button
                    label={t('ticket.viewEvent')}
                    variant="outline"
                    leftIcon="open-outline"
                    fullWidth
                    onPress={() => router.push(`/event/${ev.slug}`)}
                  />
                ) : null}
                <View style={styles.actionRow}>
                  <View style={styles.flexBtn}>
                    <Button
                      label={t('event.addToCalendar')}
                      variant="ghost"
                      leftIcon="calendar-outline"
                      fullWidth
                      onPress={onAddToCalendar}
                    />
                  </View>
                  <View style={styles.flexBtn}>
                    <Button
                      label={t('event.share')}
                      variant="ghost"
                      leftIcon="share-social-outline"
                      fullWidth
                      onPress={onShare}
                    />
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}): React.ReactElement {
  const p = usePalette();
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: `${colors.primary}1A` }]}>
        <Ionicons name={icon} size={15} color={colors.primary} />
      </View>
      <View style={styles.flexMin}>
        <Text style={[styles.detailLabel, { color: p.textMuted }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: p.text }]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flexMin: { flex: 1, minWidth: 0 },
  content: { paddingBottom: spacing.xxl },

  hero: { width: '100%', height: 200 },
  heroSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  glassButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  heroBody: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
  heroTitle: { ...typography.h2, fontSize: 22, lineHeight: 27, color: colors.white, fontWeight: '800' },

  body: { padding: spacing.md, gap: spacing.md, marginTop: -spacing.xl },

  qrCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  qrNumber: { ...typography.h3, fontSize: 18, fontWeight: '800', marginTop: spacing.xs },
  qrHint: { ...typography.caption, fontSize: 12, textAlign: 'center' },

  detailCard: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  detailLabel: { ...typography.small, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  detailValue: { ...typography.body, fontSize: 14, fontWeight: '600', marginTop: 1 },

  actions: { gap: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  flexBtn: { flex: 1 },
});
