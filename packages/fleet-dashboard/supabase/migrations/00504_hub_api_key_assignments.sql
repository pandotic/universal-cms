-- ─── Hub API Key Assignments ─────────────────────────────────────────────────
-- Junction table linking API secrets (from api_central) to fleet properties.
-- Enables the "assign key to fleet apps" feature in the APIs & AI section.

CREATE TABLE IF NOT EXISTS hub_api_key_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_id UUID NOT NULL REFERENCES api_secrets(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'production',
  assigned_by UUID REFERENCES hub_users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(secret_id, property_id, environment)
);

CREATE INDEX idx_hub_api_key_assignments_property ON hub_api_key_assignments(property_id);
CREATE INDEX idx_hub_api_key_assignments_secret ON hub_api_key_assignments(secret_id);

ALTER TABLE hub_api_key_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_api_key_assignments_read"
  ON hub_api_key_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "hub_api_key_assignments_write"
  ON hub_api_key_assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
