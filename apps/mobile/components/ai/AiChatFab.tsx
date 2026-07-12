// ============================================================================
// AiChatFab — floating AI assistant (mobile)
// ============================================================================
// Native counterpart of the web ai-chat-widget: a FAB above the tab bar that
// opens a bottom-sheet chat. Turns hit POST /api/protected/ai/chat, which
// resolves the tier server-side (never trusts the client) and persists the
// conversation. Mounted once in the tab layout so it rides every tab.
//
// Signed-out users get a sign-in prompt instead of the composer — the chat
// route is auth-gated. Best-effort throughout: a null reply or network error
// becomes an inline "unavailable / try again" assistant line, never a crash.
// ============================================================================

import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { sendChatMessage } from '@/lib/ai';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/palette';
import { colors, radius, shadows, spacing, typography } from '@/lib/theme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

let msgSeq = 0;
const nextId = (): string => `m${++msgSeq}`;

export function AiChatFab(): React.ReactElement {
  const p = usePalette();
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = React.useState<string | undefined>(undefined);
  const [pending, setPending] = React.useState(false);
  const [escalate, setEscalate] = React.useState(false);
  const scrollRef = React.useRef<ScrollView>(null);

  const fabBottom = 58 + Math.max(insets.bottom, 8) + spacing.md;

  const scrollToEnd = React.useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const send = React.useCallback(async () => {
    const text = input.trim();
    if (!text || pending) return;
    setInput('');
    setEscalate(false);
    const userMsg: ChatMessage = { id: nextId(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setPending(true);
    scrollToEnd();
    try {
      const res = await sendChatMessage(text, sessionId, { current_page: 'mobile' });
      setSessionId(res.session_id);
      if (res.escalate_to_human) setEscalate(true);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: res.reply ?? t('ai.assistantUnavailable') },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: t('ai.connectionIssue') },
      ]);
    } finally {
      setPending(false);
      scrollToEnd();
    }
  }, [input, pending, sessionId, t, scrollToEnd]);

  const resetChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setEscalate(false);
    setInput('');
  };

  return (
    <>
      {/* FAB */}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('ai.assistantTitle')}
        style={[styles.fab, { bottom: fabBottom }, shadows.lg]}
      >
        <Ionicons name="sparkles" size={22} color={colors.white} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropFill} onPress={() => setOpen(false)} accessibilityLabel="Close" />
          <View style={[styles.sheet, { backgroundColor: p.background }]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.flex}
            >
              <SafeAreaView edges={['bottom']} style={styles.flex}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: p.border }]}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.headerChip, { backgroundColor: `${colors.primary}1A` }]}>
                      <Ionicons name="sparkles" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.headerTitle, { color: p.text }]}>{t('ai.assistantTitle')}</Text>
                      <Text style={[styles.headerSub, { color: p.textMuted }]}>{t('ai.howCanIHelp')}</Text>
                    </View>
                  </View>
                  <View style={styles.headerActions}>
                    {messages.length > 0 ? (
                      <Pressable onPress={resetChat} hitSlop={8} accessibilityLabel={t('ai.newChat')}>
                        <Text style={[styles.newChat, { color: colors.primary }]}>{t('ai.newChat')}</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => setOpen(false)} hitSlop={8} accessibilityLabel="Close">
                      <Ionicons name="close" size={22} color={p.textMuted} />
                    </Pressable>
                  </View>
                </View>

                {/* Body */}
                {!user ? (
                  <View style={styles.signedOut}>
                    <View style={[styles.headerChip, styles.bigChip, { backgroundColor: `${colors.primary}1A` }]}>
                      <Ionicons name="sparkles" size={26} color={colors.primary} />
                    </View>
                    <Text style={[styles.signedOutText, { color: p.textMuted }]}>{t('ai.signInForChat')}</Text>
                    <Pressable
                      onPress={() => {
                        setOpen(false);
                        router.push('/auth/login');
                      }}
                      style={styles.signInBtn}
                    >
                      <Text style={styles.signInBtnText}>{t('auth.signIn')}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <ScrollView
                      ref={scrollRef}
                      contentContainerStyle={styles.messages}
                      keyboardShouldPersistTaps="handled"
                      onContentSizeChange={scrollToEnd}
                    >
                      {messages.length === 0 ? (
                        <View style={styles.empty}>
                          <Text style={[styles.emptyText, { color: p.textSubtle }]}>
                            {t('ai.askMeAnything')}
                          </Text>
                        </View>
                      ) : null}

                      {messages.map((m) => (
                        <View
                          key={m.id}
                          style={[
                            styles.bubble,
                            m.role === 'user'
                              ? [styles.bubbleUser, { backgroundColor: colors.primary }]
                              : [styles.bubbleBot, { backgroundColor: p.surface, borderColor: p.border }],
                          ]}
                        >
                          <Text
                            style={[
                              styles.bubbleText,
                              { color: m.role === 'user' ? colors.white : p.text },
                            ]}
                          >
                            {m.text}
                          </Text>
                        </View>
                      ))}

                      {pending ? (
                        <View style={[styles.bubble, styles.bubbleBot, { backgroundColor: p.surface, borderColor: p.border }]}>
                          <View style={styles.thinkingRow}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={[styles.bubbleText, { color: p.textMuted }]}>{t('ai.thinking')}</Text>
                          </View>
                        </View>
                      ) : null}

                      {escalate ? (
                        <View style={[styles.escalate, { backgroundColor: p.warningMuted, borderColor: colors.accent }]}>
                          <Text style={[styles.escalateTitle, { color: p.text }]}>{t('ai.needHuman')}</Text>
                          <Text style={[styles.escalateBody, { color: p.textMuted }]}>{t('ai.needHumanMsg')}</Text>
                        </View>
                      ) : null}
                    </ScrollView>

                    {/* Composer */}
                    <View style={[styles.composer, { borderTopColor: p.border }]}>
                      <TextInput
                        style={[styles.input, { backgroundColor: p.surface, borderColor: p.border, color: p.text }]}
                        placeholder={t('ai.askMeAnything')}
                        placeholderTextColor={p.textSubtle}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxLength={4000}
                        onSubmitEditing={() => void send()}
                        returnKeyType="send"
                        blurOnSubmit={false}
                      />
                      <Pressable
                        onPress={() => void send()}
                        disabled={pending || input.trim().length === 0}
                        accessibilityLabel={t('ai.send')}
                        style={[
                          styles.sendBtn,
                          { backgroundColor: input.trim().length === 0 || pending ? p.border : colors.primary },
                        ]}
                      >
                        <Ionicons name="arrow-up" size={20} color={colors.white} />
                      </Pressable>
                    </View>
                  </>
                )}
              </SafeAreaView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  backdropFill: { flex: 1 },
  sheet: {
    height: '82%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerChip: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  bigChip: { width: 56, height: 56, borderRadius: 28 },
  headerTitle: { ...typography.bodyBold, fontSize: 15, fontWeight: '800' },
  headerSub: { ...typography.caption, fontSize: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  newChat: { ...typography.small, fontSize: 13, fontWeight: '700' },

  messages: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...typography.body, fontSize: 14 },
  bubble: { maxWidth: '84%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  bubbleUser: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleBot: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleText: { ...typography.body, fontSize: 14, lineHeight: 20 },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  escalate: { alignSelf: 'flex-start', maxWidth: '92%', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: 2 },
  escalateTitle: { ...typography.bodyBold, fontSize: 13, fontWeight: '700' },
  escalateBody: { ...typography.caption, fontSize: 12 },

  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    ...typography.body,
    fontSize: 15,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  signedOut: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  signedOutText: { ...typography.body, fontSize: 14, textAlign: 'center' },
  signInBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  signInBtnText: { ...typography.bodyBold, fontSize: 14, fontWeight: '800', color: colors.white },
});
