// ============================================================================
// Notification Preferences — write-flow (HO-3)
// ============================================================================
// Loads the caller's notification_preferences (GET) and lets them toggle
// email / sms / push / marketing channels, plus optional quiet hours. PATCHes
// the changed subset to /api/protected/notification-preferences. Re-entering
// the screen shows the saved state because we read it fresh from the server.
//
// Mirrors the web notification-preferences page (apps/web/src/app/(dashboard)/…).

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, shadows, spacing, typography } from '@/lib/theme';

interface NotificationPrefs {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  marketing_opt_in: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

async function fetchPrefs(): Promise<NotificationPrefs> {
  return api.get<NotificationPrefs>('/api/protected/notification-preferences');
}

type IoniconName = keyof typeof Ionicons.glyphMap;

interface ToggleRowProps {
  icon: IoniconName;
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

function ToggleRow({ icon, label, hint, value, onValueChange }: ToggleRowProps): React.ReactElement {
  const p = usePalette();
  return (
    <View style={[styles.rowGroup, { backgroundColor: p.surface, borderColor: p.border }]}>
      <View style={styles.switchRow}>
        <Ionicons name={icon} size={19} color={p.textMuted} />
        <View style={styles.flexMin}>
          <Text style={[styles.switchLabel, { color: p.text }]}>{label}</Text>
          {hint ? <Text style={[styles.switchHint, { color: p.textMuted }]}>{hint}</Text> : null}
        </View>
        <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
      </View>
    </View>
  );
}

export default function NotificationPrefsScreen(): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const prefsQ = useQuery({
    queryKey: ['profile', 'notification-prefs'],
    queryFn: fetchPrefs,
    enabled: !!user,
  });

  const [email, setEmail] = React.useState(false);
  const [sms, setSms] = React.useState(false);
  const [push, setPush] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);

  React.useEffect(() => {
    if (prefsQ.data) {
      setEmail(prefsQ.data.email_enabled);
      setSms(prefsQ.data.sms_enabled);
      setPush(prefsQ.data.push_enabled);
      setMarketing(prefsQ.data.marketing_opt_in);
    }
  }, [prefsQ.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return api.patch<NotificationPrefs>('/api/protected/notification-preferences', {
        email_enabled: email,
        sms_enabled: sms,
        push_enabled: push,
        marketing_opt_in: marketing,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'notification-prefs'] });
    },
  });

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
      <Text style={[styles.topbarTitle, { color: p.text }]}>{t('profileNotifications.title')}</Text>
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

  if (prefsQ.isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: p.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={styles.flex}>
          {header}
          <View style={styles.body}>
            <Skeleton height={56} radius={radius.lg} />
            <Skeleton height={56} radius={radius.lg} />
            <Skeleton height={56} radius={radius.lg} />
            <Skeleton height={56} radius={radius.lg} />
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
          <Text style={[styles.subtitle, { color: p.textMuted }]}>
            {t('profileNotifications.subtitle')}
          </Text>

          <ToggleRow
            icon="mail-outline"
            label={t('profileNotifications.email')}
            value={email}
            onValueChange={setEmail}
          />
          <ToggleRow
            icon="chatbubble-outline"
            label={t('profileNotifications.sms')}
            value={sms}
            onValueChange={setSms}
          />
          <ToggleRow
            icon="phone-portrait-outline"
            label={t('profileNotifications.push')}
            value={push}
            onValueChange={setPush}
          />
          <ToggleRow
            icon="megaphone-outline"
            label={t('profileNotifications.marketing')}
            value={marketing}
            onValueChange={setMarketing}
          />

          {saveMutation.isError ? (
            <Text style={[styles.error, { color: p.destructive }]}>{t('profileNotifications.saveFailed')}</Text>
          ) : null}
          {saveMutation.isSuccess ? (
            <Text style={[styles.success, { color: colors.primary }]}>{t('profileNotifications.saved')}</Text>
          ) : null}

          <Button
            label={saveMutation.isPending ? t('profileNotifications.saving') : t('profileNotifications.save')}
            loading={saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
            fullWidth
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  flexMin: { flex: 1, minWidth: 0 },
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
  subtitle: { ...typography.body, fontSize: 13 },
  rowGroup: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  switchLabel: { ...typography.body, fontSize: 15, fontWeight: '500' },
  switchHint: { ...typography.caption, fontSize: 12, marginTop: 1 },
  signedOut: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  signedOutText: { ...typography.body, textAlign: 'center' },
  error: { ...typography.small, fontSize: 12 },
  success: { ...typography.small, fontSize: 12, fontWeight: '700' },
});
