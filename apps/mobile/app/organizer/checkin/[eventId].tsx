// ============================================================================
// Mobile Check-in Scanner — Phase 3 Rotation 3 (P20 / B2)
// ============================================================================
// Camera-based QR scanner wired to /api/protected/check-in. HMAC verify
// stays server-side — the app only transports the scanned payload to
// the protected route. Mirrors the web check-in UX: success /
// already-checked-in / invalid states + a running count.
//
// expo-camera is pinned to SDK 54 (~16.0.0). Metro hangs at "bundling
// 100%" if the wrong version is installed.
// ============================================================================

import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api, ApiClientError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, spacing, typography } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MeOrganizer {
  organizerId: string | null;
  name: string | null;
  isVerified: boolean;
}

interface EventSummary {
  id: string;
  title: string;
  ticket_type: 'free' | 'paid';
  status: string;
  start_date: string;
  registrations_count: number;
}

interface CheckInSuccess {
  success: true;
  ticket: {
    id: string;
    ticket_number: string;
    tier_name: string;
    status: 'used';
  };
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchMe(): Promise<MeOrganizer> {
  return api.get<MeOrganizer>('/api/protected/organizers/me');
}

async function fetchEvent(eventId: string): Promise<EventSummary> {
  // The /api/public/events/[slug] endpoint is slug-based, but we have
  // the event id here. The most useful thing we can render without
  // adding a new server route is the title from the /events list. We
  // call the organizer's own events list and pluck by id.
  interface MyEventsResponse {
    data: EventSummary[];
    meta: { total: number; page: number; limit: number };
  }
  const res = await api.get<MyEventsResponse>('/api/protected/events', { query: { limit: 100 } });
  const found = res.data.find((e) => e.id === eventId);
  if (!found) throw new Error('Event not found in your organizer area');
  return found;
}

async function postCheckIn(qrData: string): Promise<CheckInSuccess> {
  return api.post<CheckInSuccess>('/api/protected/check-in', { qr_data: qrData });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ScanOutcome =
  | { kind: 'idle' }
  | { kind: 'success'; ticket: CheckInSuccess['ticket'] }
  | { kind: 'duplicate' }
  | { kind: 'invalid' };

const SCAN_COOLDOWN_MS = 1500;

export default function CheckInScannerScreen(): React.ReactElement {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const p = usePalette();
  const text = p.text;
  const textMuted = p.textMuted;
  const border = p.border;
  const surface = p.surface;
  const { t } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();

  // Resolve the caller's organizer id (defense-in-depth — the server
  // already enforces ownership, this lets us refuse the scan UI
  // before the user is even a member of the org).
  const meQ = useQuery({
    queryKey: ['organizer', 'me'],
    queryFn: fetchMe,
  });
  const eventQ = useQuery({
    queryKey: ['organizer', 'event', eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
  });

  // Camera permission
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = React.useState(true);
  const [outcome, setOutcome] = React.useState<ScanOutcome>({ kind: 'idle' });
  const [manualPayload, setManualPayload] = React.useState('');
  const lastScanRef = React.useRef<{ value: string; at: number } | null>(null);
  const [scanCount, setScanCount] = React.useState(0);

  const checkIn = useMutation({
    mutationFn: postCheckIn,
    onSuccess: (data) => {
      setOutcome({ kind: 'success', ticket: data.ticket });
      setScanCount((c) => c + 1);
      qc.invalidateQueries({ queryKey: ['organizer', 'event', eventId] });
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        if (err.code === 'ALREADY_CHECKED_IN') {
          setOutcome({ kind: 'duplicate' });
        } else if (err.code === 'INVALID_QR' || err.code === 'TICKET_NOT_FOUND') {
          setOutcome({ kind: 'invalid' });
        } else {
          setOutcome({ kind: 'invalid' });
        }
      } else {
        setOutcome({ kind: 'invalid' });
      }
    },
  });

  const handlePayload = React.useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!value) return;
      // Cooldown — avoid double-firing the same QR in rapid succession
      const now = Date.now();
      if (
        lastScanRef.current &&
        lastScanRef.current.value === value &&
        now - lastScanRef.current.at < SCAN_COOLDOWN_MS
      ) {
        return;
      }
      lastScanRef.current = { value, at: now };
      setOutcome({ kind: 'idle' });
      checkIn.mutate(value);
    },
    [checkIn]
  );

  const onBarcodeScanned = React.useCallback(
    (scan: { data: string }) => {
      if (!scanning) return;
      handlePayload(scan.data);
    },
    [scanning, handlePayload]
  );

  const onSubmitManual = () => {
    handlePayload(manualPayload);
  };

  const resetScanner = () => {
    setOutcome({ kind: 'idle' });
    setManualPayload('');
    setScanning(true);
  };

  // Not an organizer — refuse entry (rare; the area link only shows
  // for organizers anyway).
  if (!meQ.isLoading && meQ.data && !meQ.data.organizerId) {
    return (
      <View style={[styles.root, { backgroundColor: p.background }]}>
        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
          <View style={{ padding: spacing.md }}>
            <EmptyState
              icon="alert-circle-outline"
              title="Not an organizer"
              description="Only organizers can use the check-in scanner."
              action={{ label: 'Back', onClick: () => router.back() }}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: p.background }]}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <Stack.Screen options={{ title: eventQ.data?.title ?? t('organizer.scannerTitle') }} />
        <ScrollView contentContainerStyle={styles.content}>
          {/* Event header */}
          <Card padding="md">
            {eventQ.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                <Skeleton height={20} width="60%" />
                <Skeleton height={14} width="40%" />
              </View>
            ) : eventQ.isError ? (
              <View style={styles.errRow}>
                <Ionicons name="alert-circle" size={18} color={colors.destructive} />
                <Text style={{ color: colors.destructive, flex: 1 }}>
                  {eventQ.error instanceof ApiClientError
                    ? eventQ.error.message
                    : 'Event not found.'}
                </Text>
              </View>
            ) : eventQ.data ? (
              <View>
                <Text style={[styles.title, { color: text }]} numberOfLines={2}>
                  {eventQ.data.title}
                </Text>
                <View style={styles.metaRow}>
                  <Badge label={eventQ.data.status} variant="outline" />
                  <Text style={[styles.meta, { color: textMuted }]}>
                    {eventQ.data.registrations_count} registered
                  </Text>
                </View>
              </View>
            ) : null}
          </Card>

          {/* Camera or permission prompt */}
          {permission === null ? (
            <View style={{ padding: spacing.lg, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !permission.granted ? (
            <Card padding="md">
              <View style={{ gap: spacing.md, alignItems: 'center' }}>
                <Ionicons name="camera-outline" size={36} color={textMuted} />
                <Text style={[styles.body, { color: text, textAlign: 'center' }]}>
                  Camera access is required to scan ticket QR codes.
                </Text>
                <Button label="Grant camera access" onPress={() => requestPermission()} />
              </View>
            </Card>
          ) : (
            <View
              style={[
                styles.cameraWrap,
                { backgroundColor: surface, borderColor: border },
              ]}
            >
              <CameraView
                facing="back"
                style={StyleSheet.absoluteFill}
                onBarcodeScanned={scanning ? onBarcodeScanned : undefined}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
              {/* Reticle overlay */}
              <View pointerEvents="none" style={styles.reticleWrap}>
                <View style={[styles.reticle, { borderColor: colors.primary }]} />
                <Text style={styles.reticleHint}>
                  {scanning ? t('organizer.scannerRunning') : t('organizer.scannerStopCamera')}
                </Text>
              </View>
              <View style={styles.cameraControls}>
                <Button
                  label={scanning ? t('organizer.scannerStopCamera') : t('organizer.scannerStartCamera')}
                  variant="outline"
                  onPress={() => setScanning((s) => !s)}
                />
              </View>
            </View>
          )}

          {/* Outcome banner */}
          {outcome.kind !== 'idle' && (
            <View
              style={[
                styles.outcome,
                {
                  backgroundColor:
                    outcome.kind === 'success'
                      ? colors.primaryMuted
                      : outcome.kind === 'duplicate'
                        ? colors.accentMuted
                        : colors.destructiveMuted,
                  borderColor:
                    outcome.kind === 'success'
                      ? colors.primary
                      : outcome.kind === 'duplicate'
                        ? colors.accent
                        : colors.destructive,
                },
              ]}
            >
              <Ionicons
                name={
                  outcome.kind === 'success'
                    ? 'checkmark-circle'
                    : outcome.kind === 'duplicate'
                      ? 'time-outline'
                      : 'close-circle'
                }
                size={24}
                color={
                  outcome.kind === 'success'
                    ? colors.primary
                    : outcome.kind === 'duplicate'
                      ? colors.accent
                      : colors.destructive
                }
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.outcomeTitle, { color: text }]}>
                  {outcome.kind === 'success'
                    ? t('organizer.scannerSuccess')
                    : outcome.kind === 'duplicate'
                      ? t('organizer.scannerAlreadyCheckedIn')
                      : t('organizer.scannerInvalid')}
                </Text>
                {outcome.kind === 'success' && outcome.ticket && (
                  <Text style={[styles.outcomeMeta, { color: textMuted }]}>
                    {outcome.ticket.ticket_number} · {outcome.ticket.tier_name}
                  </Text>
                )}
                {outcome.kind === 'invalid' && checkIn.error instanceof ApiClientError && (
                  <Text style={[styles.outcomeMeta, { color: textMuted }]} numberOfLines={2}>
                    {checkIn.error.message}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Running count + reset */}
          <View style={styles.countRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.countLabel, { color: textMuted }]}>
                {t('organizer.scannerRecent')}
              </Text>
              <Text style={[styles.countValue, { color: text }]}>{scanCount}</Text>
            </View>
            {outcome.kind !== 'idle' && (
              <Button label="Scan next" variant="outline" onPress={resetScanner} />
            )}
          </View>

          {/* Manual entry fallback */}
          <Card padding="md">
            <View style={{ gap: spacing.sm }}>
              <Text style={[styles.sectionTitle, { color: text }]}>
                {t('organizer.scannerManual')}
              </Text>
              <TextInput
                value={manualPayload}
                onChangeText={setManualPayload}
                placeholder="evt_xxx.tk_xxx.sig_xxx"
                placeholderTextColor={textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                style={[
                  styles.input,
                  { color: text, backgroundColor: surface, borderColor: border },
                ]}
                accessibilityLabel="QR payload"
              />
              <Button
                label="Check in"
                leftIcon="checkmark-circle-outline"
                onPress={onSubmitManual}
                disabled={!manualPayload.trim() || checkIn.isPending}
              />
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
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.h2, fontSize: 17 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  meta: { ...typography.caption, fontSize: 12 },
  body: { ...typography.body, fontSize: 14 },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cameraWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  reticleWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  reticle: {
    width: '60%',
    aspectRatio: 1,
    borderWidth: 3,
    borderRadius: radius.lg,
    backgroundColor: 'transparent',
  },
  reticleHint: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cameraControls: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  outcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  outcomeTitle: { ...typography.bodyBold, fontSize: 14, fontWeight: '700' },
  outcomeMeta: { ...typography.caption, fontSize: 12, marginTop: 2 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  countLabel: { ...typography.caption, fontSize: 11, textTransform: 'uppercase' },
  countValue: { ...typography.h2, fontSize: 22, fontWeight: '800' },
  sectionTitle: { ...typography.bodyBold, fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 60,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    fontFamily: 'monospace',
  },
});
