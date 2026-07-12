// ============================================================================
// EventSummaryCard — AI TL;DR for an event (mobile)
// ============================================================================
// The native counterpart of the web's AIEventSummary. A signed-in user taps
// "Summarize with AI"; we call POST /api/protected/ai/event-summary and render
// a 2-3 sentence summary + highlight chips. Best-effort — a failure shows a
// retry, never blocks the page. Hidden entirely for signed-out users (the
// route is auth-gated).
// ============================================================================

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { fetchEventSummary, type AiEventSummary } from '@/lib/ai';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, spacing, typography } from '@/lib/theme';

export function EventSummaryCard({ eventId }: { eventId: string }): React.ReactElement | null {
  const p = usePalette();
  const { t } = useLocale();
  const { user } = useAuth();

  const summarize = useMutation<AiEventSummary | null, Error>({
    mutationFn: () => fetchEventSummary(eventId),
  });

  // The route is auth-gated; don't dangle a button that would bounce to login.
  if (!user) return null;

  const data = summarize.data;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.sparkChip, { backgroundColor: `${colors.primary}1A` }]}>
            <Ionicons name="sparkles" size={13} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: p.text }]}>{t('ai.aiSummary')}</Text>
        </View>

        {!data ? (
          <Pressable
            onPress={() => summarize.mutate()}
            disabled={summarize.isPending}
            accessibilityRole="button"
            style={[styles.action, { borderColor: p.border, backgroundColor: p.surface }]}
          >
            {summarize.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
            )}
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {summarize.isPending ? t('ai.summarizing') : t('ai.summarize')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {data ? (
        <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
          <Text style={[styles.summaryText, { color: p.text }]}>{data.summary}</Text>
          {data.highlights.length > 0 ? (
            <View style={styles.highlights}>
              {data.highlights.map((h, i) => (
                <View key={`${i}-${h.slice(0, 12)}`} style={styles.highlightRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={[styles.highlightText, { color: p.textMuted }]}>{h}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={[styles.disclaimer, { color: p.textSubtle }]}>{t('ai.poweredByAi')}</Text>
        </View>
      ) : summarize.isError ? (
        <Pressable onPress={() => summarize.mutate()} style={styles.errorRow} accessibilityRole="button">
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
  title: { ...typography.h2, fontSize: 18 },
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
  summaryText: { ...typography.body, fontSize: 14, lineHeight: 22 },
  highlights: { gap: 6 },
  highlightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  highlightText: { ...typography.caption, fontSize: 13, flex: 1, lineHeight: 19 },
  disclaimer: { ...typography.small, fontSize: 10, fontStyle: 'italic' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { ...typography.caption, fontSize: 12 },
});
