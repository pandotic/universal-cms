-- ─── Unified Content Pipeline ────────────────────────────────────────────────
-- Generalizes hub_social_content into hub_content_pipeline.
-- Social becomes a channel filter — all content types flow through one pipeline.
-- Created: Marketing Ops Module — Chunk 1

-- Rename table
ALTER TABLE hub_social_content RENAME TO hub_content_pipeline;

-- Add channel column (social, blog, email, press, etc.)
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS channel TEXT
  NOT NULL DEFAULT 'social'
  CHECK (channel IN (
    'social', 'blog', 'email', 'press', 'featured_pitch',
    'newsletter', 'landing_page', 'case_study', 'guest_post'
  ));

-- Agent attribution and QA
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS drafted_by_agent TEXT;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS qa_confidence NUMERIC;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS published_url TEXT;

-- Repurposing chain: link derived content back to source
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS source_content_id UUID
  REFERENCES hub_content_pipeline(id) ON DELETE SET NULL;

-- Broaden status enum to include pipeline stages
-- The existing enum has: draft, review, approved, published, archived
-- We need to add: drafted, qa_review, needs_human_review, revision_requested, scheduled
-- Strategy: convert to text + CHECK for flexibility
ALTER TABLE hub_content_pipeline ALTER COLUMN status TYPE TEXT;
DROP TYPE IF EXISTS social_content_status;
ALTER TABLE hub_content_pipeline ADD CONSTRAINT hub_content_pipeline_status_check
  CHECK (status IN (
    'draft', 'drafted', 'qa_review', 'review', 'needs_human_review',
    'revision_requested', 'approved', 'scheduled', 'published', 'archived'
  ));

-- Convert platform from enum to text for flexibility
ALTER TABLE hub_content_pipeline ALTER COLUMN platform TYPE TEXT;
ALTER TABLE hub_content_pipeline ALTER COLUMN platform DROP NOT NULL;
DROP TYPE IF EXISTS social_platform;

-- Convert content_type from enum to text for flexibility
ALTER TABLE hub_content_pipeline ALTER COLUMN content_type TYPE TEXT;
ALTER TABLE hub_content_pipeline ALTER COLUMN content_type DROP NOT NULL;
DROP TYPE IF EXISTS social_content_type;

-- New indexes
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_channel
  ON hub_content_pipeline(channel);
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_drafted_by_agent
  ON hub_content_pipeline(drafted_by_agent) WHERE drafted_by_agent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_source_content_id
  ON hub_content_pipeline(source_content_id) WHERE source_content_id IS NOT NULL;

-- Rename existing indexes and triggers to match new table name
-- (PostgreSQL renames indexes automatically with ALTER TABLE RENAME,
-- but triggers keep their old names — update for clarity)
ALTER FUNCTION IF EXISTS update_hub_social_content_updated_at() RENAME TO update_hub_content_pipeline_updated_at;
