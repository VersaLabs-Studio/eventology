// ============================================================================
// Become Organizer — status-aware write-flow (HO-3)
// ============================================================================
// Branches its UI on the caller's organizer application status returned by
// GET /api/protected/org/become:
//   • null      → "Apply to organize" CTA (POST creates a PENDING row)
//   • 'pending' → "Application under review" (no action)
//   • 'verified'→ link to /organizer
//   • 'rejected'→ reason + reapply CTA
//
// SECURITY: the role is NEVER elevated client-side. The POST only creates a
// pending application; the server grants the organizer role only on admin
// verification. We reflect the returned status, nothing more.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, gradients, radius, shadows, spacing, typography } from '@/lib/theme';

type OrgStatus = 'pending' | 'verified' | 'rejected' | null;

interface BecomeStatus {
  status: OrgStatus;
  reason: string | null;
  name?: string | null;
}

async function fetchStatus(): Promise<BecomeStatus> {
  return api.get<BecomeStatus>('/api/protected/org/become');
}

export default function BecomeOrganizerScreen(): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const statusQ = useQuery({
    queryKey: ['org', 'become', 'status'],
    queryFn: fetchStatus,
    enabled: !!user,
  });

  const applyMutation = useMutation({
    mutationFn: async () => api.post<{ ok: true; status: OrgStatus }>('/api/protected/org/become'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org', 'become', 'status'] });
    },
  });

  const status = statusQ.data?.status ?? null;

  const header = (
    <View style={[styles.topbar, { borderBottomColor: p.border }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        style={styles.backBtn}
      >
        <Ionicons name="chevron-back" size={24} color={p.text} />
      </Pressable>
      <Text style={[styles.topbarTitle, { color: p.text }]}>{t('profileOrganizer.title')}</Text>
      <View style={styles.topbarSpacer} />
    </View>
  );

  if (!user) {
    return (
      <View style={[styles.root, { backgroundColor: p.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={styles.flex}>
          {header}
          <View style={styles.signedOut}>
            <Text style={[styles.signedOutText, { color: p.textMuted }]}>
              {t('profile.signInPrompt')}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (statusQ.isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: p.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={styles.flex}>
          {header}
          <View style={styles.body}>
            <Skeleton height={120} radius={radius.lg} />
            <Skeleton height={52} radius={radius.md} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.flex}>
        {header}
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: p.surface, borderColor: p.border }, shadows.md]}>
            <View style={[styles.heroIcon, { backgroundColor: `${colors.primary}1A` }]}>
              <Ionicons name="briefcase-outline" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: p.text }]}>{t('profileOrganizer.title')}</Text>
            <Text style={[styles.heroBody, { color: p.textMuted }]}>
              {t('orgBecome.description')}
            </Text>
          </View>

          {/* Status branches */}
          {status === null ? (
            <Button
              label={applyMutation.isPending ? t('profileEdit.submitting') : t('profileOrganizer.applyCta')}
              loading={applyMutation.isPending}
              leftIcon="briefcase-outline"
              onPress={() => applyMutation.mutate()}
              fullWidth
            />
          ) : null}

          {status === 'pending' ? (
            <View style={[styles.statusCard, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}>
              <Badge label={t('organizer.pending')} variant="warning" />
              <Text style={[styles.statusTitle, { color: p.text }]}>
                {t('profileOrganizer.statusPendingTitle')}
              </Text>
              <Text style={[styles.statusBody, { color: p.textMuted }]}>
                {t('profileOrganizer.statusPendingBody')}
              </Text>
            </View>
          ) : null}

          {status === 'verified' ? (
            <View style={[styles.statusCard, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}>
              <Badge label={t('organizer.verified')} variant="success" />
              <Text style={[styles.statusTitle, { color: p.text }]}>
                {t('profileOrganizer.statusVerifiedTitle')}
              </Text>
              <Text style={[styles.statusBody, { color: p.textMuted }]}>
                {t('profileOrganizer.statusVerifiedBody')}
              </Text>
              <Button
                label={t('profileOrganizer.goToDashboard')}
                leftIcon="arrow-forward-outline"
                onPress={() => router.push('/organizer' as never)}
                fullWidth
              />
            </View>
          ) : null}

          {status === 'rejected' ? (
            <View style={[styles.statusCard, { backgroundColor: p.surface, borderColor: p.border }, shadows.sm]}>
              <Badge label={t('events.status.rejected')} variant="destructive" />
              <Text style={[styles.statusTitle, { color: p.text }]}>
                {t('profileOrganizer.statusRejectedTitle')}
              </Text>
              <Text style={[styles.statusBody, { color: p.textMuted }]}>
                {t('profileOrganizer.statusRejectedBody')}
              </Text>
              {statusQ.data?.reason ? (
                <Text style={[styles.reason, { color: p.textMuted }]}>
                  {t('profileOrganizer.statusRejectedReason').replace('{{reason}}', statusQ.data.reason ?? '')}
                </Text>
              ) : null}
              <Button
                label={t('profileOrganizer.applyCta')}
                leftIcon="refresh-outline"
                loading={applyMutation.isPending}
                onPress={() => applyMutation.mutate()}
                fullWidth
              />
            </View>
          ) : null}

          {applyMutation.isError ? (
            <Text style={[styles.error, { color: p.destructive }]}>{t('profile.saveFailed')}</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: spacing.xs },
  topbarTitle: { ...typography.h2, fontSize: 18, marginLeft: spacing.sm },
  topbarSpacer: { width: 32 },
  body: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  hero: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...typography.h3, fontSize: 18, textAlign: 'center' },
  heroBody: { ...typography.body, fontSize: 13, textAlign: 'center', maxWidth: 300, lineHeight: 18 },
  statusCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusTitle: { ...typography.h3, fontSize: 16 },
  statusBody: { ...typography.body, fontSize: 13, lineHeight: 18 },
  reason: { ...typography.caption, fontSize: 12, fontStyle: 'italic' },
  signedOut: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  signedOutText: { ...typography.body, textAlign: 'center' },
  error: { ...typography.small, fontSize: 12 },
});
