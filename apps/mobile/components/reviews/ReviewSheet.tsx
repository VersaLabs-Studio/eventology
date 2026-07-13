// ============================================================================
// ReviewSheet — bottom-sheet form to submit an event review
// ============================================================================
// A modal sheet with a StarRating (required) + optional title + optional body,
// posting to POST /api/protected/reviews. The attendance gate is enforced
// server-side; this sheet reacts to its verdicts:
//   • 403 NOT_ATTENDED    → "you can review after attending"
//   • 409 ALREADY_REVIEWED → "you've already reviewed this event"
//   • 201                  → success toast row, auto-closes, caller refetches.
// Reviews are moderated (is_approved=false on the server) so a fresh review
// won't appear in the public list immediately — the success copy says as much.
// ============================================================================

import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiClientError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StarRating } from '@/components/reviews/StarRating';
import { usePalette } from '@/lib/palette';
import { useLocale } from '@/lib/i18n';
import { colors, radius, spacing, typography } from '@/lib/theme';

interface ReviewSheetProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onSubmitted?: () => void;
}

export function ReviewSheet({ visible, onClose, eventId, eventTitle, onSubmitted }: ReviewSheetProps): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();

  const [rating, setRating] = React.useState(0);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [done, setDone] = React.useState(false);

  // Reset the form each time the sheet opens.
  React.useEffect(() => {
    if (visible) {
      setRating(0);
      setTitle('');
      setContent('');
      setDone(false);
    }
  }, [visible]);

  const submit = useMutation({
    mutationFn: async () =>
      api.post('/api/protected/reviews', {
        event_id: eventId,
        rating,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
      }),
    onSuccess: () => {
      setDone(true);
      onSubmitted?.();
    },
  });

  const errorText = React.useMemo(() => {
    const e = submit.error;
    if (!(e instanceof ApiClientError)) return null;
    if (e.code === 'NOT_ATTENDED' || e.status === 403) return t('review.errNotAttended');
    if (e.code === 'ALREADY_REVIEWED' || e.status === 409) return t('review.errAlready');
    return e.message;
  }, [submit.error, t]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} accessibilityRole="button" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { backgroundColor: p.background, borderColor: p.border }]}>
            <View style={styles.handle} />

            {done ? (
              <View style={styles.doneWrap}>
                <View style={[styles.doneIcon, { backgroundColor: `${colors.success}1A` }]}>
                  <Ionicons name="checkmark-circle" size={30} color={colors.success} />
                </View>
                <Text style={[styles.doneTitle, { color: p.text }]}>{t('review.thanksTitle')}</Text>
                <Text style={[styles.doneBody, { color: p.textMuted }]}>{t('review.thanksBody')}</Text>
                <Button label={t('common.done')} fullWidth onPress={onClose} />
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: p.text }]}>{t('review.title')}</Text>
                  <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.close')}>
                    <Ionicons name="close" size={22} color={p.textMuted} />
                  </Pressable>
                </View>
                <Text style={[styles.subtitle, { color: p.textMuted }]} numberOfLines={1}>
                  {eventTitle}
                </Text>

                <View style={styles.stars}>
                  <StarRating value={rating} onChange={setRating} />
                </View>

                <Input
                  label={t('review.titleLabel')}
                  placeholder={t('review.titlePlaceholder')}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={120}
                />
                <Input
                  label={t('review.bodyLabel')}
                  placeholder={t('review.bodyPlaceholder')}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  containerStyle={styles.bodyField}
                />

                {errorText ? (
                  <View style={[styles.error, { backgroundColor: p.destructiveMuted }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{errorText}</Text>
                  </View>
                ) : null}

                <Button
                  label={t('review.submit')}
                  fullWidth
                  loading={submit.isPending}
                  disabled={rating === 0 || submit.isPending}
                  onPress={() => submit.mutate()}
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
  stars: { alignItems: 'center', paddingVertical: spacing.sm },
  bodyField: {},
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
