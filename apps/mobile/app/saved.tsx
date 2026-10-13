// ============================================================================
// Saved Events — HO-1 surface on mobile (HO-3)
// ============================================================================
// Lists the caller's saved events (GET /api/protected/saved-events, which
// returns the full event-card shape) in a vertical grid of EventCards. Each
// card has an unsave affordance that DELETEs /api/protected/saved-events/[id]
// and removes the row optimistically. Signed-out shows a sign-in prompt.
//
// The saved-events endpoint already returns the MobileEvent shape (the server
// flattens the join), so EventCard renders unchanged.

import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, shadows, spacing, typography } from '@/lib/theme';

interface SavedResponse {
  data: MobileEvent[];
  meta: { total: number; page: number; limit: number };
}

async function fetchSaved(): Promise<SavedResponse> {
  return api.get<SavedResponse>('/api/protected/saved-events?limit=100');
}

export default function SavedScreen(): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const savedQ = useQuery({
    queryKey: ['saved', 'events'],
    queryFn: fetchSaved,
    enabled: !!user,
  });

  // F4: optimistic unsave — remove from cache immediately, rollback on failure.
  const unsaveMutation = useMutation({
    mutationFn: async (eventId: string) =>
      api.delete(`/api/protected/saved-events/${eventId}`),
    onMutate: async (eventId) => {
      await qc.cancelQueries({ queryKey: ['saved', 'events'] });
      const previousData = qc.getQueryData<SavedResponse>(['saved', 'events']);
      if (previousData) {
        qc.setQueryData(
          ['saved', 'events'],
          {
            ...previousData,
            data: previousData.data.filter((e) => e.id !== eventId),
          }
        );
      }
      return { previousData };
    },
    onError: (_err, _eventId, context) => {
      if (context?.previousData) {
        qc.setQueryData(['saved', 'events'], context.previousData);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['saved', 'events'] });
    },
  });

  const events = savedQ.data?.data ?? [];

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
      <Text style={[styles.topbarTitle, { color: p.text }]}>{t('saved.title')}</Text>
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
            <EmptyState
              icon="bookmark-outline"
              title={t('saved.signInTitle')}
              description={t('saved.signInBody')}
              action={{ label: t('common.signIn'), onClick: () => router.push('/auth/login' as never) }}
            />
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
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <EventCard event={item} onPress={() => router.push(`/event/${item.slug}` as never)} />
              <Pressable
                onPress={() => unsaveMutation.mutate(item.id)}
                accessibilityRole="button"
                accessibilityLabel={t('saved.unsave')}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.unsaveBtn,
                  { backgroundColor: p.surface, borderColor: p.border },
                  pressed ? { opacity: 0.7 } : null,
                ]}
              >
                <Ionicons
                  name={unsaveMutation.isPending ? 'hourglass-outline' : 'bookmark'}
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.unsaveText, { color: colors.primary }]}>
                  {t('saved.unsave')}
                </Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            savedQ.isLoading ? (
              <View style={{ gap: spacing.md }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={200} radius={radius.lg} />
                ))}
              </View>
            ) : savedQ.isError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title={t('saved.loadErrorTitle')}
                description={t('saved.loadErrorBody')}
              />
            ) : (
              <EmptyState
                icon="bookmark-outline"
                title={t('saved.emptyTitle')}
                description={t('saved.emptyBody')}
                action={{ label: t('saved.discover'), onClick: () => router.push('/' as never) }}
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={savedQ.isFetching}
              onRefresh={() => savedQ.refetch()}
              tintColor={colors.primary}
            />
          }
        />
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
  list: { padding: spacing.md, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xxl },
  cardWrap: { gap: spacing.xs },
  unsaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  unsaveText: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },
  signedOut: { flex: 1, justifyContent: 'center', padding: spacing.lg },
});
