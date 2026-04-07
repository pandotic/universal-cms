-- Certifications: badges and awards for entities

-- =============================================================================
-- Enums
-- =============================================================================
CREATE TYPE certification_rule_type AS ENUM (
  'score_threshold', 'attribute_match', 'manual_override', 'tag_required'
);

-- =============================================================================
-- cms_certifications
-- =============================================================================
CREATE TABLE cms_certifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  badge_image   TEXT,
  criteria_text TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_cms_certifications_updated_at
  BEFORE UPDATE ON cms_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- certification_rules
-- =============================================================================
CREATE TABLE certification_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID NOT NULL REFERENCES cms_certifications(id) ON DELETE CASCADE,
  rule_type        certification_rule_type NOT NULL,
  config           JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- entity_certifications
-- =============================================================================
CREATE TABLE entity_certifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT NOT NULL,
  entity_id        TEXT NOT NULL,
  certification_id UUID NOT NULL REFERENCES cms_certifications(id) ON DELETE CASCADE,
  awarded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ,
  awarded_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes            TEXT,
  UNIQUE (entity_type, entity_id, certification_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_cms_certifications_slug ON cms_certifications (slug);
CREATE INDEX idx_entity_certifications_entity ON entity_certifications (entity_type, entity_id);
CREATE INDEX idx_entity_certifications_cert ON entity_certifications (certification_id);
CREATE INDEX idx_certification_rules_cert ON certification_rules (certification_id);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE cms_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_certifications ENABLE ROW LEVEL SECURITY;

-- Certifications are readable by everyone
CREATE POLICY cms_certifications_select_public
  ON cms_certifications FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY cms_certifications_insert_admin
  ON cms_certifications FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY cms_certifications_update_admin
  ON cms_certifications FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY cms_certifications_delete_admin
  ON cms_certifications FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- Certification rules readable by everyone, manageable by admin
CREATE POLICY certification_rules_select_public
  ON certification_rules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY certification_rules_insert_admin
  ON certification_rules FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY certification_rules_update_admin
  ON certification_rules FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY certification_rules_delete_admin
  ON certification_rules FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- Entity certifications readable by everyone, manageable by admin
CREATE POLICY entity_certifications_select_public
  ON entity_certifications FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY entity_certifications_insert_admin
  ON entity_certifications FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY entity_certifications_update_admin
  ON entity_certifications FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY entity_certifications_delete_admin
  ON entity_certifications FOR DELETE
  TO authenticated
  USING (has_role('admin'));
