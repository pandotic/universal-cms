-- Projects showcase tables
-- Stores the data-driven project portfolio content managed via the CMS.
-- Numbered 00106 to follow Hub migration sequence (00100-00105).

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

-- Updated_at trigger (reuse if already exists from earlier migrations)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER project_sections_updated_at
  BEFORE UPDATE ON project_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sections ENABLE ROW LEVEL SECURITY;

-- Public read access for published projects
CREATE POLICY "Public read access" ON projects
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public read access" ON project_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_sections.project_id
      AND projects.status = 'published'
    )
  );

-- Admin write access (authenticated users with super_admin or group_admin role)
CREATE POLICY "Admin write projects" ON projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
      AND hub_users.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY "Admin write project_sections" ON project_sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
      AND hub_users.hub_role IN ('super_admin', 'group_admin')
    )
  );
