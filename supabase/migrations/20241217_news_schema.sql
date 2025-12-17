-- News Hub Schema Migration
-- Version: 1.0
-- Date: 2025-12-17

-- ============================================
-- 1. Utility Functions
-- ============================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. news_posts (Campus News)
-- ============================================

CREATE TABLE IF NOT EXISTS news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body TEXT,
  category TEXT NOT NULL DEFAULT 'notice'
    CHECK (category IN ('notice','event','recruit','lost','study','external')),
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','room')),
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  pinned_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  library_item_id UUID REFERENCES library_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_news_posts_updated_at ON news_posts;
CREATE TRIGGER trg_news_posts_updated_at
BEFORE UPDATE ON news_posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_posts_created ON news_posts(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_author ON news_posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_category ON news_posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_visibility ON news_posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_room ON news_posts(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_pinned ON news_posts(pinned_until DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_expires ON news_posts(expires_at);

-- ============================================
-- 3. digest_items (External News)
-- ============================================

CREATE TABLE IF NOT EXISTS digest_items (
  id CHAR(64) PRIMARY KEY,  -- sha256 hex of URL
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  source TEXT NOT NULL CHECK (char_length(source) <= 60),
  company TEXT,
  category TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  importance INT NOT NULL DEFAULT 50 CHECK (importance BETWEEN 0 AND 100),
  raw_excerpt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digest_items_published ON digest_items(published_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_digest_items_importance ON digest_items(importance DESC, published_at DESC);

-- ============================================
-- 4. digest_summaries (Multilingual Summaries)
-- ============================================

CREATE TABLE IF NOT EXISTS digest_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_id CHAR(64) NOT NULL REFERENCES digest_items(id) ON DELETE CASCADE,
  lang TEXT NOT NULL DEFAULT 'jp' CHECK (lang IN ('jp','en','kr','cn')),
  summary_short TEXT NOT NULL,
  summary_long TEXT,
  tags JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_name TEXT,
  UNIQUE (digest_id, lang)
);

-- ============================================
-- 5. digest_daily_memos (Daily Summaries)
-- ============================================

CREATE TABLE IF NOT EXISTS digest_daily_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,  -- JST date
  lang TEXT NOT NULL DEFAULT 'jp' CHECK (lang IN ('jp','en','kr','cn')),
  memo_text TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_name TEXT,
  UNIQUE (date, lang)
);

-- ============================================
-- 6. RLS Policies
-- ============================================

-- news_posts RLS
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

-- Read: logged-in users can read public posts
CREATE POLICY "news_posts_read"
ON news_posts FOR SELECT
TO authenticated
USING (
  visibility = 'public'
  OR (visibility = 'room' AND room_id IS NOT NULL)
  -- TODO: Add room membership check when rooms_members table exists
);

-- Insert: logged-in users can create posts
CREATE POLICY "news_posts_insert"
ON news_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Update: only author can update
CREATE POLICY "news_posts_update_own"
ON news_posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Delete: only author can delete
CREATE POLICY "news_posts_delete_own"
ON news_posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- digest_* RLS (read: authenticated, write: service_role only)
ALTER TABLE digest_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_daily_memos ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "digest_read_items" ON digest_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "digest_read_summaries" ON digest_summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "digest_read_memos" ON digest_daily_memos FOR SELECT TO authenticated USING (true);

-- Write policies (service_role only)
CREATE POLICY "digest_write_items_service" ON digest_items
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "digest_write_summaries_service" ON digest_summaries
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "digest_write_memos_service" ON digest_daily_memos
FOR ALL TO service_role USING (true) WITH CHECK (true);
