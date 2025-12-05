-- =====================================================
-- DM (Direct Message) Schema
-- =====================================================

-- =====================================================
-- DM Conversations (1-on-1 chat rooms)
-- =====================================================
CREATE TABLE IF NOT EXISTS dm_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id),
    CHECK (participant1_id < participant2_id) -- Ensure consistent ordering
);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant1 ON dm_conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant2 ON dm_conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message ON dm_conversations(last_message_at DESC);

-- =====================================================
-- DM Messages
-- =====================================================
CREATE TABLE IF NOT EXISTS dm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT,
    has_attachments BOOLEAN DEFAULT FALSE,
    has_links BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    search_vector TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON dm_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender ON dm_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_search ON dm_messages USING GIN(search_vector);

-- =====================================================
-- DM Message Attachments
-- =====================================================
CREATE TABLE IF NOT EXISTS dm_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    mime_type TEXT,
    width INT,
    height INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_attachments_message ON dm_message_attachments(message_id);

-- =====================================================
-- DM Message Links
-- =====================================================
CREATE TABLE IF NOT EXISTS dm_message_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    image_url TEXT,
    site_name TEXT,
    fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_links_message ON dm_message_links(message_id);

-- =====================================================
-- DM Message Reactions
-- =====================================================
CREATE TABLE IF NOT EXISTS dm_message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES dm_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON dm_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_user ON dm_message_reactions(user_id);

-- =====================================================
-- DM Read Status
-- =====================================================
CREATE TABLE IF NOT EXISTS dm_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_read_status_user ON dm_read_status(user_id, conversation_id);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Update search vector for DM messages
CREATE OR REPLACE FUNCTION update_dm_message_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dm_message_search_vector_trigger ON dm_messages;
CREATE TRIGGER dm_message_search_vector_trigger
    BEFORE INSERT OR UPDATE ON dm_messages
    FOR EACH ROW EXECUTE FUNCTION update_dm_message_search_vector();

-- Update last_message_at on new DM message
CREATE OR REPLACE FUNCTION update_dm_conversation_last_message() RETURNS TRIGGER AS $$
BEGIN
    UPDATE dm_conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dm_conversation_last_message_trigger ON dm_messages;
CREATE TRIGGER dm_conversation_last_message_trigger
    AFTER INSERT ON dm_messages
    FOR EACH ROW EXECUTE FUNCTION update_dm_conversation_last_message();

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_message_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_read_status ENABLE ROW LEVEL SECURITY;

-- DM Conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON dm_conversations;
CREATE POLICY "Users can view their own conversations" ON dm_conversations
    FOR SELECT USING (
        auth.uid() = participant1_id OR auth.uid() = participant2_id
    );

DROP POLICY IF EXISTS "Users can create conversations" ON dm_conversations;
CREATE POLICY "Users can create conversations" ON dm_conversations
    FOR INSERT WITH CHECK (
        auth.uid() = participant1_id OR auth.uid() = participant2_id
    );

-- DM Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON dm_messages;
CREATE POLICY "Users can view messages in their conversations" ON dm_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dm_conversations 
            WHERE id = dm_messages.conversation_id 
            AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON dm_messages;
CREATE POLICY "Users can send messages in their conversations" ON dm_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM dm_conversations 
            WHERE id = dm_messages.conversation_id 
            AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON dm_messages;
CREATE POLICY "Users can update their own messages" ON dm_messages
    FOR UPDATE USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- DM Attachments policies
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON dm_message_attachments;
CREATE POLICY "Users can view attachments in their conversations" ON dm_message_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dm_messages m
            JOIN dm_conversations c ON m.conversation_id = c.id
            WHERE m.id = dm_message_attachments.message_id
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can add attachments to their messages" ON dm_message_attachments;
CREATE POLICY "Users can add attachments to their messages" ON dm_message_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM dm_messages
            WHERE id = dm_message_attachments.message_id
            AND sender_id = auth.uid()
        )
    );

-- DM Links policies
DROP POLICY IF EXISTS "Users can view links in their conversations" ON dm_message_links;
CREATE POLICY "Users can view links in their conversations" ON dm_message_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dm_messages m
            JOIN dm_conversations c ON m.conversation_id = c.id
            WHERE m.id = dm_message_links.message_id
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can add links" ON dm_message_links;
CREATE POLICY "Users can add links" ON dm_message_links
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update links" ON dm_message_links;
CREATE POLICY "Users can update links" ON dm_message_links
    FOR UPDATE USING (true);

-- DM Reactions policies
DROP POLICY IF EXISTS "Users can view reactions in their conversations" ON dm_message_reactions;
CREATE POLICY "Users can view reactions in their conversations" ON dm_message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dm_messages m
            JOIN dm_conversations c ON m.conversation_id = c.id
            WHERE m.id = dm_message_reactions.message_id
            AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can add reactions" ON dm_message_reactions;
CREATE POLICY "Users can add reactions" ON dm_message_reactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove their reactions" ON dm_message_reactions;
CREATE POLICY "Users can remove their reactions" ON dm_message_reactions
    FOR DELETE USING (user_id = auth.uid());

-- DM Read Status policies
DROP POLICY IF EXISTS "Users can view their read status" ON dm_read_status;
CREATE POLICY "Users can view their read status" ON dm_read_status
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their read status" ON dm_read_status;
CREATE POLICY "Users can update their read status" ON dm_read_status
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Enable Realtime
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE dm_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_message_reactions;
