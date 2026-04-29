-- ============================================================
-- 00521_hub_social_idempotent.sql
-- Reconciles hub_brand_voice_briefs + hub_content_pipeline
-- (renamed from hub_social_content) with code.
--
-- Consolidates migrations 00105 (base tables), 00111 (brand voice
-- voice-modeling + visual identity extensions), 00112 (table rename
-- + pipeline generalization + enum→text conversion), and the social
-- portions of 00106 (brief/property consistency trigger).
--
-- These were marked applied via `migration repair` but never actually
-- ran against the live Hub DB — same drift pattern as 00519 (skills)
-- and 00520 (agents).
--
-- Handles every possible starting state:
--   • Fresh DB (no tables)
--   • 00105 ran only (old table name hub_social_content, enum columns)
--   • 00105 + 00106 ran (triggers on hub_social_content)
--   • All ran (target state)
-- ============================================================

-- ─── hub_brand_voice_briefs ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hub_brand_voice_briefs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  name          text NOT NULL,
  platform      text NOT NULL,
  tone          text[] NOT NULL DEFAULT '{}',
  audience      text NOT NULL DEFAULT '',
  key_messages  text[] NOT NULL DEFAULT '{}',
  dos           text[] NOT NULL DEFAULT '{}',
  donts         text[] NOT NULL DEFAULT '{}',
  example_posts jsonb,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_by    uuid NOT NULL REFERENCES hub_users(id) ON DELETE RESTRICT,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, name)
);

-- 00111 voice-modeling extensions
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS voice_attributes    text[]  DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS tone_variations     jsonb   DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS vocabulary          jsonb   DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS sentence_patterns   jsonb   DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS anti_examples       jsonb   DEFAULT '[]';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS humor_guidelines    text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS corrections_journal jsonb   DEFAULT '[]';

-- 00111 visual identity
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS primary_color       text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS accent_color        text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS logo_url            text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS font_family         text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS photo_style_guide   text;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS photo_mood_keywords text[];
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS use_ai_generation   boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_hub_brand_voice_briefs_property_id
  ON hub_brand_voice_briefs(property_id);
CREATE INDEX IF NOT EXISTS idx_hub_brand_voice_briefs_created_by
  ON hub_brand_voice_briefs(created_by);

-- ─── Rename hub_social_content → hub_content_pipeline if needed ──────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'hub_social_content'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'hub_content_pipeline'
  ) THEN
    ALTER TABLE hub_social_content RENAME TO hub_content_pipeline;
  END IF;
END $$;

