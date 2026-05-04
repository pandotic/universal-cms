-- ─── API Central Bridge ────────────────────────────────────────────────
-- Ensures the api_services / api_secrets / projects tables exist in the
-- Hub schema. Historically these were created manually by running
-- `api-central/sql/setup.sql` once per environment, which leaves cold
-- applies broken because migration 00504 references api_secrets via FK.
--
-- This migration is idempotent — CREATE TABLE IF NOT EXISTS is a no-op
-- against any environment that already ran api-central/sql/setup.sql.
-- Greenfield Hub instances get the tables from this migration alone,
-- without needing to run external SQL scaffolding.
--
-- Schema mirrors api-central/sql/setup.sql (kept as reference material).
-- If api-central ever ships schema changes, apply them here too.

-- API services
CREATE TABLE IF NOT EXISTS api_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text,
  category text DEFAULT 'Other',
  entity text DEFAULT 'Other',
  login_method text,
  monthly_budget numeric(10,2) DEFAULT 0,
  current_spend numeric(10,2) DEFAULT 0,
  billing_cycle text DEFAULT 'monthly',
  renewal_date date,
  status text DEFAULT 'active',
  notes text,
  projects text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API secrets (referenced by hub_api_key_assignments.secret_id)
CREATE TABLE IF NOT EXISTS api_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES api_services(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  env text DEFAULT 'production',
  last_rotated date,
  expires_at date,
  encrypted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects (separate table from hub_properties; used by api-central for
-- budget/cost scoping. Left independent since prod already has this shape.)
CREATE TABLE IF NOT EXISTS api_central_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entity text,
  description text,
  active boolean DEFAULT true,
  scope text DEFAULT 'pandotic',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_api_services_status ON api_services(status);
CREATE INDEX IF NOT EXISTS idx_api_services_entity ON api_services(entity);
CREATE INDEX IF NOT EXISTS idx_api_secrets_service ON api_secrets(service_id);
CREATE INDEX IF NOT EXISTS idx_api_central_projects_active ON api_central_projects(active);

-- RLS (permissive by design — auth is enforced at the API layer;
-- matches the original api-central/sql/setup.sql intent).
ALTER TABLE api_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_central_projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "api_services_all" ON api_services
    FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "api_secrets_all" ON api_secrets
    FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "api_central_projects_all" ON api_central_projects
    FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
