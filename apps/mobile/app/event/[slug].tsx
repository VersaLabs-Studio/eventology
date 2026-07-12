// ============================================================================
// Event detail screen
// ============================================================================
// Immersive hero (photo + scrim + overlaid title), then meta, description,
// ticket tiers, and a sticky bottom CTA. Loads /api/public/events/[slug].
//
// The screen hides the native header and draws its own floating back button so
// the photo runs under the status bar, matching the web hero.
//
// Registration:
//   • signed out       → /auth/login?redirect=/event/<slug>, which returns here
//   • free             → ticket issued inline, success card + "View my tickets"
//   • paid + payments  → Chapa webview
//   • paid, payments off → CTA disabled, "on sale soon" notice
// ============================================================================

import React from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiClientError, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/EmptyState';
import { EventImage } from '@/components/ui/EventImage';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { EventSummaryCard } from '@/components/ai/EventSummaryCard';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { Scrim } from '@/components/ui/Gradient';
import { usePalette } from '@/lib/palette';
import { useLocale } from '@/lib/i18n';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';
import { formatDateTime, formatETB } from '@eventology/utils';
import { paymentsEnabled } from '@/lib/features';

interface Organizer {
  id: string;
  name: string;
  slug: string;
  is_verified: boolean;
  bio: string | null;
  website: string | null;
  avatar_url: string | null;
  events_count?: number;
  total_attendees?: number;
}

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
}

interface ReviewsResponse {
  data: ReviewRow[];
  aggregate: { average: number; count: number; distribution: Record<string, number> };
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
  tags: string[] | null;
  organizer: Organizer | null;
  category: Category | null;
  ticket_tiers: TicketTier[] | null;
}

interface RegistrationResponse {
  success: boolean;
  registration: { id: string; status: 'confirmed' | 'pending_payment' };
  ticket?: { id: string; ticket_number: string; qr_data: string };
  checkout_url?: string;
}

async function fetchEvent(slug: string): Promise<EventDetail> {
  return api.get<EventDetail>(`/api/public/events/${encodeURIComponent(slug)}`);
}

