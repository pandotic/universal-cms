-- Content Pages: articles, guides, landing pages, and custom pages

-- =============================================================================
-- Enums
-- =============================================================================
CREATE TYPE page_type AS ENUM ('article', 'guide', 'landing', 'custom');
CREATE TYPE page_status AS ENUM ('draft', 'published', 'archived');

-- =============================================================================
-- content_pages
-- =============================================================================
CREATE TABLE content_pages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  page_type       page_type NOT NULL DEFAULT 'article',
  body            TEXT,
  excerpt         TEXT,
  seo_title       TEXT,
  seo_description TEXT,
  og_image        TEXT,
  status          page_status NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMPTZ,
  author_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_content_pages_updated_at
  BEFORE UPDATE ON content_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_content_pages_slug ON content_pages (slug);
CREATE INDEX idx_content_pages_status ON content_pages (status);
CREATE INDEX idx_content_pages_published_at ON content_pages (published_at DESC);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

-- Published pages are readable by everyone (including anonymous)
CREATE POLICY content_pages_select_published
  ON content_pages FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Editors and admins can read all pages regardless of status
CREATE POLICY content_pages_select_editorial
  ON content_pages FOR SELECT
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

-- Editors and admins can insert pages
CREATE POLICY content_pages_insert_editorial
  ON content_pages FOR INSERT
  TO authenticated
  WITH CHECK (has_role('editor') OR has_role('admin'));

-- Editors and admins can update pages
CREATE POLICY content_pages_update_editorial
  ON content_pages FOR UPDATE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'))
  WITH CHECK (has_role('editor') OR has_role('admin'));

-- Editors and admins can delete pages
CREATE POLICY content_pages_delete_editorial
  ON content_pages FOR DELETE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));
