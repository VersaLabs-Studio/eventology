-- ============================================================================
-- Migration 009: Messaging
-- Eventology V1 MVP — Phase 1A
-- ============================================================================
-- Conversations and messages enable communication between users,
-- organizers, and support. Supports direct messages, event inquiries,
-- and system messages.
-- ============================================================================

-- Conversations table
CREATE TABLE public.conversations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type            public.conversation_type NOT NULL DEFAULT 'direct',
  event_id        UUID REFERENCES public.events(id) ON DELETE SET NULL,
  subject         TEXT,

  -- Participants (stored as array of user IDs)
  participant_ids UUID[] NOT NULL DEFAULT '{}',

  -- Last message preview (denormalized for list performance)
  last_message_at TIMESTAMPTZ,
  last_message    TEXT,

  -- Metadata
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_conversations_type ON public.conversations(type);
CREATE INDEX idx_conversations_event_id ON public.conversations(event_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversations_participant_ids ON public.conversations USING GIN(participant_ids);

-- Auto-update updated_at
CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Messages table
CREATE TABLE public.messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Content
  type            public.message_type NOT NULL DEFAULT 'text',
  content         TEXT NOT NULL,
  attachments     TEXT[] DEFAULT '{}',

  -- Read tracking
  read_by         UUID[] DEFAULT '{}',

  -- Metadata
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Auto-update updated_at
CREATE TRIGGER set_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update conversation's last_message fields on new message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      last_message = LEFT(NEW.content, 200)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();
