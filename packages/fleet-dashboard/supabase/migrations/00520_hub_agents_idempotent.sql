-- ============================================================
-- 00520_hub_agents_idempotent.sql
-- Reconciles hub_agents + hub_agent_runs with code.
--
-- Historical context: migration 00104 created the tables with
-- agent_type/status/triggered_by as enum types. Migration 00116
-- was supposed to convert those to TEXT+CHECK but was marked
-- "applied" via migration repair without actually running against
-- the live Hub DB (same drift pattern as 00107/00519 for skills).
-- Net target: TEXT columns with CHECK constraints.
--
-- Fully idempotent — safe to re-run from any state.
-- ============================================================

-- ─── hub_agents table (created if missing, with TEXT types) ──────────────

CREATE TABLE IF NOT EXISTS hub_agents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  agent_type  text NOT NULL,
  config      jsonb NOT NULL DEFAULT '{}',
  enabled     boolean NOT NULL DEFAULT true,
  schedule    text,
  property_id uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES hub_users(id) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, slug)
);

-- If the table pre-existed with enum columns (from 00104), convert to TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hub_agents'
      AND column_name = 'agent_type'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE hub_agents ALTER COLUMN agent_type TYPE text USING agent_type::text;
  END IF;
END $$;

-- ─── hub_agent_runs table (created if missing, with TEXT types) ──────────

CREATE TABLE IF NOT EXISTS hub_agent_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      uuid NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending',
  started_at    timestamptz,
  completed_at  timestamptz,
  result        jsonb,
  error_message text,
  triggered_by  text NOT NULL,
  property_id   uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Unconditionally drop the status default. The DEFAULT 'pending'::agent_run_status
-- expression keeps an enum dependency even after ALTER COLUMN TYPE, which blocks
-- DROP TYPE agent_run_status below. Dropping + re-setting as plain text fixes it
-- on re-runs where the column was converted but the default wasn't cleaned up.
ALTER TABLE hub_agent_runs ALTER COLUMN status DROP DEFAULT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hub_agent_runs'
      AND column_name = 'status'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE hub_agent_runs ALTER COLUMN status TYPE text USING status::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hub_agent_runs'
      AND column_name = 'triggered_by'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE hub_agent_runs ALTER COLUMN triggered_by TYPE text USING triggered_by::text;
  END IF;
END $$;

ALTER TABLE hub_agent_runs ALTER COLUMN status SET DEFAULT 'pending';

-- ─── Drop obsolete enum types (now nothing references them) ──────────────

DROP TYPE IF EXISTS agent_type;
DROP TYPE IF EXISTS agent_run_status;
DROP TYPE IF EXISTS agent_trigger;

-- ─── CHECK constraints (added only if not already present) ───────────────

DO $$ BEGIN
  ALTER TABLE hub_agents ADD CONSTRAINT hub_agents_agent_type_check
    CHECK (agent_type IN (
      'seo_audit', 'broken_links', 'dependency_update',
      'content_freshness', 'ssl_monitor', 'custom',
      'marketing_director',
      'editorial_director', 'long_form_writer', 'copywriter',
      'repurposing_specialist', 'graphics_orchestrator',
      'growth_director', 'social_media_manager', 'pr_strategist',
      'seo_specialist', 'link_builder',
      'head_of_partnerships', 'influencer_researcher',
      'podcast_booker', 'community_manager',
      'email_marketing_manager',
      'research_analyst',
      'head_of_marketing_ops', 'analyst', 'customer_voice_researcher',
      'skeptical_reviewer', 'compliance_officer',
      'brand_profile_builder', 'social_profile_creator',
      'directory_submission_agent', 'review_site_claimer',
      'link_monitoring_agent'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE hub_agent_runs ADD CONSTRAINT hub_agent_runs_status_check
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE hub_agent_runs ADD CONSTRAINT hub_agent_runs_triggered_by_check
    CHECK (triggered_by IN ('schedule', 'manual', 'webhook'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_hub_agents_property_id ON hub_agents(property_id);
CREATE INDEX IF NOT EXISTS idx_hub_agents_agent_type  ON hub_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_hub_agents_enabled     ON hub_agents(enabled);

CREATE INDEX IF NOT EXISTS idx_hub_agent_runs_agent_id_created_at
  ON hub_agent_runs(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_hub_agent_runs_property_id
  ON hub_agent_runs(property_id);
CREATE INDEX IF NOT EXISTS idx_hub_agent_runs_status
  ON hub_agent_runs(status);

-- ─── updated_at trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_hub_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hub_agents_updated_at_trigger ON hub_agents;
CREATE TRIGGER hub_agents_updated_at_trigger
  BEFORE UPDATE ON hub_agents
  FOR EACH ROW EXECUTE FUNCTION update_hub_agents_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE hub_agents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_agent_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agents_select_authenticated ON hub_agents;
DROP POLICY IF EXISTS agents_insert_admin         ON hub_agents;
DROP POLICY IF EXISTS agents_update_admin         ON hub_agents;
DROP POLICY IF EXISTS agents_delete_admin         ON hub_agents;
DROP POLICY IF EXISTS agent_runs_select_authenticated ON hub_agent_runs;
DROP POLICY IF EXISTS agent_runs_insert_admin         ON hub_agent_runs;
DROP POLICY IF EXISTS agent_runs_update_admin         ON hub_agent_runs;

CREATE POLICY agents_select_authenticated ON hub_agents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY agents_insert_admin ON hub_agents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE auth_user_id = auth.uid()
        AND hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY agents_update_admin ON hub_agents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE auth_user_id = auth.uid()
        AND hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE auth_user_id = auth.uid()
        AND hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY agents_delete_admin ON hub_agents
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE auth_user_id = auth.uid()
        AND hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY agent_runs_select_authenticated ON hub_agent_runs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY agent_runs_insert_admin ON hub_agent_runs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE auth_user_id = auth.uid()
        AND hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY agent_runs_update_admin ON hub_agent_runs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE auth_user_id = auth.uid()
        AND hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE auth_user_id = auth.uid()
        AND hub_role IN ('super_admin', 'group_admin')
    )
  );
