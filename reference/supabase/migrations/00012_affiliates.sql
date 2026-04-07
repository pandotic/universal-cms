-- Affiliates: program and link management for monetization

-- =============================================================================
-- Enums
-- =============================================================================
CREATE TYPE affiliate_network AS ENUM (
  'amazon', 'shareasale', 'cj', 'rakuten', 'impact', 'partnerstack', 'direct', 'custom'
);

-- =============================================================================
-- affiliate_programs
-- =============================================================================
CREATE TABLE affiliate_programs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  network             affiliate_network NOT NULL,
  merchant_name       TEXT,
  base_url            TEXT,
  tracking_template   TEXT,
  tracking_id         TEXT,
  commission_text     TEXT,
  cookie_duration_days INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_affiliate_programs_updated_at
  BEFORE UPDATE ON affiliate_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- affiliate_links
-- =============================================================================
CREATE TABLE affiliate_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID REFERENCES affiliate_programs(id) ON DELETE SET NULL,
  entity_type     TEXT,
  entity_id       TEXT,
  destination_url TEXT NOT NULL,
  tracking_url    TEXT,
  placement       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_affiliate_programs_network ON affiliate_programs (network);
CREATE INDEX idx_affiliate_programs_active ON affiliate_programs (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_affiliate_links_program ON affiliate_links (program_id);
CREATE INDEX idx_affiliate_links_entity ON affiliate_links (entity_type, entity_id);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;

-- Programs readable by admin only (contains sensitive tracking IDs)
CREATE POLICY affiliate_programs_select_admin
  ON affiliate_programs FOR SELECT
  TO authenticated
  USING (has_role('admin'));

CREATE POLICY affiliate_programs_insert_admin
  ON affiliate_programs FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY affiliate_programs_update_admin
  ON affiliate_programs FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY affiliate_programs_delete_admin
  ON affiliate_programs FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- Links are readable by all (used on public pages to render affiliate URLs)
CREATE POLICY affiliate_links_select_public
  ON affiliate_links FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY affiliate_links_insert_admin
  ON affiliate_links FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY affiliate_links_update_admin
  ON affiliate_links FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY affiliate_links_delete_admin
  ON affiliate_links FOR DELETE
  TO authenticated
  USING (has_role('admin'));
