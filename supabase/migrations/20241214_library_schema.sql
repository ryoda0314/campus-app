-- =====================================================
-- Library Schema Migration
-- Knowledge Asset Management System
-- =====================================================

-- =====================================================
-- Sources Table (Input originals: URL/PDF/Paste)
-- =====================================================
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    input_type TEXT NOT NULL CHECK (input_type IN ('url', 'pdf', 'paste')),
    url TEXT,
    file_path TEXT,
    raw_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_input_type ON sources(input_type);

-- =====================================================
-- Library Items Table (Transformed cards)
-- =====================================================
CREATE TABLE IF NOT EXISTS library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    title TEXT NOT NULL,
    tldr TEXT,
    sections JSONB DEFAULT '[]'::jsonb,  -- AIが構成を決める柔軟なセクション: [{heading, content}]
    personal_note TEXT,
    prompt_version TEXT,
    model_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_items_user_id ON library_items(user_id);
CREATE INDEX IF NOT EXISTS idx_library_items_status ON library_items(status);
CREATE INDEX IF NOT EXISTS idx_library_items_created_at ON library_items(created_at DESC);

-- =====================================================
-- Tags Table (Fixed dictionary + variable tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    namespace TEXT NOT NULL CHECK (namespace IN (
        'browse', 'facet', 'prompt', 'api', 'model', 'impl', 'stack', 'status', 'impact', 'entity', 'topic'
    )),
    parent_tag_id UUID REFERENCES tags(id) ON DELETE SET NULL,
    is_fixed BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_namespace ON tags(namespace);
CREATE INDEX IF NOT EXISTS idx_tags_is_fixed ON tags(is_fixed);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- =====================================================
-- Tag Aliases Table (Absorb naming variations)
-- =====================================================
CREATE TABLE IF NOT EXISTS tag_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tag_aliases_tag_id ON tag_aliases(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_aliases_alias ON tag_aliases(alias);

-- =====================================================
-- Library Item Tags (Many-to-Many join table)
-- =====================================================
CREATE TABLE IF NOT EXISTS library_item_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_item_id UUID NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    origin TEXT NOT NULL DEFAULT 'user' CHECK (origin IN ('fixed', 'ai_existing', 'ai_new', 'user')),
    confidence REAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(library_item_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_library_item_tags_item ON library_item_tags(library_item_id);
CREATE INDEX IF NOT EXISTS idx_library_item_tags_tag ON library_item_tags(tag_id);

-- =====================================================
-- Updated_at trigger for library_items
-- =====================================================
CREATE OR REPLACE FUNCTION update_library_items_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS library_items_updated_at_trigger ON library_items;
CREATE TRIGGER library_items_updated_at_trigger
    BEFORE UPDATE ON library_items
    FOR EACH ROW EXECUTE FUNCTION update_library_items_updated_at();

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Sources RLS
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sources" ON sources;
CREATE POLICY "Users can view their own sources" ON sources
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sources" ON sources;
CREATE POLICY "Users can insert their own sources" ON sources
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sources" ON sources;
CREATE POLICY "Users can delete their own sources" ON sources
    FOR DELETE USING (auth.uid() = user_id);

-- Library Items RLS
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own library items" ON library_items;
CREATE POLICY "Users can view their own library items" ON library_items
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own library items" ON library_items;
CREATE POLICY "Users can insert their own library items" ON library_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own library items" ON library_items;
CREATE POLICY "Users can update their own library items" ON library_items
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own library items" ON library_items;
CREATE POLICY "Users can delete their own library items" ON library_items
    FOR DELETE USING (auth.uid() = user_id);

-- Tags RLS (everyone can read, fixed tags cannot be modified)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
CREATE POLICY "Anyone can view tags" ON tags
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert non-fixed tags" ON tags;
CREATE POLICY "Authenticated users can insert non-fixed tags" ON tags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND is_fixed = false);

-- Tag Aliases RLS
ALTER TABLE tag_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tag aliases" ON tag_aliases;
CREATE POLICY "Anyone can view tag aliases" ON tag_aliases
    FOR SELECT USING (true);

-- Library Item Tags RLS
ALTER TABLE library_item_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own item tags" ON library_item_tags;
CREATE POLICY "Users can view their own item tags" ON library_item_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM library_items
            WHERE id = library_item_tags.library_item_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own item tags" ON library_item_tags;
CREATE POLICY "Users can insert their own item tags" ON library_item_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM library_items
            WHERE id = library_item_tags.library_item_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own item tags" ON library_item_tags;
CREATE POLICY "Users can delete their own item tags" ON library_item_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM library_items
            WHERE id = library_item_tags.library_item_id
            AND user_id = auth.uid()
        )
    );

-- =====================================================
-- Enable Realtime
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE library_items;
ALTER PUBLICATION supabase_realtime ADD TABLE library_item_tags;
