-- Site Settings: key-value configuration store

-- =============================================================================
-- site_settings
-- =============================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT UNIQUE NOT NULL,
  value      JSONB NOT NULL DEFAULT '{}',
  group_name TEXT NOT NULL DEFAULT 'general',
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Settings are readable by everyone (public analytics IDs, site name, etc.)
DROP POLICY IF EXISTS site_settings_select_public ON site_settings;
CREATE POLICY site_settings_select_public
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS site_settings_insert_admin ON site_settings;
CREATE POLICY site_settings_insert_admin
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS site_settings_update_admin ON site_settings;
CREATE POLICY site_settings_update_admin
  ON site_settings FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS site_settings_delete_admin ON site_settings;
CREATE POLICY site_settings_delete_admin
  ON site_settings FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- =============================================================================
-- Seed initial settings
-- =============================================================================
INSERT INTO site_settings (key, value, group_name) VALUES
  ('site_name', '"ESG Source"'::jsonb, 'general'),
  ('site_url', '"https://esgsource.com"'::jsonb, 'general'),
  ('site_description', '"The definitive source for ESG software ratings, reviews, and career resources."'::jsonb, 'general'),
  ('analytics_providers', '[]'::jsonb, 'integrations'),
  ('social_handles', '{"twitter": "", "linkedin": "", "youtube": ""}'::jsonb, 'social'),
  ('legal_disclosure', '""'::jsonb, 'legal')
ON CONFLICT (key) DO NOTHING;
