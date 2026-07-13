// ============================================================================
// Organizer attendees — V1.5 closeout
// ============================================================================
// Per-event registrations list for the event owner, from
// GET /api/protected/events/[id]/registrations (RLS enforces ownership —
// a non-owner gets 403, rendered as a friendly state). Search by
// name/email + status filter chips + a "Message attendees" broadcast CTA.
// ============================================================================

import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api, ApiClientError } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { BroadcastSheet } from '@/components/organizer/BroadcastSheet';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { formatDateTime } from '@eventology/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RegStatus = 'confirmed' | 'checked_in' | 'waitlisted' | 'pending' | 'cancelled' | 'no_show';

interface RegistrationRow {
  id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: RegStatus;
  created_at: string;
  checked_in_at: string | null;
  ticket_tier: { name: string; price: number; currency: string } | { name: string; price: number; currency: string }[] | null;
  ticket: { id: string; ticket_number: string; status: string } | { id: string; ticket_number: string; status: string }[] | null;
}

interface RegistrationsResponse {
  data: RegistrationRow[];
  meta: { total: number };
}

function tierOf(row: RegistrationRow): { name: string } | null {
  if (!row.ticket_tier) return null;
  return Array.isArray(row.ticket_tier) ? (row.ticket_tier[0] ?? null) : row.ticket_tier;
}

const FILTERS: Array<{ key: 'all' | RegStatus; labelKey: string }> = [
  { key: 'all', labelKey: 'organizer.attendees.all' },
  { key: 'confirmed', labelKey: 'status.confirmed' },
  { key: 'checked_in', labelKey: 'status.checkedIn' },
  { key: 'waitlisted', labelKey: 'status.waitlisted' },
  { key: 'cancelled', labelKey: 'status.cancelled' },
];

function badgeVariant(status: RegStatus): 'success' | 'outline' | 'destructive' | 'warning' {
  switch (status) {
    case 'confirmed':
    case 'checked_in':
      return 'success';
    case 'waitlisted':
    case 'pending':
      return 'warning';
    case 'cancelled':
    case 'no_show':
      return 'destructive';
    default:
      return 'outline';
  }
}

function statusKey(status: RegStatus): string {
  switch (status) {
    case 'checked_in':
      return 'status.checkedIn';
    case 'no_show':
      return 'status.noShow';
    default:
      return `status.${status}`;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrganizerAttendeesScreen(): React.ReactElement {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const p = usePalette();
  const { t } = useLocale();
  const router = useRouter();

  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | RegStatus>('all');
  const [broadcastOpen, setBroadcastOpen] = React.useState(false);

  const regsQ = useQuery({
    queryKey: ['organizer', 'attendees', eventId],
    queryFn: () =>
      api.get<RegistrationsResponse>(`/api/protected/events/${eventId}/registrations`),
    enabled: !!eventId,
  });

  const rows = React.useMemo(() => {
    const all = regsQ.data?.data ?? [];
    const q = search.trim().toLowerCase();
    return all.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.attendee_name.toLowerCase().includes(q) || r.attendee_email.toLowerCase().includes(q)
      );
    });
  }, [regsQ.data, search, filter]);

  const totals = React.useMemo(() => {
    const all = regsQ.data?.data ?? [];
    return {
      confirmed: all.filter((r) => r.status === 'confirmed' || r.status === 'checked_in').length,
      checkedIn: all.filter((r) => r.status === 'checked_in').length,
    };
  }, [regsQ.data]);

  const isForbidden =
    regsQ.error instanceof ApiClientError && regsQ.error.status === 403;

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        {isForbidden ? (
          <View style={{ padding: spacing.md }}>
            <EmptyState
              icon="lock-closed-outline"
              title={t('organizer.attendees.notAuthorized')}
              description={t('organizer.attendees.notAuthorizedBody')}
              action={{ label: t('common.back'), onClick: () => router.back() }}
            />
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={regsQ.isFetching}
                onRefresh={() => regsQ.refetch()}
                tintColor={colors.primary}
              />
            }
            ListHeaderComponent={
              <View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
                {/* Summary + broadcast CTA */}
                <View style={styles.summaryRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.summaryValue, { color: p.text }]}>
                      {totals.confirmed}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: p.textMuted }]}>
                      {t('status.confirmed')}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.summaryValue, { color: p.text }]}>
                      {totals.checkedIn}
                    </Text>
                    <Text style={[styles.summaryLabel, { color: p.textMuted }]}>
                      {t('status.checkedIn')}
                    </Text>
                  </View>
                  <Button
                    label={t('organizer.broadcast.cta')}
                    leftIcon="megaphone-outline"
                    size="sm"
                    onPress={() => setBroadcastOpen(true)}
                  />
                </View>

                <Input
                  placeholder={t('organizer.attendees.searchPlaceholder')}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />

                {/* Status filter chips */}
                <View style={styles.chipRow}>
                  {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                      <Pressable
                        key={f.key}
                        onPress={() => setFilter(f.key)}
                        accessibilityRole="button"
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? colors.primary : p.surface,
                            borderColor: active ? colors.primary : p.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? colors.white : p.textMuted },
                          ]}
                        >
                          {t(f.labelKey)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const tier = tierOf(item);
              return (
                <View
                  style={[
                    styles.row,
                    { backgroundColor: p.surface, borderColor: p.border },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {item.attendee_name.trim().charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.rowName, { color: p.text }]} numberOfLines={1}>
                      {item.attendee_name}
                    </Text>
                    <Text style={[styles.rowEmail, { color: p.textMuted }]} numberOfLines={1}>
                      {item.attendee_email}
                    </Text>
                    <View style={styles.rowMeta}>
                      {tier ? (
                        <Text style={[styles.rowMetaText, { color: p.textSubtle }]} numberOfLines={1}>
                          {tier.name}
                        </Text>
                      ) : null}
                      {item.checked_in_at ? (
                        <Text style={[styles.rowMetaText, { color: p.textSubtle }]} numberOfLines={1}>
                          {formatDateTime(item.checked_in_at)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Badge label={t(statusKey(item.status))} variant={badgeVariant(item.status)} />
                </View>
              );
            }}
            ListEmptyComponent={
              regsQ.isLoading ? (
                <View style={{ gap: spacing.sm }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} height={72} radius={12} />
                  ))}
                </View>
              ) : regsQ.isError ? (
                <View style={[styles.errorBox, { backgroundColor: colors.destructiveMuted }]}>
                  <Ionicons name="alert-circle" size={18} color={colors.destructive} />
                  <Text style={{ color: colors.destructive, flex: 1, fontSize: 13 }}>
                    {regsQ.error instanceof ApiClientError
                      ? regsQ.error.message
                      : t('organizer.attendees.loadError')}
                  </Text>
                </View>
              ) : (
                <EmptyState
                  icon="people-outline"
                  title={t('organizer.attendees.empty')}
                  description={t('organizer.attendees.emptyBody')}
                />
              )
            }
          />
        )}

        {eventId ? (
          <BroadcastSheet
            visible={broadcastOpen}
            onClose={() => setBroadcastOpen(false)}
            eventId={eventId}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },

  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryValue: { ...typography.h2, fontSize: 24 },
  summaryLabel: { ...typography.caption, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { ...typography.small, fontSize: 12, fontWeight: '600' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  rowName: { ...typography.bodyBold, fontSize: 14 },
  rowEmail: { ...typography.caption, fontSize: 12, marginTop: 1 },
  rowMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: 3 },
  rowMetaText: { ...typography.small, fontSize: 10 },

  errorBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
