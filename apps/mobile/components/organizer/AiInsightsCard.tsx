// ============================================================================
// AiInsightsCard — organizer attendee insights (V1.5 closeout)
// ============================================================================
// On-demand button → POST /api/protected/ai/organizer {task:'insights',
// event_id, input}. Renders insight bullets + attendance rate + peak period
// + recommendations. Stub-provider output is expected until a live model.
// Modeled on EventSummaryCard.
// ============================================================================

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface InsightsInput {
  event_title: string;
  total_registrations: number;
  checked_in_count: number;
  cancelled_count: number;
  ticket_tiers?: Array<{ name: string; sold: number; capacity: number }>;
  top_sub_cities?: string[];
}

interface InsightsOutput {
  insights?: string[];
  attendance_rate?: number;
  peak_registration_period?: string;
  recommendations?: string[];
}

interface InsightsResponse {
  ok: boolean;
  task: string;
  data: InsightsOutput | null;
}

export function AiInsightsCard({
  eventId,
  input,
}: {
  eventId: string;
  input: InsightsInput;
}): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();

  const run = useMutation<InsightsResponse, Error>({
    mutationFn: () =>
      api.post<InsightsResponse>('/api/protected/ai/organizer', {
        task: 'insights',
        event_id: eventId,
        input,
      }),
  });

  const data = run.data?.data;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.sparkChip, { backgroundColor: `${colors.primary}1A` }]}>
            <Ionicons name="sparkles" size={13} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: p.text }]}>{t('organizer.insights.title')}</Text>
        </View>

        {!data ? (
          <Pressable
            onPress={() => run.mutate()}
            disabled={run.isPending}
            accessibilityRole="button"
            style={[styles.action, { borderColor: p.border, backgroundColor: p.surface }]}
          >
            {run.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
            )}
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {run.isPending ? t('organizer.insights.generating') : t('organizer.insights.generate')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {data ? (
        <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
          {typeof data.attendance_rate === 'number' ? (
            <View style={styles.metricRow}>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {Math.round(data.attendance_rate)}%
              </Text>
              <Text style={[styles.metricLabel, { color: p.textMuted }]}>
                {t('organizer.insights.attendanceRate')}
              </Text>
            </View>
          ) : null}

          {data.peak_registration_period ? (
            <Text style={[styles.peak, { color: p.textMuted }]}>
              {`${t('organizer.insights.peak')}: ${data.peak_registration_period}`}
            </Text>
          ) : null}

          {(data.insights ?? []).map((line, i) => (
            <View key={`ins-${i}`} style={styles.bulletRow}>
              <Ionicons name="analytics-outline" size={14} color={colors.primary} />
              <Text style={[styles.bulletText, { color: p.text }]}>{line}</Text>
            </View>
          ))}

          {(data.recommendations ?? []).length > 0 ? (
            <>
              <Text style={[styles.subhead, { color: p.text }]}>
                {t('organizer.insights.recommendations')}
              </Text>
              {(data.recommendations ?? []).map((line, i) => (
                <View key={`rec-${i}`} style={styles.bulletRow}>
                  <Ionicons name="bulb-outline" size={14} color={colors.accent} />
                  <Text style={[styles.bulletText, { color: p.textMuted }]}>{line}</Text>
                </View>
              ))}
            </>
          ) : null}

          <Text style={[styles.disclaimer, { color: p.textSubtle }]}>{t('ai.poweredByAi')}</Text>
        </View>
      ) : run.isError ? (
        <Pressable onPress={() => run.mutate()} style={styles.errorRow} accessibilityRole="button">
          <Ionicons name="alert-circle-outline" size={15} color={p.textMuted} />
          <Text style={[styles.errorText, { color: p.textMuted }]}>
            {t('ai.assistantUnavailable')} {t('ai.retry')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sparkChip: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h2, fontSize: 16 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  actionText: { ...typography.small, fontSize: 12, fontWeight: '700' },
  card: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  metricValue: { ...typography.h1, fontSize: 28, fontWeight: '800' },
  metricLabel: { ...typography.caption, fontSize: 12 },
  peak: { ...typography.caption, fontSize: 13 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { ...typography.caption, fontSize: 13, flex: 1, lineHeight: 19 },
  subhead: { ...typography.bodyBold, fontSize: 13, marginTop: spacing.xs },
  disclaimer: { ...typography.small, fontSize: 10, fontStyle: 'italic' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { ...typography.caption, fontSize: 12 },
});
