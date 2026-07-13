// ============================================================================
// NearbyRail — "Events near you" (Part 2 §3.12 / §3.1 NearbyEventsSection)
// ============================================================================
// Foreground-location proximity rail. Renders nothing until the user opts in:
//   • permission undetermined → a compact "Enable location" prompt card
//   • granted                 → horizontal EventCard rail with a distance chip
//   • denied / no results     → hidden (graceful degradation, per the spec)
// Consumes GET /api/public/events/nearby (migration 034 RPC). Location is only
// requested on tap, never silently on mount.
// ============================================================================

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '@/lib/api';
import { EventCard, type MobileEvent } from '@/components/EventCard';
import { usePalette } from '@/lib/palette';
import { useLocale } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/lib/theme';

type NearbyEvent = MobileEvent & { distance_m: number | null };

interface NearbyResponse {
  data: NearbyEvent[];
  meta: { total: number; page: number; limit: number };
}

export function NearbyRail({ onOpen }: { onOpen: (slug: string) => void }): React.ReactElement | null {
  const p = usePalette();
  const { t } = useLocale();
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = React.useState<'idle' | 'requesting' | 'denied'>('idle');

  // If permission was granted in a previous session, resolve coords silently.
  React.useEffect(() => {
    let active = true;
    void (async () => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (active && perm.granted) void locate();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locate = async () => {
    setStatus('requesting');
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      setStatus('denied');
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStatus('idle');
    } catch {
      setStatus('denied');
    }
  };

  const nearbyQ = useQuery({
    queryKey: ['events', 'nearby', coords?.lat, coords?.lng],
    queryFn: () =>
      api.get<NearbyResponse>('/api/public/events/nearby', {
        query: { lat: coords!.lat, lng: coords!.lng, radius: 25, limit: 10 },
      }),
    enabled: !!coords,
    staleTime: 5 * 60_000,
  });

  const events = nearbyQ.data?.data ?? [];

  // Denied → hide entirely (graceful degradation).
  if (status === 'denied') return null;

  // Not yet located → opt-in prompt.
  if (!coords) {
    return (
      <View style={styles.section}>
        <Text style={[styles.title, styles.pad, { color: p.text }]}>{t('search.nearby')}</Text>
        <Pressable
          onPress={() => void locate()}
          accessibilityRole="button"
          style={[styles.prompt, { backgroundColor: p.surface, borderColor: p.border }]}
        >
          <View style={[styles.promptIcon, { backgroundColor: `${colors.primary}1A` }]}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.flexMin}>
            <Text style={[styles.promptTitle, { color: p.text }]}>{t('search.enableLocation')}</Text>
            <Text style={[styles.promptBody, { color: p.textMuted }]} numberOfLines={2}>
              {t('search.nearbySubtitle')}
            </Text>
          </View>
          {status === 'requesting' ? (
            <Ionicons name="ellipsis-horizontal" size={18} color={p.textMuted} />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={p.textSubtle} />
          )}
        </Pressable>
      </View>
    );
  }

  // Located but nothing within radius → hide.
  if (events.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.title, styles.pad, { color: p.text }]}>{t('search.nearby')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {events.map((ev) => (
          <View key={ev.id} style={styles.card}>
            <EventCard event={ev} variant="grid" onPress={() => onOpen(ev.slug)} />
            {typeof ev.distance_m === 'number' ? (
              <View style={styles.distanceChip}>
                <Ionicons name="navigate" size={11} color={colors.primary} />
                <Text style={[styles.distanceText, { color: p.textMuted }]}>
                  {(ev.distance_m / 1000).toFixed(1)} km {t('search.away')}
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  pad: { paddingHorizontal: spacing.md },
  title: { ...typography.h2 },
  flexMin: { flex: 1, minWidth: 0 },
  row: { gap: spacing.md, paddingHorizontal: spacing.md },
  card: { width: 260, gap: spacing.xs },
  distanceChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.xs },
  distanceText: { ...typography.small, fontSize: 12, fontWeight: '600' },
  prompt: {
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  promptIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  promptTitle: { ...typography.bodyBold, fontSize: 14, fontWeight: '700' },
  promptBody: { ...typography.caption, fontSize: 12, marginTop: 1 },
});
