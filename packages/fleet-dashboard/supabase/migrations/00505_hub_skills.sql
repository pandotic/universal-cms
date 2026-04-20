-- ═══════════════════════════════════════════════════════════════════════════
-- hub_skills — Skill Library tables for Pandotic Hub
-- Stores skill definitions, deployments to properties, and execution runs.
-- Idempotent: enums wrapped in exception handlers; tables/indexes/policies
-- use IF NOT EXISTS or DROP-then-CREATE.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Enums ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE skill_platform AS ENUM (
    'google_ads', 'meta_ads', 'linkedin', 'twitter', 'tiktok',
    'email', 'seo', 'analytics', 'content', 'social_organic', 'cross_platform'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE skill_category AS ENUM (
    'acquisition', 'retention', 'engagement', 'analytics',
    'content_creation', 'brand_management', 'automation'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE skill_execution_mode AS ENUM (
    'scheduled', 'manual', 'webhook', 'event'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE skill_status AS ENUM (
    'draft', 'active', 'paused', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deploy_target_type AS ENUM (
    'universal_cms', 'wordpress', 'static', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deployment_status AS ENUM (
    'pending', 'active', 'paused', 'failed', 'removed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE deployment_run_status AS ENUM (
    'pending', 'running', 'completed', 'failed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE run_trigger AS ENUM (
    'schedule', 'manual', 'webhook', 'event'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Skill Definitions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hub_skills (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  slug             text NOT NULL UNIQUE,
  description      text NOT NULL DEFAULT '',
  platform         skill_platform NOT NULL,
  category         skill_category NOT NULL,
  execution_mode   skill_execution_mode NOT NULL DEFAULT 'manual',
  default_config   jsonb NOT NULL DEFAULT '{}'::jsonb,
  config_schema    jsonb,
  default_schedule text,
  status           skill_status NOT NULL DEFAULT 'draft',
  version          text NOT NULL DEFAULT '0.1.0',
  tags             text[] NOT NULL DEFAULT '{}',
  created_by       uuid REFERENCES hub_users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_skills_platform ON hub_skills(platform);
CREATE INDEX IF NOT EXISTS idx_hub_skills_category ON hub_skills(category);
CREATE INDEX IF NOT EXISTS idx_hub_skills_status   ON hub_skills(status);
CREATE INDEX IF NOT EXISTS idx_hub_skills_tags     ON hub_skills USING gin(tags);

-- ─── Skill Deployments ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hub_skill_deployments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id         uuid NOT NULL REFERENCES hub_skills(id) ON DELETE CASCADE,
  property_id      uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  config_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  schedule         text,
  target_type      deploy_target_type NOT NULL DEFAULT 'universal_cms',
  status           deployment_status NOT NULL DEFAULT 'pending',
  last_run_at      timestamptz,
  last_run_status  deployment_run_status,
  deployed_by      uuid REFERENCES hub_users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (skill_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_hub_skill_deployments_skill    ON hub_skill_deployments(skill_id);
CREATE INDEX IF NOT EXISTS idx_hub_skill_deployments_property ON hub_skill_deployments(property_id);
CREATE INDEX IF NOT EXISTS idx_hub_skill_deployments_status   ON hub_skill_deployments(status);

-- ─── Deployment Runs ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hub_skill_deployment_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id    uuid NOT NULL REFERENCES hub_skill_deployments(id) ON DELETE CASCADE,
  skill_id         uuid NOT NULL REFERENCES hub_skills(id) ON DELETE CASCADE,
  property_id      uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  status           deployment_run_status NOT NULL DEFAULT 'pending',
  triggered_by     run_trigger NOT NULL DEFAULT 'manual',
  effective_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  result           jsonb,
  error_message    text,
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_skill_runs_deployment ON hub_skill_deployment_runs(deployment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hub_skill_runs_property   ON hub_skill_deployment_runs(property_id);
CREATE INDEX IF NOT EXISTS idx_hub_skill_runs_status     ON hub_skill_deployment_runs(status);

-- ─── RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE hub_skills                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_skill_deployments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_skill_deployment_runs   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_skills_select"              ON hub_skills;
DROP POLICY IF EXISTS "hub_skills_insert"              ON hub_skills;
DROP POLICY IF EXISTS "hub_skills_update"              ON hub_skills;
DROP POLICY IF EXISTS "hub_skill_deployments_select"   ON hub_skill_deployments;
DROP POLICY IF EXISTS "hub_skill_deployments_insert"   ON hub_skill_deployments;
DROP POLICY IF EXISTS "hub_skill_deployments_update"   ON hub_skill_deployments;
DROP POLICY IF EXISTS "hub_skill_runs_select"          ON hub_skill_deployment_runs;
DROP POLICY IF EXISTS "hub_skill_runs_insert"          ON hub_skill_deployment_runs;
DROP POLICY IF EXISTS "hub_skill_runs_update"          ON hub_skill_deployment_runs;

CREATE POLICY "hub_skills_select" ON hub_skills
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "hub_skills_insert" ON hub_skills
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM hub_users
     WHERE auth_user_id = auth.uid()
       AND hub_role IN ('super_admin', 'group_admin')
  ));
CREATE POLICY "hub_skills_update" ON hub_skills
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM hub_users
     WHERE auth_user_id = auth.uid()
       AND hub_role IN ('super_admin', 'group_admin')
  ));

CREATE POLICY "hub_skill_deployments_select" ON hub_skill_deployments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "hub_skill_deployments_insert" ON hub_skill_deployments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM hub_users
     WHERE auth_user_id = auth.uid()
       AND hub_role IN ('super_admin', 'group_admin')
  ));
CREATE POLICY "hub_skill_deployments_update" ON hub_skill_deployments
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM hub_users
     WHERE auth_user_id = auth.uid()
       AND hub_role IN ('super_admin', 'group_admin')
  ));

CREATE POLICY "hub_skill_runs_select" ON hub_skill_deployment_runs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "hub_skill_runs_insert" ON hub_skill_deployment_runs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM hub_users
     WHERE auth_user_id = auth.uid()
       AND hub_role IN ('super_admin', 'group_admin')
  ));
CREATE POLICY "hub_skill_runs_update" ON hub_skill_deployment_runs
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM hub_users
     WHERE auth_user_id = auth.uid()
       AND hub_role IN ('super_admin', 'group_admin')
  ));
