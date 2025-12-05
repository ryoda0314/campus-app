-- =====================================================
-- Campus Club Chat Schema Migration
-- Full-featured Room Chat System
-- =====================================================

-- Message kind enum
DO $$ BEGIN
    CREATE TYPE message_kind AS ENUM ('normal', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- Main Messages Table
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    kind message_kind NOT NULL DEFAULT 'normal',
    content TEXT,
    has_attachments BOOLEAN DEFAULT FALSE,
    has_links BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- =====================================================
-- Message Attachments (Multiple images per message)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    width INT,
    height INT,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON message_attachments(message_id);

-- =====================================================
-- Message Links (URL previews with OGP)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    og_title TEXT,
    og_description TEXT,
    og_image_url TEXT,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_links_message_id ON message_links(message_id);

-- =====================================================
-- Threads (One-level per message)
-- =====================================================
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    root_message_id UUID NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
    reply_count INT DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_root_message ON threads(root_message_id);

-- =====================================================
-- Thread Messages (Replies in thread)
-- =====================================================
CREATE TABLE IF NOT EXISTS thread_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT,
    has_attachments BOOLEAN DEFAULT FALSE,
    has_links BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_thread_messages_thread_id ON thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_messages_created_at ON thread_messages(created_at);

-- =====================================================
-- Message Reactions (Emoji on messages and thread messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    thread_message_id UUID REFERENCES thread_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_reaction_message UNIQUE (user_id, emoji, message_id),
    CONSTRAINT unique_reaction_thread UNIQUE (user_id, emoji, thread_message_id),
    CONSTRAINT check_reaction_target CHECK (
        (message_id IS NOT NULL AND thread_message_id IS NULL)
        OR
        (message_id IS NULL AND thread_message_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_thread_message ON message_reactions(thread_message_id);

-- =====================================================
-- Full-Text Search Support
-- =====================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING GIN(search_vector);

-- Search trigger function
CREATE OR REPLACE FUNCTION messages_search_trigger() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS messages_search_update ON messages;
CREATE TRIGGER messages_search_update
    BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION messages_search_trigger();

-- =====================================================
-- Thread reply count update function
-- =====================================================
CREATE OR REPLACE FUNCTION update_thread_reply_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE threads 
        SET reply_count = reply_count + 1, 
            last_reply_at = NEW.created_at
        WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE threads 
        SET reply_count = reply_count - 1
        WHERE id = OLD.thread_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS thread_reply_count_trigger ON thread_messages;
CREATE TRIGGER thread_reply_count_trigger
    AFTER INSERT OR DELETE ON thread_messages
    FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view room messages" ON messages;
CREATE POLICY "Users can view room messages" ON messages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id OR kind = 'system');

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE USING (auth.uid() = user_id);

-- Message Attachments RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view attachments" ON message_attachments;
CREATE POLICY "Anyone can view attachments" ON message_attachments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert attachments" ON message_attachments;
CREATE POLICY "Users can insert attachments" ON message_attachments
    FOR INSERT WITH CHECK (true);

-- Message Links RLS
ALTER TABLE message_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view links" ON message_links;
CREATE POLICY "Anyone can view links" ON message_links
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert links" ON message_links;
CREATE POLICY "Anyone can insert links" ON message_links
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update links" ON message_links;
CREATE POLICY "Anyone can update links" ON message_links
    FOR UPDATE USING (true);

-- Threads RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view threads" ON threads;
CREATE POLICY "Anyone can view threads" ON threads
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create threads" ON threads;
CREATE POLICY "Anyone can create threads" ON threads
    FOR INSERT WITH CHECK (true);

-- Thread Messages RLS
ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view thread messages" ON thread_messages;
CREATE POLICY "Anyone can view thread messages" ON thread_messages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert thread messages" ON thread_messages;
CREATE POLICY "Users can insert thread messages" ON thread_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own thread messages" ON thread_messages;
CREATE POLICY "Users can update own thread messages" ON thread_messages
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own thread messages" ON thread_messages;
CREATE POLICY "Users can delete own thread messages" ON thread_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Reactions RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON message_reactions;
CREATE POLICY "Anyone can view reactions" ON message_reactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
CREATE POLICY "Users can add reactions" ON message_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON message_reactions;
CREATE POLICY "Users can remove own reactions" ON message_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Enable Realtime for chat tables
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE thread_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
