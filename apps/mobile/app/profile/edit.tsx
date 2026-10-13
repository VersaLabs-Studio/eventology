// ============================================================================
// Edit Profile — write-flow (HO-3)
// ============================================================================
// Form for full_name, phone, bio, avatar_url. PUTs to /api/protected/profile
// (server whitelists those fields — we never send anything else). On success
// we call useAuth().refresh() so the identity card on the Account tab updates
// without an app restart, and invalidate the profile query.
//
// Mirrors the web profile-edit pattern: load current values, edit, save.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, shadows, spacing, typography } from '@/lib/theme';

interface ProfileResponse {
  id: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
}

async function fetchProfile(): Promise<ProfileResponse> {
  return api.get<ProfileResponse>('/api/protected/profile');
}

export default function EditProfileScreen(): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: fetchProfile,
    enabled: !!user,
  });

  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');

  // Seed the form once the profile loads.
  React.useEffect(() => {
    if (profileQ.data) {
      setFullName(profileQ.data.full_name ?? '');
      setPhone(profileQ.data.phone ?? '');
      setBio(profileQ.data.bio ?? '');
      setAvatarUrl(profileQ.data.avatar_url ?? '');
    }
  }, [profileQ.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return api.put<ProfileResponse>('/api/protected/profile', {
        full_name: fullName,
        phone: phone || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      });
    },
    onSuccess: async () => {
      await refresh();
      qc.invalidateQueries({ queryKey: ['profile', 'me'] });
      router.back();
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
      <Text style={[styles.topbarTitle, { color: p.text }]}>{t('profileEdit.title')}</Text>
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

  if (profileQ.isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: p.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={styles.flex}>
          {header}
          <View style={styles.body}>
            <Skeleton height={52} radius={radius.md} />
            <Skeleton height={52} radius={radius.md} />
            <Skeleton height={96} radius={radius.md} />
            <Skeleton height={52} radius={radius.md} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (profileQ.isError) {
    return (
      <View style={[styles.root, { backgroundColor: p.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView edges={['top']} style={styles.flex}>
          {header}
          <View style={styles.signedOut}>
            <Text style={[styles.signedOutText, { color: p.textMuted }]}>
              {t('profileEdit.loadError')}
            </Text>
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
          <Input
            label={t('profile.fullName')}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('profile.fullNamePlaceholder')}
            leftIcon="person-outline"
          />
          <Input
            label={t('profile.phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('profile.phonePlaceholder')}
            leftIcon="call-outline"
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <Input
            label={t('profile.bio')}
            value={bio}
            onChangeText={setBio}
            placeholder={t('profile.bioPlaceholder')}
            leftIcon="document-text-outline"
            multiline
            numberOfLines={3}
            containerStyle={styles.bioInput}
          />
          <Input
            label={t('profileEdit.avatarUrl')}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder={t('profileEdit.avatarUrlPlaceholder')}
            leftIcon="image-outline"
            autoCapitalize="none"
            keyboardType="url"
          />

          {saveMutation.isError ? (
            <Text style={[styles.error, { color: p.destructive }]}>{t('profile.saveFailed')}</Text>
          ) : null}

          <Button
            label={saveMutation.isPending ? t('profileEdit.submitting') : t('profile.saveChanges')}
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
  bioInput: { minHeight: 88, textAlignVertical: 'top' },
  signedOut: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  signedOutText: { ...typography.body, textAlign: 'center' },
  error: { ...typography.small, fontSize: 12 },
});
