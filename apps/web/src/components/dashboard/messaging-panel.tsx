"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useBroadcast } from "@/hooks/use-broadcast";
import { useConversations, useConversationMessages, useSendMessage, useCreateConversation } from "@/hooks/use-conversations";
import { Megaphone, MessageSquare, Send, Inbox } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@eventology/utils";
import { useAuth } from "@/hooks/use-auth";

interface MessagingPanelProps {
  eventId: string;
}

/**
 * Compact messaging widget for the organizer event page.
 * Two surfaces:
 *   1. Broadcast: one-to-many announcement to all confirmed attendees
 *      (best-effort fan-out via the comms seam).
 *   2. Direct messages: shows the latest conversations the organizer
 *      is part of, with a thread view + send box.
 */
export function MessagingPanel({ eventId }: MessagingPanelProps) {
  const [tab, setTab] = React.useState<'broadcast' | 'inbox'>('broadcast');
  const { user } = useAuth();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={tab === 'broadcast' ? 'default' : 'ghost'}
          onClick={() => setTab('broadcast')}
        >
          <Megaphone className="mr-1 h-3.5 w-3.5" /> Broadcast
        </Button>
        <Button
          size="sm"
          variant={tab === 'inbox' ? 'default' : 'ghost'}
          onClick={() => setTab('inbox')}
        >
          <Inbox className="mr-1 h-3.5 w-3.5" /> Inbox
        </Button>
      </div>
      {tab === 'broadcast' ? <BroadcastBox eventId={eventId} /> : <InboxBox />}
    </div>
  );
}

function BroadcastBox({ eventId }: { eventId: string }) {
  const broadcast = useBroadcast(eventId);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');

  const submit = async () => {
    if (!subject.trim() || !body.trim()) return;
    try {
      const res = await broadcast.mutateAsync({ subject: subject.trim(), body: body.trim() });
      toast.success(`Broadcast sent to ${res.delivered} attendee${res.delivered === 1 ? '' : 's'}`);
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Broadcast failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Send announcement to attendees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="bc-subject">Subject</Label>
          <Input
            id="bc-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Doors open at 7pm sharp"
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="bc-body">Message</Label>
          <Textarea
            id="bc-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Hey attendees! Just a quick reminder…"
            rows={4}
            maxLength={4000}
          />
          <p className="text-[11px] text-muted-foreground text-right mt-1">
            {body.trim().length}/4000
          </p>
        </div>
        <Button
          disabled={!subject.trim() || !body.trim() || broadcast.isPending}
          onClick={submit}
        >
          <Send className="mr-2 h-4 w-4" />
          {broadcast.isPending ? 'Sending…' : 'Broadcast'}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Best-effort delivery: an in-app notification is always written; email + push go out via the comms seam.
          Limit: 5 broadcasts per hour.
        </p>
      </CardContent>
    </Card>
  );
}

function InboxBox() {
  const { user } = useAuth();
  const conversationsQ = useConversations();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!activeId && conversationsQ.data?.data?.[0]) {
      setActiveId(conversationsQ.data.data[0].id);
    }
  }, [conversationsQ.data, activeId]);

  const conversations = conversationsQ.data?.data ?? [];

  if (conversationsQ.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="Direct messages with attendees will appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3">
      <Card>
        <CardContent className="p-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-2 rounded-md transition-colors ${
                c.id === activeId ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              <p className="text-sm font-medium truncate">{c.subject ?? 'Conversation'}</p>
              {c.last_message && (
                <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
              )}
              {c.last_message_at && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(c.last_message_at)}</p>
              )}
            </button>
          ))}
        </CardContent>
      </Card>
      {activeId ? <ConversationThread conversationId={activeId} /> : null}
    </div>
  );
}

function ConversationThread({ conversationId }: { conversationId: string }) {
  const messagesQ = useConversationMessages(conversationId);
  const send = useSendMessage(conversationId);
  const [draft, setDraft] = React.useState('');

  const messages = messagesQ.data?.data ?? [];

  const submit = async () => {
    const content = draft.trim();
    if (!content) return;
    try {
      await send.mutateAsync({ content });
      setDraft('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send');
    }
  };

  return (
    <Card>
      <CardContent className="p-3 flex flex-col h-[400px]">
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {messagesQ.isLoading && <Skeleton className="h-32 w-full" />}
          {messages.map((m) => (
            <div key={m.id} className="rounded-lg bg-muted/40 p-2">
              <p className="text-xs text-muted-foreground">
                {formatDateTime(m.created_at)} · {m.sender_id ? 'You' : 'Attendee'}
              </p>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {messages.length === 0 && !messagesQ.isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <Button disabled={!draft.trim() || send.isPending} onClick={submit} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
