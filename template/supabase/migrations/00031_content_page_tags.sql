-- Add tags column to content_pages for blog/insights categorization
ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Index for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_content_pages_tags ON content_pages USING GIN (tags);
