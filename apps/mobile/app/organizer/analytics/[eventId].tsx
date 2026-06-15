// ============================================================================
// Mobile Organizer Analytics — Phase 3 Rotation 3 (P20 / B3)
// ============================================================================
// Per-event analytics rendered with lightweight native components
// (no heavy chart deps — simple ProgressBar / Bar / Row primitives).
// Pulls /api/protected/organizers/[id]/events/[eventId]/analytics +
// /stats via the standard API client.
// ============================================================================

import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api, ApiClientError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MeOrganizer {
  organizerId: string | null;
  name: string | null;
  isVerified: boolean;
}

interface TrendPoint {
  label: string;
  value: number;
}

interface EventAnalytics {
  eventId: string;
  totalRegistrations: number;
  totalViews: number;
  conversionRate: number;
  registrationsOverTime: TrendPoint[];
  viewsOverTime: TrendPoint[];
  tierDistribution: { label: string; value: number }[];
  subCityDistribution: { label: string; value: number }[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchMe(): Promise<MeOrganizer> {
  return api.get<MeOrganizer>('/api/protected/organizers/me');
}

async function fetchEventAnalytics(organizerId: string, eventId: string): Promise<EventAnalytics> {
  return api.get<EventAnalytics>(
    `/api/protected/organizers/${organizerId}/events/${eventId}/analytics`
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrganizerAnalyticsScreen(): React.ReactElement {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const border = isDark ? colors.borderDark : colors.border;
  const surface = isDark ? colors.surfaceDark : colors.surface;
  const { t } = useLocale();
  const router = useRouter();

  const meQ = useQuery({
    queryKey: ['organizer', 'me'],
    queryFn: fetchMe,
  });
  const organizerId = meQ.data?.organizerId ?? null;

  const analyticsQ = useQuery({
    queryKey: ['organizer', 'event-analytics', organizerId, eventId],
    queryFn: () => fetchEventAnalytics(organizerId!, eventId!),
    enabled: !!organizerId && !!eventId,
  });

  if (!meQ.isLoading && meQ.data && !meQ.data.organizerId) {
    return (
      <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <View style={{ padding: spacing.md }}>
            <EmptyState
              icon="alert-circle-outline"
              title="Not an organizer"
              description="Only organizers can view analytics."
              action={{ label: 'Back', onClick: () => router.back() }}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (meQ.isLoading || analyticsQ.isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <View style={styles.content}>
            <Skeleton height={120} radius={12} />
            <Skeleton height={120} radius={12} />
            <Skeleton height={120} radius={12} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (analyticsQ.isError) {
    const msg =
      analyticsQ.error instanceof ApiClientError
        ? analyticsQ.error.message
        : 'Failed to load analytics.';
    return (
      <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <Stack.Screen options={{ title: t('organizer.analyticsTitle') }} />
          <View style={styles.content}>
            <EmptyState icon="alert-circle-outline" title="Couldn't load analytics" description={msg} />
            <Button label={t('organizer.backToEvents')} variant="outline" onPress={() => router.replace('/organizer')} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const a = analyticsQ.data!;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <Stack.Screen options={{ title: t('organizer.analyticsTitle') }} />
        <ScrollView contentContainerStyle={styles.content}>
          {/* Top-line numbers */}
          <View style={styles.statsRow}>
            <StatCard
              label={t('organizer.analyticsRegistrations')}
              value={a.totalRegistrations}
              tone="primary"
              surface={surface}
              border={border}
            />
            <StatCard
              label={t('organizer.analyticsViews')}
              value={a.totalViews}
              tone="accent"
              surface={surface}
              border={border}
            />
            <StatCard
              label={t('organizer.analyticsConversion')}
              value={`${Math.round(a.conversionRate * 100)}%`}
              tone="default"
              surface={surface}
              border={border}
            />
          </View>

          {/* Registrations trend */}
          <Card padding="md">
            <View style={{ gap: spacing.sm }}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: text }]}>
                  {t('organizer.analyticsRegistrations')}
                </Text>
                <Badge label="30d" variant="outline" />
              </View>
              <MiniBarChart points={a.registrationsOverTime} surface={surface} textMuted={textMuted} />
            </View>
          </Card>

          {/* Views trend */}
          <Card padding="md">
            <View style={{ gap: spacing.sm }}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: text }]}>{t('organizer.analyticsViews')}</Text>
                <Badge label="30d" variant="outline" />
              </View>
              <MiniBarChart points={a.viewsOverTime} surface={surface} textMuted={textMuted} />
            </View>
          </Card>

          {/* Tier distribution */}
          <Card padding="md">
            <View style={{ gap: spacing.sm }}>
              <Text style={[styles.cardTitle, { color: text }]}>
                {t('organizer.analyticsTiers')}
              </Text>
              {a.tierDistribution.length === 0 ? (
                <Text style={[styles.empty, { color: textMuted }]}>No tier data yet</Text>
              ) : (
                <DistributionList items={a.tierDistribution} total={a.totalRegistrations} color={colors.primary} text={text} textMuted={textMuted} surface={surface} border={border} />
              )}
            </View>
          </Card>

          {/* Sub-city distribution */}
          <Card padding="md">
            <View style={{ gap: spacing.sm }}>
              <Text style={[styles.cardTitle, { color: text }]}>
                {t('organizer.analyticsCities')}
              </Text>
              {a.subCityDistribution.length === 0 ? (
                <Text style={[styles.empty, { color: textMuted }]}>No sub-city data yet</Text>
              ) : (
                <DistributionList items={a.subCityDistribution} total={a.totalRegistrations} color={colors.accent} text={text} textMuted={textMuted} surface={surface} border={border} />
              )}
            </View>
          </Card>

          <Button
            label={t('organizer.backToEvents')}
            variant="ghost"
            onPress={() => router.replace('/organizer')}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  tone,
  surface,
  border,
}: {
  label: string;
  value: number | string;
  tone: 'primary' | 'accent' | 'default';
  surface: string;
  border: string;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const accent =
    tone === 'primary' ? colors.primary : tone === 'accent' ? colors.accent : colors.primary;
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: surface, borderColor: border },
      ]}
    >
      <Text style={[styles.statLabel, { color: textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: accent }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function MiniBarChart({
  points,
  surface,
  textMuted,
}: {
  points: TrendPoint[];
  surface: string;
  textMuted: string;
}) {
  if (points.length === 0) {
    return <Text style={{ color: textMuted, fontSize: 12 }}>No data</Text>;
  }
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <View style={styles.chartRow}>
      {points.map((p) => {
        const h = Math.max(2, (p.value / max) * 80);
        return (
          <View key={p.label} style={[styles.bar, { height: h, backgroundColor: surface }]} />
        );
      })}
    </View>
  );
}

function DistributionList({
  items,
  total,
  color,
  text,
  textMuted,
  surface,
  border,
}: {
  items: { label: string; value: number }[];
  total: number;
  color: string;
  text: string;
  textMuted: string;
  surface: string;
  border: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((it) => {
        const pct = total > 0 ? Math.round((it.value / total) * 100) : 0;
        return (
          <View key={it.label} style={{ gap: 4 }}>
            <View style={styles.distRow}>
              <Text style={[styles.distLabel, { color: text }]} numberOfLines={1}>
                {it.label}
              </Text>
              <Text style={[styles.distValue, { color: textMuted }]}>
                {it.value} · {pct}%
              </Text>
            </View>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: surface, borderColor: border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${pct}%`, backgroundColor: color },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  statLabel: { ...typography.caption, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { ...typography.h2, fontSize: 24, fontWeight: '800' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...typography.bodyBold, fontSize: 14, fontWeight: '700' },
  empty: { ...typography.caption, fontSize: 12 },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 80,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  distRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  distLabel: { ...typography.body, fontSize: 13, flex: 1, marginRight: spacing.sm },
  distValue: { ...typography.caption, fontSize: 11 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
