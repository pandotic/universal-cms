-- Hub Properties — registry of all managed sites and apps
-- Migration prefix 00100_ avoids collision with per-site migrations (00001-00025)

CREATE TABLE IF NOT EXISTS hub_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  url text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('site', 'app')),
  preset text,
  enabled_modules text[] DEFAULT '{}',
  supabase_project_ref text,
  supabase_url text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'archived', 'error')),
  health_status text NOT NULL DEFAULT 'unknown'
    CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  last_deploy_at timestamptz,
  ssl_valid boolean DEFAULT true,
  ssl_expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_hub_properties_type ON hub_properties(property_type);
CREATE INDEX idx_hub_properties_status ON hub_properties(status);

-- RLS: Phase 1 — authenticated users can read; super_admin can write
ALTER TABLE hub_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_properties_read" ON hub_properties
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "hub_properties_write" ON hub_properties
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role = 'super_admin'
    )
  );
