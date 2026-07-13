// ============================================================================
// BroadcastSheet — organizer one-to-many announcement (V1.5 closeout)
// ============================================================================
// Bottom-sheet form posting to POST /api/protected/events/[id]/broadcast
// {subject, body}. The server fans out to every confirmed attendee via the
// comms seam (in-app row + email/push best-effort) and rate-limits to
// 5 broadcasts/hour per organizer (429 RATE_LIMITED, surfaced clearly).
// Modeled on ReviewSheet.
// ============================================================================

import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiClientError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePalette } from '@/lib/palette';
import { useLocale } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface BroadcastResponse {
  success: boolean;
  conversation_id: string | null;
  delivered: number;
}

interface BroadcastSheetProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
}

export function BroadcastSheet({ visible, onClose, eventId }: BroadcastSheetProps): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();

  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [delivered, setDelivered] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (visible) {
      setSubject('');
      setBody('');
      setDelivered(null);
    }
  }, [visible]);

  const send = useMutation({
    mutationFn: async () =>
      api.post<BroadcastResponse>(`/api/protected/events/${eventId}/broadcast`, {
        subject: subject.trim(),
        body: body.trim(),
      }),
    onSuccess: (res) => {
      setDelivered(res.delivered ?? 0);
    },
  });

  const errorText = React.useMemo(() => {
    const e = send.error;
    if (!(e instanceof ApiClientError)) return null;
    if (e.code === 'RATE_LIMITED' || e.status === 429) return t('organizer.broadcast.errRateLimited');
    if (e.status === 403) return t('organizer.attendees.notAuthorized');
    return e.message;
  }, [send.error, t]);

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !send.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} accessibilityRole="button" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { backgroundColor: p.background, borderColor: p.border }]}>
            <View style={styles.handle} />

            {delivered !== null ? (
              <View style={styles.doneWrap}>
                <View style={[styles.doneIcon, { backgroundColor: `${colors.success}1A` }]}>
                  <Ionicons name="megaphone" size={28} color={colors.success} />
                </View>
                <Text style={[styles.doneTitle, { color: p.text }]}>
                  {t('organizer.broadcast.sentTitle')}
                </Text>
                <Text style={[styles.doneBody, { color: p.textMuted }]}>
                  {`${delivered} — ${t('organizer.broadcast.sentBody')}`}
                </Text>
                <Button label={t('common.done')} fullWidth onPress={onClose} />
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: p.text }]}>
                    {t('organizer.broadcast.title')}
                  </Text>
                  <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.close')}>
                    <Ionicons name="close" size={22} color={p.textMuted} />
                  </Pressable>
                </View>
                <Text style={[styles.subtitle, { color: p.textMuted }]}>
                  {t('organizer.broadcast.subtitle')}
                </Text>

                <Input
                  label={t('organizer.broadcast.subjectLabel')}
                  placeholder={t('organizer.broadcast.subjectPlaceholder')}
                  value={subject}
                  onChangeText={setSubject}
                  maxLength={200}
                />
                <Input
                  label={t('organizer.broadcast.bodyLabel')}
                  placeholder={t('organizer.broadcast.bodyPlaceholder')}
                  value={body}
                  onChangeText={setBody}
                  multiline
                  numberOfLines={4}
                  maxLength={4000}
                />

                {errorText ? (
                  <View style={[styles.error, { backgroundColor: p.destructiveMuted }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{errorText}</Text>
                  </View>
                ) : null}

                <Button
                  label={t('organizer.broadcast.send')}
                  fullWidth
                  loading={send.isPending}
                  disabled={!canSend}
                  onPress={() => send.mutate()}
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdropFill: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.4)',
    marginBottom: spacing.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.h2, fontSize: 20 },
  subtitle: { ...typography.caption, fontSize: 13, marginTop: -spacing.sm },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  errorText: { ...typography.caption, fontSize: 12, flex: 1 },
  doneWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  doneIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  doneTitle: { ...typography.h2, fontSize: 18 },
  doneBody: { ...typography.body, fontSize: 13, textAlign: 'center', maxWidth: 300, marginBottom: spacing.sm },
});
