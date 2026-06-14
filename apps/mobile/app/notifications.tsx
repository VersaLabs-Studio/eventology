// ============================================================================
// Notifications screen — Phase 3 Rotation 2
// ============================================================================
// Lists the caller's notifications from /api/protected/notifications and
// supports "mark all as read" + tap-to-deep-link. Wired into the
// (tabs) layout as a 5th tab (replaces Profile in our case — see
// layout).
// ============================================================================

import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { colors, radius, spacing, typography } from '@/lib/theme';
import { formatDateTime } from '@eventology/utils';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

interface NotificationsResponse {
  data: NotificationRow[];
  meta: { total: number; unread_count: number };
}

async function fetchNotifications(): Promise<NotificationsResponse> {
  return api.get<NotificationsResponse>('/api/protected/notifications?limit=100');
}

export default function NotificationsScreen(): React.ReactElement {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const text = isDark ? colors.textDark : colors.text;
  const textMuted = isDark ? colors.textMutedDark : colors.textMuted;
  const surface = isDark ? colors.surfaceDark : colors.surface;
  const qc = useQueryClient();
  const router = useRouter();

  const notifsQ = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: fetchNotifications,
  });

  const markAll = useMutation({
    mutationFn: async () => {
      return api.patch<{ success: boolean; marked: number }>('/api/protected/notifications/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/api/protected/notifications/${id}`, { is_read: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notifsQ.data?.data ?? [];
  const unread = notifsQ.data?.meta?.unread_count ?? 0;

  const onPressNotification = (n: NotificationRow) => {
    if (!n.is_read) markOne.mutate(n.id);
    if (n.action_url) {
      // Convert web action_url to a route the mobile app can handle.
      // E.g. /my-tickets?reg=… → /(tabs)/tickets?registered=1
      // /events/{slug} → /event/[slug]
      try {
        const u = new URL(n.action_url, 'http://x');
        if (u.pathname.startsWith('/my-tickets')) {
          router.push('/(tabs)/tickets?registered=1');
        } else if (u.pathname.startsWith('/events/')) {
          const slug = u.pathname.split('/').pop()!;
          router.push(`/event/${slug}`);
        } else {
          // Fallback: open the events tab
          router.push('/(tabs)/index');
        }
      } catch {
        router.push('/(tabs)/index');
      }
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Notifications' }} />
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: text }]}>Notifications</Text>
            {unread > 0 && (
              <Text style={[styles.subtitle, { color: textMuted }]}>
                {unread} unread
              </Text>
            )}
          </View>
          {unread > 0 && (
            <Button
              size="sm"
              variant="outline"
              label="Mark all read"
              onPress={() => markAll.mutate()}
              loading={markAll.isPending}
            />
          )}
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const iconName = iconForType(item.type);
            return (
              <TouchableOpacity
                onPress={() => onPressNotification(item)}
                activeOpacity={0.7}
                style={[
                  styles.row,
                  {
                    backgroundColor: surface,
                    borderColor: item.is_read
                      ? (isDark ? colors.borderDark : colors.border)
                      : colors.primary,
                    borderLeftWidth: item.is_read ? 1 : 3,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: item.is_read ? colors.surfaceMuted : colors.primaryMuted },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={20}
                    color={item.is_read ? textMuted : colors.primary}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[
                      styles.rowTitle,
                      { color: text, fontWeight: item.is_read ? '500' : '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.rowMessage, { color: textMuted }]} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text style={[styles.rowTime, { color: textMuted }]}>
                    {formatDateTime(item.created_at)}
                  </Text>
                </View>
                {!item.is_read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            notifsQ.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height={70} radius={12} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="notifications-off-outline"
                title="No notifications yet"
                description="Updates about your registrations, events, and organizer replies appear here."
              />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={notifsQ.isFetching}
              onRefresh={() => notifsQ.refetch()}
              tintColor={colors.primary}
            />
          }
        />
      </SafeAreaView>
    </View>
  );
}

function iconForType(type: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'registration_confirmed':
      return 'checkmark-circle-outline';
    case 'event_reminder':
      return 'alarm-outline';
    case 'event_cancelled':
      return 'close-circle-outline';
    case 'event_approved':
      return 'shield-checkmark-outline';
    case 'event_rejected':
      return 'alert-circle-outline';
    case 'new_registration':
      return 'person-add-outline';
    case 'payment_received':
      return 'card-outline';
    case 'message_received':
      return 'chatbubble-outline';
    case 'system_announcement':
      return 'megaphone-outline';
    case 'payment_completed':
      return 'card-outline';
    case 'refund_processed':
      return 'arrow-undo-circle-outline';
    case 'payout_update':
      return 'cash-outline';
    case 'ticket_issued':
      return 'ticket-outline';
    default:
      return 'notifications-outline';
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  title: { ...typography.h1, fontSize: 24 },
  subtitle: { ...typography.caption, fontSize: 12, marginTop: 2 },
  list: { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14 },
  rowMessage: { fontSize: 12, marginTop: 2 },
  rowTime: { fontSize: 10, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
