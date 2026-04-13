-- ─── Phase 4: Social Content Management ────────────────────────────────────
-- Brand voice management and social content creation per property.
-- Created: Phase 4 (Pandotic Hub — Social Content)

-- ─── Social Platform & Content Types ──────────────────────────────────────

CREATE TYPE social_platform AS ENUM (
  'twitter',
  'linkedin',
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'other'
);

CREATE TYPE social_content_type AS ENUM (
  'post',
  'thread',
  'story',
  'reel',
  'article'
);

CREATE TYPE social_content_status AS ENUM (
  'draft',
  'review',
  'approved',
  'published',
  'archived'
);

-- ─── Brand Voice Briefs Table ──────────────────────────────────────────────

CREATE TABLE hub_brand_voice_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL, -- Primary platform focus (e.g., "Twitter/LinkedIn strategy")
  tone TEXT[] NOT NULL, -- e.g., ["professional", "friendly", "authoritative"]
  audience TEXT NOT NULL, -- Target audience description
  key_messages TEXT[] NOT NULL, -- Core messaging pillars
  dos TEXT[] NOT NULL, -- What to do
  donts TEXT[] NOT NULL, -- What to avoid
  example_posts JSONB, -- {"twitter": [...], "linkedin": [...]} — real post examples
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES hub_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, name)
);

CREATE INDEX idx_hub_brand_voice_briefs_property_id ON hub_brand_voice_briefs(property_id);
CREATE INDEX idx_hub_brand_voice_briefs_created_by ON hub_brand_voice_briefs(created_by);

-- ─── Social Content Table ──────────────────────────────────────────────────

CREATE TABLE hub_social_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES hub_brand_voice_briefs(id) ON DELETE SET NULL,
  platform social_platform NOT NULL,
  content_type social_content_type NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  status social_content_status NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES hub_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_social_content_property_id ON hub_social_content(property_id);
CREATE INDEX idx_hub_social_content_brief_id ON hub_social_content(brief_id);
CREATE INDEX idx_hub_social_content_platform ON hub_social_content(platform);
CREATE INDEX idx_hub_social_content_status ON hub_social_content(status);
CREATE INDEX idx_hub_social_content_created_at ON hub_social_content(created_at);
CREATE INDEX idx_hub_social_content_scheduled_for ON hub_social_content(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- ─── Row Level Security ────────────────────────────────────────────────────

ALTER TABLE hub_brand_voice_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_social_content ENABLE ROW LEVEL SECURITY;

-- Brand Voice Briefs: Authenticated users can view; only super_admin and group_admin can create/modify
CREATE POLICY briefs_select_authenticated ON hub_brand_voice_briefs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY briefs_insert_admin ON hub_brand_voice_briefs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY briefs_update_admin ON hub_brand_voice_briefs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY briefs_delete_admin ON hub_brand_voice_briefs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

-- Social Content: Same as brand voice briefs
CREATE POLICY social_content_select_authenticated ON hub_social_content
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY social_content_insert_admin ON hub_social_content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY social_content_update_admin ON hub_social_content
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY social_content_delete_admin ON hub_social_content
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

-- ─── Helper Functions ──────────────────────────────────────────────────────

-- Auto-update updated_at for brand_voice_briefs
CREATE OR REPLACE FUNCTION update_hub_brand_voice_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_brand_voice_briefs_updated_at_trigger
  BEFORE UPDATE ON hub_brand_voice_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_brand_voice_briefs_updated_at();

-- Auto-update updated_at for social_content
CREATE OR REPLACE FUNCTION update_hub_social_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_social_content_updated_at_trigger
  BEFORE UPDATE ON hub_social_content
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_social_content_updated_at();
