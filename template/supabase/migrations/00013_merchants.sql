-- Merchants: vendor/merchant directory with editorial scores and collections

-- =============================================================================
-- Enums
-- =============================================================================
CREATE TYPE merchant_status AS ENUM ('active', 'inactive', 'pending');

-- =============================================================================
-- merchants
-- =============================================================================
CREATE TABLE merchants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  logo_url         TEXT,
  website_url      TEXT,
  status           merchant_status NOT NULL DEFAULT 'active',
  editorial_score  NUMERIC(3,1),
  trust_score      NUMERIC(3,1),
  value_score      NUMERIC(3,1),
  selection_score  NUMERIC(3,1),
  shipping_score   NUMERIC(3,1),
  service_score    NUMERIC(3,1),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- merchant_collections
-- =============================================================================
CREATE TABLE merchant_collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_merchant_collections_updated_at
  BEFORE UPDATE ON merchant_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_merchants_slug ON merchants (slug);
CREATE INDEX idx_merchants_status ON merchants (status);
CREATE INDEX idx_merchant_collections_merchant ON merchant_collections (merchant_id);
CREATE INDEX idx_merchant_collections_slug ON merchant_collections (slug);
CREATE INDEX idx_merchant_collections_featured ON merchant_collections (is_featured) WHERE is_featured = TRUE;

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_collections ENABLE ROW LEVEL SECURITY;

-- Active merchants readable by all
CREATE POLICY merchants_select_active
  ON merchants FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Editors/admins can see all merchants
CREATE POLICY merchants_select_editorial
  ON merchants FOR SELECT
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

CREATE POLICY merchants_insert_editorial
  ON merchants FOR INSERT
  TO authenticated
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY merchants_update_editorial
  ON merchants FOR UPDATE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'))
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY merchants_delete_editorial
  ON merchants FOR DELETE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

-- Collections of active merchants readable by all
CREATE POLICY merchant_collections_select_active
  ON merchant_collections FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merchants
      WHERE merchants.id = merchant_collections.merchant_id
        AND merchants.status = 'active'
    )
  );

-- Editors/admins can see all collections
CREATE POLICY merchant_collections_select_editorial
  ON merchant_collections FOR SELECT
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

CREATE POLICY merchant_collections_insert_editorial
  ON merchant_collections FOR INSERT
  TO authenticated
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY merchant_collections_update_editorial
  ON merchant_collections FOR UPDATE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'))
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY merchant_collections_delete_editorial
  ON merchant_collections FOR DELETE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));