/**
 * The API stores `description` as rich-text HTML (the web renders it with
 * dangerouslySetInnerHTML). Native has no HTML renderer, so unwrap the
 * paragraphs into blank-line-separated plain text rather than printing tags.
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function EventDetailScreen(): React.ReactElement {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const p = usePalette();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { t } = useLocale();

  const eventQ = useQuery({
    queryKey: ['events', 'detail', slug],
    queryFn: () => fetchEvent(slug),
    enabled: !!slug,
  });

  const event = eventQ.data;
  const paymentsOn = paymentsEnabled();

  // Approved reviews + aggregate (best-effort; never blocks the page).
  const reviewsQ = useQuery({
    queryKey: ['events', 'reviews', slug],
    queryFn: () =>
      api.get<ReviewsResponse>(`/api/public/events/${encodeURIComponent(slug)}/reviews`, {
        query: { limit: 5 },
      }),
    enabled: !!slug,
    staleTime: 60_000,
  });

  // Same-category "similar events" rail (mirrors web). Excludes the current event.
  const categorySlug = event?.category?.slug ?? '';
  const similarQ = useQuery({
    queryKey: ['events', 'similar', categorySlug],
    queryFn: () =>
      api.get<{ data: MobileEvent[] }>('/api/public/events', {
        query: { category: categorySlug, limit: 7, sort: 'date-desc' },
      }),
    enabled: !!categorySlug,
    staleTime: 60_000,
  });
  const similarEvents = (similarQ.data?.data ?? []).filter((e) => e.id !== event?.id).slice(0, 6);

  const shareUrl = `${API_BASE_URL}/events/${slug}`;
  const onShare = () => {
    if (!event) return;
    void Share.share({ message: `${event.title}\n${shareUrl}`, url: shareUrl, title: event.title });
  };
  const onAddToCalendar = () => {
    void Linking.openURL(`${API_BASE_URL}/api/public/events/${encodeURIComponent(slug)}/calendar`);
  };

  const [selectedTierId, setSelectedTierId] = React.useState<string | null>(null);

  const selectableTiers = React.useMemo(() => {
    const all = event?.ticket_tiers ?? [];
    return paymentsOn ? all : all.filter((t) => t.price === 0);
  }, [event, paymentsOn]);

  const register = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('Event not loaded');
      const tier = selectableTiers.find((t) => t.id === selectedTierId) ?? selectableTiers[0] ?? null;
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
      void qc.invalidateQueries({ queryKey: ['events', 'detail', slug] });
      void qc.invalidateQueries({ queryKey: ['tickets'] });
      void qc.invalidateQueries({ queryKey: ['registrations'] });

      if (res.registration.status === 'pending_payment' && res.checkout_url && paymentsOn) {
        router.push({
          pathname: '/payment/webview',
          params: { url: res.checkout_url, registrationId: res.registration.id },
        });
      }
      // Free path falls through — `register.isSuccess` drives the success card.
    },
  });

  React.useEffect(() => {
    if (event && !selectedTierId && selectableTiers.length > 0) {
      setSelectedTierId(selectableTiers[0].id);
    }
    if (selectedTierId && !selectableTiers.some((t) => t.id === selectedTierId)) {
      setSelectedTierId(null);
    }
  }, [event, selectableTiers, selectedTierId]);

  const isFree = event?.ticket_type === 'free';
  const registered = register.isSuccess && register.data?.registration.status === 'confirmed';

  const errorMessage =
    register.error instanceof ApiClientError
      ? register.error.message
      : register.error instanceof Error
        ? register.error.message
        : null;

  const onRegisterPress = () => {
    if (!user) {
      router.push({ pathname: '/auth/login', params: { redirect: `/event/${slug}` } });
      return;
    }
    if (!event) return;
    register.mutate();
  };

  const soldPercent = event && event.capacity > 0
    ? Math.min(100, Math.round((event.registrations_count / event.capacity) * 100))
    : null;

  const description = event?.description ? htmlToPlainText(event.description) : null;

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {eventQ.isLoading ? (
          <View>
            <Skeleton height={320} radius={0} />
            <View style={{ padding: spacing.md, gap: spacing.md }}>
              <Skeleton height={28} width="70%" />
              <Skeleton height={16} width="40%" />
              <Skeleton height={140} radius={radius.lg} />
            </View>
          </View>
        ) : null}

        {eventQ.error ? (
          <SafeAreaView edges={['top']}>
            <View style={{ padding: spacing.lg }}>
              <EmptyState
                icon="alert-circle-outline"
                title="Couldn't load this event"
                description={
                  eventQ.error instanceof ApiClientError ? eventQ.error.message : 'Try again later.'
                }
                action={{ label: 'Go back', onClick: () => router.back() }}
              />
            </View>
          </SafeAreaView>
        ) : null}

        {event ? (
          <>
            {/* ── Immersive hero ── */}
            <EventImage
              uri={event.banner_image}
              title={event.title}
              categorySlug={event.category?.slug}
              style={styles.hero}
            >
              <Scrim colors={gradients.scrim} locations={[0, 0.4, 1]} />

              <SafeAreaView edges={['top']} style={styles.heroSafe}>
                <View style={styles.heroTopRow}>
                  <Pressable
                    onPress={() => router.back()}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    style={styles.glassButton}
                  >
                    <Ionicons name="chevron-back" size={20} color={colors.white} />
                  </Pressable>
                  <View style={styles.heroTopRight}>
                    {event.is_featured ? (
                      <View style={styles.featuredPill}>
                        <Ionicons name="star" size={10} color={colors.white} />
                        <Text style={styles.featuredPillText}>{t('event.featured')}</Text>
                      </View>
                    ) : null}
                    <Pressable
                      onPress={onShare}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={t('event.share')}
                      style={styles.glassButton}
                    >
                      <Ionicons name="share-social-outline" size={18} color={colors.white} />
                    </Pressable>
                  </View>
                </View>
              </SafeAreaView>

              <View style={styles.heroBody}>
                {event.category ? (
                  <CategoryPill
                    label={event.category.name}
                    category={event.category}
                    variant="glass"
                    showIcon
                  />
                ) : null}
                <Text style={styles.heroTitle} numberOfLines={3}>
                  {event.title}
                </Text>
                {event.organizer ? (
                  <View style={styles.heroOrganizer}>
                    <Ionicons name="person-circle-outline" size={16} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.heroOrganizerName} numberOfLines={1}>
                      {event.organizer.name}
                    </Text>
                    {event.organizer.is_verified ? (
                      <Ionicons name="checkmark-circle" size={13} color={colors.primaryLight} />
                    ) : null}
                  </View>
                ) : null}
              </View>
            </EventImage>

            <View style={styles.body}>
              {/* ── Success ── */}
              {registered ? (
                <View style={[styles.successCard, { backgroundColor: p.successMuted, borderColor: colors.success }]}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <View style={styles.flexMin}>
                    <Text style={[styles.successTitle, { color: p.text }]}>You're registered</Text>
                    <Text style={[styles.successBody, { color: p.textMuted }]}>
                      {register.data?.ticket?.ticket_number
                        ? `Ticket ${register.data.ticket.ticket_number} is in My Tickets.`
                        : 'Your ticket is in My Tickets.'}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* ── When & where ── */}
              <Card padding="md" variant="default">
                <View style={styles.metaList}>
                  <MetaRow
                    icon="calendar"
                    label="Starts"
                    value={formatDateTime(event.start_date)}
                  />
                  <MetaRow icon="time" label="Ends" value={formatDateTime(event.end_date)} />
                  {event.venue_name ? (
                    <MetaRow
                      icon="location"
                      label="Venue"
                      value={event.venue_name}
                      sub={event.venue_address ?? event.sub_city ?? undefined}
                    />
                  ) : null}
                </View>
              </Card>

              {/* ── Capacity ── */}
              {soldPercent !== null ? (
                <View style={styles.capacityBlock}>
                  <View style={styles.capacityRow}>
                    <Text style={[styles.capacityLabel, { color: p.textMuted }]}>
                      {event.registrations_count.toLocaleString()} of {event.capacity.toLocaleString()} registered
                    </Text>
                    <Text style={[styles.capacityPct, { color: colors.primary }]}>{soldPercent}%</Text>
                  </View>
                  <View style={[styles.capacityTrack, { backgroundColor: p.surfaceMuted }]}>
                    <View
                      style={[
                        styles.capacityFill,
                        { width: `${Math.max(soldPercent, 2)}%`, backgroundColor: colors.primary },
                      ]}
                    />
                  </View>
                </View>
              ) : null}

              {/* ── Quick actions ── */}
              <View style={styles.actionRow}>
                <View style={styles.flexBtn}>
                  <Button
                    label={t('event.addToCalendar')}
                    variant="outline"
                    leftIcon="calendar-outline"
                    fullWidth
                    onPress={onAddToCalendar}
                  />
                </View>
                <View style={styles.flexBtn}>
                  <Button
                    label={t('event.share')}
                    variant="outline"
                    leftIcon="share-social-outline"
                    fullWidth
                    onPress={onShare}
                  />
                </View>
              </View>

              {/* ── About ── */}
              {description ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: p.text }]}>{t('event.about')}</Text>
                  <Text style={[styles.description, { color: p.text }]}>{description}</Text>
                </View>
              ) : null}

              {/* ── Tags ── */}
              {event.tags && event.tags.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: p.text }]}>{t('event.tags')}</Text>
                  <View style={styles.tagRow}>
                    {event.tags.map((tag) => (
                      <View
                        key={tag}
                        style={[styles.tagChip, { backgroundColor: p.surfaceMuted, borderColor: p.border }]}
                      >
                        <Text style={[styles.tagText, { color: p.textMuted }]}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* ── AI summary (signed-in only) ── */}
              <EventSummaryCard eventId={event.id} />

              {/* ── Tiers ── */}
              {event.ticket_tiers && event.ticket_tiers.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: p.text }]}>Tickets</Text>
                  <View style={{ gap: spacing.sm }}>
                    {event.ticket_tiers.map((tier) => {
                      const remaining = Math.max(0, tier.capacity - tier.sold_count);
                      const soldOut = remaining === 0;
                      const isPaid = tier.price > 0;
                      const disabled = soldOut || (!paymentsOn && isPaid);
                      const isSelected = selectedTierId === tier.id;
                      return (
                        <Pressable
                          key={tier.id}
                          onPress={() => !disabled && setSelectedTierId(tier.id)}
                          disabled={disabled}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected, disabled }}
                          style={[
                            styles.tier,
                            {
                              backgroundColor: p.surface,
                              borderColor: isSelected ? colors.primary : p.border,
                              borderWidth: isSelected ? 2 : 1,
                            },
                            disabled ? styles.tierDisabled : null,
                          ]}
                        >
                          <View style={styles.flexMin}>
                            <Text style={[styles.tierName, { color: p.text }]}>{tier.name}</Text>
                            {tier.description ? (
                              <Text style={[styles.tierDescription, { color: p.textMuted }]} numberOfLines={2}>
                                {tier.description}
                              </Text>
                            ) : null}
                            <Text style={[styles.tierMeta, { color: p.textMuted }]}>
                              {!paymentsOn && isPaid
                                ? 'On sale soon'
                                : soldOut
                                  ? 'Sold out'
                                  : `${remaining} of ${tier.capacity} left`}
                            </Text>
                          </View>
                          <View style={styles.tierRight}>
                            <Text style={[styles.tierPrice, { color: p.text }]}>
                              {tier.price === 0 ? 'Free' : formatETB(tier.price)}
                            </Text>
                            {isSelected ? (
                              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* ── Organizer ── */}
              {event.organizer ? <OrganizerCard organizer={event.organizer} /> : null}

              {/* ── Reviews ── */}
              <ReviewsSection data={reviewsQ.data} />

              {/* ── Similar events ── */}
              {similarEvents.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: p.text }]}>{t('event.similar')}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.similarRow}
                  >
                    {similarEvents.map((ev) => (
                      <View key={ev.id} style={styles.similarCard}>
                        <EventCard event={ev} variant="grid" onPress={() => router.push(`/event/${ev.slug}`)} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {/* ── Payments-off notice ── */}
              {!paymentsOn && !isFree && selectableTiers.length === 0 ? (
                <View style={[styles.notice, { backgroundColor: p.warningMuted, borderColor: colors.accent }]}>
                  <Ionicons name="time-outline" size={20} color={colors.accent} />
                  <View style={styles.flexMin}>
                    <Text style={[styles.noticeTitle, { color: p.text }]}>Tickets on sale soon</Text>
                    <Text style={[styles.noticeBody, { color: p.textMuted }]}>
                      Payments are temporarily disabled. Check back shortly.
                    </Text>
                  </View>
                </View>
              ) : null}

              {errorMessage ? (
                <View style={[styles.notice, { backgroundColor: p.destructiveMuted, borderColor: colors.destructive }]}>
                  <Ionicons name="alert-circle" size={18} color={colors.destructive} />
                  <Text style={[styles.noticeBody, styles.flexMin, { color: colors.destructive }]}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* ── Sticky CTA ── */}
      {event ? (
        <View style={[styles.cta, { borderTopColor: p.border, backgroundColor: p.surface }, shadows.lg]}>
          <SafeAreaView edges={['bottom']}>
            {registered ? (
              <Button
                label="View my tickets"
                leftIcon="ticket-outline"
                fullWidth
                onPress={() => router.push('/tickets')}
              />
            ) : (
              <Button
                label={
                  isFree ? 'Register — free' : !paymentsOn ? 'Tickets on sale soon' : 'Get tickets'
                }
                leftIcon="ticket-outline"
                loading={register.isPending}
                disabled={register.isPending || (!isFree && !paymentsOn)}
                fullWidth
                onPress={onRegisterPress}
              />
            )}
          </SafeAreaView>
        </View>
      ) : null}
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub?: string;
}): React.ReactElement {
  const p = usePalette();
  return (
    <View style={styles.metaItem}>
      <View style={[styles.metaIcon, { backgroundColor: `${colors.primary}1A` }]}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.flexMin}>
        <Text style={[styles.metaLabel, { color: p.textMuted }]}>{label}</Text>
        <Text style={[styles.metaValue, { color: p.text }]}>{value}</Text>
        {sub ? (
          <Text style={[styles.metaSub, { color: p.textMuted }]} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function OrganizerCard({ organizer }: { organizer: Organizer }): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const initial = organizer.name.slice(0, 1).toUpperCase();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: p.text }]}>{t('event.organizer')}</Text>
      <View style={[styles.orgCard, { backgroundColor: p.surface, borderColor: p.border }]}>
        <View style={styles.orgHeader}>
          {organizer.avatar_url ? (
            <ExpoImage source={{ uri: organizer.avatar_url }} style={styles.orgAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.orgAvatar, styles.orgAvatarFallback, { backgroundColor: colors.primaryMuted }]}>
              <Text style={styles.orgAvatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.flexMin}>
            <View style={styles.orgNameRow}>
              <Text style={[styles.orgName, { color: p.text }]} numberOfLines={1}>
                {organizer.name}
              </Text>
              {organizer.is_verified ? (
                <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
              ) : null}
            </View>
            <Text style={[styles.orgMeta, { color: p.textMuted }]}>
              {(organizer.events_count ?? 0)} {t('event.orgEvents')} ·{' '}
              {(organizer.total_attendees ?? 0).toLocaleString()} {t('event.orgAttendees')}
            </Text>
          </View>
        </View>
        {organizer.bio ? (
          <Text style={[styles.orgBio, { color: p.textMuted }]} numberOfLines={4}>
            {organizer.bio}
          </Text>
        ) : null}
        {organizer.website ? (
          <Pressable
            onPress={() => void Linking.openURL(organizer.website as string)}
            style={styles.orgLink}
            hitSlop={6}
            accessibilityRole="link"
          >
            <Ionicons name="globe-outline" size={14} color={colors.primary} />
            <Text style={[styles.orgLinkText, { color: colors.primary }]} numberOfLines={1}>
              {t('event.visitWebsite')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ReviewsSection({ data }: { data?: ReviewsResponse }): React.ReactElement | null {
  const p = usePalette();
  const { t } = useLocale();
  if (!data || data.aggregate.count === 0) return null;
  const { average, count } = data.aggregate;

  return (
    <View style={styles.section}>
      <View style={styles.reviewsHead}>
        <Text style={[styles.sectionTitle, { color: p.text }]}>{t('event.reviews')}</Text>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={13} color={colors.accent} />
          <Text style={[styles.ratingText, { color: p.text }]}>{average.toFixed(1)}</Text>
          <Text style={[styles.ratingCount, { color: p.textMuted }]}>({count})</Text>
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>
        {data.data.slice(0, 3).map((r) => (
          <View key={r.id} style={[styles.reviewCard, { backgroundColor: p.surface, borderColor: p.border }]}>
            <View style={styles.reviewStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < r.rating ? 'star' : 'star-outline'}
                  size={12}
                  color={colors.accent}
                />
              ))}
            </View>
            {r.title ? (
              <Text style={[styles.reviewTitle, { color: p.text }]} numberOfLines={1}>
                {r.title}
              </Text>
            ) : null}
            {r.content ? (
              <Text style={[styles.reviewBody, { color: p.textMuted }]} numberOfLines={3}>
                {r.content}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flexMin: { flex: 1, minWidth: 0 },
  content: { paddingBottom: spacing.xxl * 2 },

  // hero
  hero: { width: '100%', height: 340 },
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
  featuredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  featuredPillText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  heroBody: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    gap: spacing.sm,
  },
  heroTitle: { ...typography.display, fontSize: 26, lineHeight: 32, color: colors.white },
  heroOrganizer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroOrganizerName: { ...typography.caption, fontSize: 13, color: 'rgba(255,255,255,0.85)', flexShrink: 1 },

  body: { padding: spacing.md, gap: spacing.lg },

  // success
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  successTitle: { ...typography.bodyBold, fontSize: 14, fontWeight: '700' },
  successBody: { ...typography.caption, fontSize: 12, marginTop: 1 },

  // meta
  metaList: { gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  metaLabel: { ...typography.small, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  metaValue: { ...typography.body, fontSize: 14, fontWeight: '600', marginTop: 1 },
  metaSub: { ...typography.caption, fontSize: 12, marginTop: 1 },

  // capacity
  capacityBlock: { gap: spacing.xs + 2 },
  capacityRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  capacityLabel: { ...typography.caption, fontSize: 12 },
  capacityPct: { ...typography.bodyBold, fontSize: 13, fontWeight: '800' },
  capacityTrack: { height: 6, borderRadius: radius.full, overflow: 'hidden' },
  capacityFill: { height: '100%', borderRadius: radius.full },

  section: { gap: spacing.sm },
  sectionTitle: { ...typography.h2, fontSize: 18 },
  description: { ...typography.body, fontSize: 14, lineHeight: 22 },

  // tiers
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  tierDisabled: { opacity: 0.55 },
  tierName: { ...typography.bodyBold, fontSize: 15, fontWeight: '700' },
  tierDescription: { ...typography.caption, fontSize: 12, marginTop: 2 },
  tierMeta: { ...typography.small, fontSize: 11, marginTop: 4 },
  tierRight: { alignItems: 'flex-end', gap: 4 },
  tierPrice: { ...typography.bodyBold, fontSize: 15, fontWeight: '800' },

  // notices
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  noticeTitle: { ...typography.bodyBold, fontSize: 14, fontWeight: '700' },
  noticeBody: { ...typography.caption, fontSize: 12, marginTop: 1 },

  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },

  // hero right cluster
  heroTopRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  // quick actions
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  flexBtn: { flex: 1 },

  // tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  tagChip: { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  tagText: { ...typography.small, fontSize: 12, fontWeight: '600' },

  // similar rail
  similarRow: { gap: spacing.md, paddingRight: spacing.md },
  similarCard: { width: 260 },

  // organizer
  orgCard: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm },
  orgHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orgAvatar: { width: 48, height: 48, borderRadius: 24 },
  orgAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  orgAvatarText: { fontSize: 18, fontWeight: '800', color: colors.primaryDeep },
  orgNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orgName: { ...typography.bodyBold, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  orgMeta: { ...typography.caption, fontSize: 12, marginTop: 2 },
  orgBio: { ...typography.body, fontSize: 13, lineHeight: 19 },
  orgLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orgLinkText: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },

  // reviews
  reviewsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...typography.bodyBold, fontSize: 14, fontWeight: '800' },
  ratingCount: { ...typography.caption, fontSize: 12 },
  reviewCard: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: 5 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewTitle: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },
  reviewBody: { ...typography.caption, fontSize: 12, lineHeight: 18 },
});