-- ─── hub_content_pipeline ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hub_content_pipeline (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  brief_id      uuid REFERENCES hub_brand_voice_briefs(id) ON DELETE SET NULL,
  platform      text,
  content_type  text,
  title         text,
  body          text NOT NULL,
  media_urls    text[] NOT NULL DEFAULT '{}',
  hashtags      text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  published_at  timestamptz,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_by    uuid NOT NULL REFERENCES hub_users(id) ON DELETE RESTRICT,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Convert enum columns to TEXT if still enum (from 00105 initial create)
-- and reset any defaults that carry enum type dependencies.

-- status: has DEFAULT 'draft' in 00105 which may be bound to social_content_status enum
ALTER TABLE hub_content_pipeline ALTER COLUMN status DROP DEFAULT;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hub_content_pipeline'
      AND column_name = 'status'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE hub_content_pipeline ALTER COLUMN status TYPE text USING status::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hub_content_pipeline'
      AND column_name = 'platform'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE hub_content_pipeline ALTER COLUMN platform TYPE text USING platform::text;
    ALTER TABLE hub_content_pipeline ALTER COLUMN platform DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hub_content_pipeline'
      AND column_name = 'content_type'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE hub_content_pipeline ALTER COLUMN content_type TYPE text USING content_type::text;
    ALTER TABLE hub_content_pipeline ALTER COLUMN content_type DROP NOT NULL;
  END IF;
END $$;
ALTER TABLE hub_content_pipeline ALTER COLUMN status SET DEFAULT 'draft'::text;

-- 00112 pipeline extensions
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS channel           text NOT NULL DEFAULT 'social';
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS drafted_by_agent  text;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS qa_confidence     numeric;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS excerpt           text;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS published_url     text;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS source_content_id uuid REFERENCES hub_content_pipeline(id) ON DELETE SET NULL;

-- ─── Drop obsolete enum types (skip if still referenced) ─────────────────

DO $$ BEGIN DROP TYPE social_content_status;
EXCEPTION WHEN undefined_object OR dependent_objects_still_exist THEN NULL; END $$;

DO $$ BEGIN DROP TYPE social_platform;
EXCEPTION WHEN undefined_object OR dependent_objects_still_exist THEN NULL; END $$;

DO $$ BEGIN DROP TYPE social_content_type;
EXCEPTION WHEN undefined_object OR dependent_objects_still_exist THEN NULL; END $$;

-- ─── CHECK constraints ───────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE hub_content_pipeline ADD CONSTRAINT hub_content_pipeline_status_check
    CHECK (status IN (
      'draft', 'drafted', 'qa_review', 'review', 'needs_human_review',
      'revision_requested', 'approved', 'scheduled', 'published', 'archived'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE hub_content_pipeline ADD CONSTRAINT hub_content_pipeline_channel_check
    CHECK (channel IN (
      'social', 'blog', 'email', 'press', 'featured_pitch',
      'newsletter', 'landing_page', 'case_study', 'guest_post'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_property_id
  ON hub_content_pipeline(property_id);
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_brief_id
  ON hub_content_pipeline(brief_id);
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_platform
  ON hub_content_pipeline(platform);
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_status
  ON hub_content_pipeline(status);
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_created_at
  ON hub_content_pipeline(created_at);
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_scheduled_for
  ON hub_content_pipeline(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_channel
  ON hub_content_pipeline(channel);
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_drafted_by_agent
  ON hub_content_pipeline(drafted_by_agent) WHERE drafted_by_agent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_source_content_id
  ON hub_content_pipeline(source_content_id) WHERE source_content_id IS NOT NULL;

-- ─── updated_at triggers ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_hub_brand_voice_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hub_brand_voice_briefs_updated_at_trigger ON hub_brand_voice_briefs;
CREATE TRIGGER hub_brand_voice_briefs_updated_at_trigger
  BEFORE UPDATE ON hub_brand_voice_briefs
  FOR EACH ROW EXECUTE FUNCTION update_hub_brand_voice_briefs_updated_at();

CREATE OR REPLACE FUNCTION update_hub_content_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hub_content_pipeline_updated_at_trigger ON hub_content_pipeline;
DROP TRIGGER IF EXISTS hub_social_content_updated_at_trigger ON hub_content_pipeline;
CREATE TRIGGER hub_content_pipeline_updated_at_trigger
  BEFORE UPDATE ON hub_content_pipeline
  FOR EACH ROW EXECUTE FUNCTION update_hub_content_pipeline_updated_at();

-- Brief/property consistency check (from 00106)
CREATE OR REPLACE FUNCTION validate_content_pipeline_brief()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.brief_id IS NOT NULL THEN
    IF NEW.property_id != (
      SELECT property_id FROM hub_brand_voice_briefs WHERE id = NEW.brief_id
    ) THEN
      RAISE EXCEPTION 'Content property_id must match brief property_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_pipeline_brief_validation ON hub_content_pipeline;
DROP TRIGGER IF EXISTS social_content_brief_validation   ON hub_content_pipeline;
CREATE TRIGGER content_pipeline_brief_validation
  BEFORE INSERT OR UPDATE ON hub_content_pipeline
  FOR EACH ROW EXECUTE FUNCTION validate_content_pipeline_brief();

-- ─── RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE hub_brand_voice_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_content_pipeline   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS briefs_select_authenticated ON hub_brand_voice_briefs;
DROP POLICY IF EXISTS briefs_insert_admin         ON hub_brand_voice_briefs;
DROP POLICY IF EXISTS briefs_update_admin         ON hub_brand_voice_briefs;
DROP POLICY IF EXISTS briefs_delete_admin         ON hub_brand_voice_briefs;

CREATE POLICY briefs_select_authenticated ON hub_brand_voice_briefs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY briefs_insert_admin ON hub_brand_voice_briefs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid() AND hub_role IN ('super_admin','group_admin')));
CREATE POLICY briefs_update_admin ON hub_brand_voice_briefs
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid() AND hub_role IN ('super_admin','group_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid() AND hub_role IN ('super_admin','group_admin')));
CREATE POLICY briefs_delete_admin ON hub_brand_voice_briefs
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid() AND hub_role IN ('super_admin','group_admin')));

-- Drop both old (social_content_*) and new (content_pipeline_*) policy names to stay idempotent
DROP POLICY IF EXISTS social_content_select_authenticated ON hub_content_pipeline;
DROP POLICY IF EXISTS social_content_insert_admin         ON hub_content_pipeline;
DROP POLICY IF EXISTS social_content_update_admin         ON hub_content_pipeline;
DROP POLICY IF EXISTS social_content_delete_admin         ON hub_content_pipeline;
DROP POLICY IF EXISTS content_pipeline_select_authenticated ON hub_content_pipeline;
DROP POLICY IF EXISTS content_pipeline_insert_admin         ON hub_content_pipeline;
DROP POLICY IF EXISTS content_pipeline_update_admin         ON hub_content_pipeline;
DROP POLICY IF EXISTS content_pipeline_delete_admin         ON hub_content_pipeline;

CREATE POLICY content_pipeline_select_authenticated ON hub_content_pipeline
  FOR SELECT TO authenticated USING (true);
CREATE POLICY content_pipeline_insert_admin ON hub_content_pipeline
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid() AND hub_role IN ('super_admin','group_admin')));
CREATE POLICY content_pipeline_update_admin ON hub_content_pipeline
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid() AND hub_role IN ('super_admin','group_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid() AND hub_role IN ('super_admin','group_admin')));
CREATE POLICY content_pipeline_delete_admin ON hub_content_pipeline
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid() AND hub_role IN ('super_admin','group_admin')));
