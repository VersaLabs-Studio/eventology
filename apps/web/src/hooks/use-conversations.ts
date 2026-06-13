'use client';

// ============================================================================
// Conversations + Messages — Messaging Hooks
// ============================================================================
// Thin wrappers around the /api/protected/conversations and
// /api/protected/conversations/[id]/messages routes. RLS self-enforces
// participant read/write.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConversationKeys, MessageKeys } from '@eventology/config';
import type { ConversationRow } from '@/app/api/protected/conversations/route';
import type { MessageRow } from '@/app/api/protected/conversations/[id]/messages/route';

export type { ConversationRow, MessageRow };

interface ConvListResponse {
  data: ConversationRow[];
  meta: { total: number; page: number; limit: number };
}

interface MsgListResponse {
  data: MessageRow[];
  meta: { total: number; page: number; limit: number };
}

export function useConversations() {
  return useQuery<ConvListResponse>({
    queryKey: ConversationKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/protected/conversations');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch conversations');
      }
      return res.json();
    },
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery<MsgListResponse>({
    queryKey: MessageKeys.byConversation(conversationId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/protected/conversations/${conversationId}/messages`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to fetch messages');
      }
      return res.json();
    },
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      participant_ids: string[];
      type?: 'direct' | 'event_inquiry' | 'support';
      event_id?: string | null;
      subject?: string | null;
      initial_message?: string | null;
    }) => {
      const res = await fetch('/api/protected/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to create conversation');
      }
      return res.json() as Promise<ConversationRow>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ConversationKeys.all() });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: string; type?: 'text' | 'image' | 'system' }) => {
      const res = await fetch(`/api/protected/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', ...input }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Failed to send');
      }
      return res.json() as Promise<MessageRow>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MessageKeys.byConversation(conversationId) });
      qc.invalidateQueries({ queryKey: ConversationKeys.all() });
    },
  });
}
