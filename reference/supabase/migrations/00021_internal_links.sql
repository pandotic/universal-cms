-- Internal link registry: tracks every internal link across the site
CREATE TABLE IF NOT EXISTS internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page TEXT NOT NULL,   -- URL path, e.g. /directory/gri-foundation
  target_page TEXT NOT NULL,   -- URL path, e.g. /frameworks/gri-standards
  anchor_text TEXT,
  link_type TEXT NOT NULL DEFAULT 'content' CHECK (link_type IN ('content', 'auto', 'glossary', 'nav', 'footer', 'related')),
  context_snippet TEXT,        -- surrounding text excerpt
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_page, target_page, anchor_text)
);

CREATE INDEX IF NOT EXISTS idx_internal_links_source ON internal_links(source_page);
CREATE INDEX IF NOT EXISTS idx_internal_links_target ON internal_links(target_page);

-- Link suggestions: pages that should link to other pages
CREATE TABLE IF NOT EXISTS link_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page TEXT NOT NULL,
  target_page TEXT NOT NULL,
  target_title TEXT,
  suggested_anchor TEXT,
  relevance_score INTEGER DEFAULT 0,  -- 0-100
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_page, target_page)
);

CREATE INDEX IF NOT EXISTS idx_link_suggestions_status ON link_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_score ON link_suggestions(relevance_score DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE internal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY internal_links_admin_all ON internal_links
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

ALTER TABLE link_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY link_suggestions_admin_all ON link_suggestions
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));
