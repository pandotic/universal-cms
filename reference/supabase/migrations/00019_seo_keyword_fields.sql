-- SEO keyword fields for content tables and keyword registry table

-- ============================================================
-- 1. Add SEO keyword columns to existing tables
-- ============================================================

ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER,
  ADD COLUMN IF NOT EXISTS seo_analysis JSONB;

ALTER TABLE frameworks
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER,
  ADD COLUMN IF NOT EXISTS seo_analysis JSONB;

ALTER TABLE glossary_terms
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER,
  ADD COLUMN IF NOT EXISTS seo_analysis JSONB;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER,
  ADD COLUMN IF NOT EXISTS seo_analysis JSONB;

-- content_pages already has seo_title/seo_description; add keyword fields only
ALTER TABLE content_pages
  ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
  ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}';

-- ============================================================
-- 2. Keyword registry table
-- ============================================================

CREATE TABLE IF NOT EXISTS keyword_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT UNIQUE NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER CHECK (difficulty BETWEEN 0 AND 100),
  assigned_page_type TEXT, -- 'entity', 'framework', 'glossary', 'category', 'content_page'
  assigned_page_slug TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keyword_registry_keyword ON keyword_registry(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_registry_page ON keyword_registry(assigned_page_type, assigned_page_slug);

-- ============================================================
-- 3. Row Level Security for keyword_registry
-- ============================================================

ALTER TABLE keyword_registry ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY keyword_registry_public_read ON keyword_registry
  FOR SELECT USING (true);

-- Admins have full access
CREATE POLICY keyword_registry_admin_all ON keyword_registry
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));
