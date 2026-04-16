-- Click Analytics: outbound link tracking

-- =============================================================================
-- outbound_links
-- =============================================================================
CREATE TABLE IF NOT EXISTS outbound_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT NOT NULL,
  label       TEXT,
  placement   TEXT,
  entity_type TEXT,
  entity_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- outbound_clicks
-- =============================================================================
CREATE TABLE IF NOT EXISTS outbound_clicks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id    UUID NOT NULL REFERENCES outbound_links(id) ON DELETE CASCADE,
  session_id TEXT,
  user_agent TEXT,
  referrer   TEXT,
  ip_hash    TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_outbound_links_entity ON outbound_links (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_link_id ON outbound_clicks (link_id);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_clicked_at ON outbound_clicks (clicked_at DESC);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE outbound_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_clicks ENABLE ROW LEVEL SECURITY;

-- Links are readable by everyone (used on public pages)
DROP POLICY IF EXISTS outbound_links_select_public ON outbound_links;
CREATE POLICY outbound_links_select_public
  ON outbound_links FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS outbound_links_insert_editorial ON outbound_links;
CREATE POLICY outbound_links_insert_editorial
  ON outbound_links FOR INSERT
  TO authenticated
  WITH CHECK (has_role('editor') OR has_role('admin'));

DROP POLICY IF EXISTS outbound_links_update_editorial ON outbound_links;
CREATE POLICY outbound_links_update_editorial
  ON outbound_links FOR UPDATE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'))
  WITH CHECK (has_role('editor') OR has_role('admin'));

DROP POLICY IF EXISTS outbound_links_delete_editorial ON outbound_links;
CREATE POLICY outbound_links_delete_editorial
  ON outbound_links FOR DELETE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

-- Clicks are insertable by anyone (anonymous tracking)
DROP POLICY IF EXISTS outbound_clicks_insert_public ON outbound_clicks;
CREATE POLICY outbound_clicks_insert_public
  ON outbound_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Clicks are readable by admins only
DROP POLICY IF EXISTS outbound_clicks_select_admin ON outbound_clicks;
CREATE POLICY outbound_clicks_select_admin
  ON outbound_clicks FOR SELECT
  TO authenticated
  USING (has_role('admin'));
