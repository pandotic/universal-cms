-- Phase 2-5: Assessment, Resources, SMB Content, Site Config, Brand Guide, Entity Source Map
-- Combined migration for all remaining static-to-dynamic content

-- =============================================================================
-- 1. Assessment Tables (Phase 2)
-- =============================================================================

-- Assessment industries (drop-down options)
CREATE TABLE IF NOT EXISTS assessment_industries (
  id TEXT PRIMARY KEY,
  value TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Assessment regions (drop-down options)
CREATE TABLE IF NOT EXISTS assessment_regions (
  id TEXT PRIMARY KEY,
  value TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Assessment questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id TEXT PRIMARY KEY,
  pillar TEXT NOT NULL CHECK (pillar IN ('environmental', 'social', 'governance')),
  subcategory TEXT NOT NULL,
  subcategory_label TEXT NOT NULL,
  text TEXT NOT NULL,
  help_text TEXT,
  weight INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_pillar ON assessment_questions(pillar);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_subcategory ON assessment_questions(subcategory);

-- ESG recommendations by subcategory + maturity level
CREATE TABLE IF NOT EXISTS esg_recommendations (
  id TEXT PRIMARY KEY,
  subcategory TEXT NOT NULL,
  maturity_level TEXT NOT NULL CHECK (maturity_level IN ('minimal', 'beginning', 'developing', 'strong', 'leading')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_links JSONB DEFAULT '[]'::jsonb,
  UNIQUE(subcategory, maturity_level)
);

CREATE INDEX IF NOT EXISTS idx_esg_recommendations_subcategory ON esg_recommendations(subcategory);

-- =============================================================================
-- 2. ESG Resources Table (Phase 3)
-- =============================================================================

CREATE TABLE IF NOT EXISTS esg_resources (
  id TEXT PRIMARY KEY,
  category_slug TEXT NOT NULL,
  category_title TEXT NOT NULL,
  category_description TEXT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  cost TEXT,
  link TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published'
);

CREATE INDEX IF NOT EXISTS idx_esg_resources_category ON esg_resources(category_slug);

-- Hero content for the resources page
-- (stored in site_settings as 'resources_hero')

-- =============================================================================
-- 3. SMB ESG Content Table (Phase 3)
-- =============================================================================
-- SMB content is a single structured page — store as JSONB in site_settings
-- Key: 'smb_esg_content', Group: 'content_pages'

-- =============================================================================
-- 4. Entity Source Map Table (Phase 5)
-- =============================================================================

CREATE TABLE IF NOT EXISTS entity_source_map (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entity_slug TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  search_query_footprint TEXT,
  app_store_id TEXT,
  UNIQUE(entity_slug, source_name)
);

CREATE INDEX IF NOT EXISTS idx_entity_source_map_entity ON entity_source_map(entity_slug);

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE assessment_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_source_map ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS assessment_industries_select ON assessment_industries;
CREATE POLICY assessment_industries_select ON assessment_industries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS assessment_regions_select ON assessment_regions;
CREATE POLICY assessment_regions_select ON assessment_regions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS assessment_questions_select ON assessment_questions;
CREATE POLICY assessment_questions_select ON assessment_questions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS esg_recommendations_select ON esg_recommendations;
CREATE POLICY esg_recommendations_select ON esg_recommendations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS esg_resources_select ON esg_resources;
CREATE POLICY esg_resources_select ON esg_resources FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS entity_source_map_select ON entity_source_map;
CREATE POLICY entity_source_map_select ON entity_source_map FOR SELECT TO anon, authenticated USING (true);

-- Admin write access
DROP POLICY IF EXISTS assessment_industries_admin ON assessment_industries;
CREATE POLICY assessment_industries_admin ON assessment_industries FOR ALL TO authenticated USING (has_role('admin')) WITH CHECK (has_role('admin'));
DROP POLICY IF EXISTS assessment_regions_admin ON assessment_regions;
CREATE POLICY assessment_regions_admin ON assessment_regions FOR ALL TO authenticated USING (has_role('admin')) WITH CHECK (has_role('admin'));
DROP POLICY IF EXISTS assessment_questions_admin ON assessment_questions;
CREATE POLICY assessment_questions_admin ON assessment_questions FOR ALL TO authenticated USING (has_role('admin')) WITH CHECK (has_role('admin'));
DROP POLICY IF EXISTS esg_recommendations_admin ON esg_recommendations;
CREATE POLICY esg_recommendations_admin ON esg_recommendations FOR ALL TO authenticated USING (has_role('admin')) WITH CHECK (has_role('admin'));
DROP POLICY IF EXISTS esg_resources_admin ON esg_resources;
CREATE POLICY esg_resources_admin ON esg_resources FOR ALL TO authenticated USING (has_role('admin')) WITH CHECK (has_role('admin'));
DROP POLICY IF EXISTS entity_source_map_admin ON entity_source_map;
CREATE POLICY entity_source_map_admin ON entity_source_map FOR ALL TO authenticated USING (has_role('admin')) WITH CHECK (has_role('admin'));

-- =============================================================================
-- Updated-at triggers for tables that have updated_at
-- =============================================================================
-- (These tables don't have updated_at columns — they use upsert patterns)

-- =============================================================================
-- Seed site_settings keys for page content
-- =============================================================================

INSERT INTO site_settings (key, value, group_name) VALUES
  ('resources_hero', '{"title": "ESG Resources & Tools", "subtitle": "Curated collection of free assessment tools, consultant marketplaces, frameworks, and regulatory guides to help your ESG journey."}'::jsonb, 'content_pages'),
  ('navigation_primary', '[]'::jsonb, 'navigation'),
  ('footer_sections', '[]'::jsonb, 'navigation'),
  ('brand_guide', '{}'::jsonb, 'brand')
ON CONFLICT (key) DO NOTHING;
