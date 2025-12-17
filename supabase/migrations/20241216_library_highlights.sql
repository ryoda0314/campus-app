-- =====================================================
-- Library Schema Enhancement: Highlights
-- =====================================================

-- Add highlights column to library_items
ALTER TABLE library_items ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN library_items.highlights IS 'Array of highlight objects: [{section_index: number, start: number, end: number, color: string, note?: string}]';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_library_items_highlights ON library_items USING GIN (highlights);
