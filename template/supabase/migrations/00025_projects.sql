-- Projects showcase tables
-- Stores data-driven project portfolio content managed via the CMS.
-- Per-site migration for consuming sites using @pandotic/universal-cms.

-- projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  client TEXT,
  tagline TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category TEXT,
  has_live_demo BOOLEAN DEFAULT false,
  demo_url TEXT,
  live_url TEXT,
  own_site_url TEXT,
  repo_url TEXT,
  hero_screenshot TEXT,
  video_long_id TEXT,
  video_short_id TEXT,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- project_sections table — stores markdown content for each section type
CREATE TABLE IF NOT EXISTS project_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'product-page', 'case-study', 'features', 'portfolio',
    'blurbs', 'proof-points', 'tech-differentiators'
  )),
  title TEXT,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, section_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_sections_project ON project_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_sections_type ON project_sections(section_type);

-- Updated_at triggers (reuse update_updated_at_column if it exists from earlier migrations)
DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_project_sections_updated_at ON project_sections;
CREATE TRIGGER trg_project_sections_updated_at
  BEFORE UPDATE ON project_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sections ENABLE ROW LEVEL SECURITY;

-- Public read access for published projects
DROP POLICY IF EXISTS projects_select_published ON projects;
CREATE POLICY projects_select_published ON projects
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS project_sections_select_published ON project_sections;
CREATE POLICY project_sections_select_published ON project_sections
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_sections.project_id
      AND projects.status = 'published'
    )
  );

-- Admin full read (drafts too)
DROP POLICY IF EXISTS projects_select_admin ON projects;
CREATE POLICY projects_select_admin ON projects
  FOR SELECT
  TO authenticated
  USING (has_role('admin') OR has_role('editor'));

DROP POLICY IF EXISTS project_sections_select_admin ON project_sections;
CREATE POLICY project_sections_select_admin ON project_sections
  FOR SELECT
  TO authenticated
  USING (has_role('admin') OR has_role('editor'));

-- Admin write
DROP POLICY IF EXISTS projects_insert ON projects;
CREATE POLICY projects_insert ON projects
  FOR INSERT TO authenticated WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS projects_update ON projects;
CREATE POLICY projects_update ON projects
  FOR UPDATE TO authenticated USING (has_role('admin'));

DROP POLICY IF EXISTS projects_delete ON projects;
CREATE POLICY projects_delete ON projects
  FOR DELETE TO authenticated USING (has_role('admin'));

DROP POLICY IF EXISTS project_sections_insert ON project_sections;
CREATE POLICY project_sections_insert ON project_sections
  FOR INSERT TO authenticated WITH CHECK (has_role('admin') OR has_role('editor'));

DROP POLICY IF EXISTS project_sections_update ON project_sections;
CREATE POLICY project_sections_update ON project_sections
  FOR UPDATE TO authenticated USING (has_role('admin') OR has_role('editor'));

DROP POLICY IF EXISTS project_sections_delete ON project_sections;
CREATE POLICY project_sections_delete ON project_sections
  FOR DELETE TO authenticated USING (has_role('admin'));
