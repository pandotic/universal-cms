-- ─── Phase 3: Agent Workflows ──────────────────────────────────────────────
-- Automated tasks and monitoring per property (SEO audits, broken links, etc.)
-- Created: Phase 3 (Pandotic Hub — Agent Workflows)

-- ─── Agent Types ───────────────────────────────────────────────────────────

CREATE TYPE agent_type AS ENUM (
  'seo_audit',
  'broken_links',
  'dependency_update',
  'content_freshness',
  'ssl_monitor',
  'custom'
);

CREATE TYPE agent_run_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE agent_trigger AS ENUM (
  'schedule',
  'manual',
  'webhook'
);

-- ─── Hub Agents Table ──────────────────────────────────────────────────────

CREATE TABLE hub_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  agent_type agent_type NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  schedule TEXT, -- Cron expression (e.g., "0 0 * * 0" for weekly)
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES hub_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, slug)
);

CREATE INDEX idx_hub_agents_property_id ON hub_agents(property_id);
CREATE INDEX idx_hub_agents_agent_type ON hub_agents(agent_type);
CREATE INDEX idx_hub_agents_enabled ON hub_agents(enabled);

-- ─── Hub Agent Runs Table ──────────────────────────────────────────────────

CREATE TABLE hub_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  status agent_run_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB, -- JSON result payload specific to agent_type
  error_message TEXT,
  triggered_by agent_trigger NOT NULL,
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_agent_runs_agent_id_created_at ON hub_agent_runs(agent_id, created_at);
CREATE INDEX idx_hub_agent_runs_property_id ON hub_agent_runs(property_id);
CREATE INDEX idx_hub_agent_runs_status ON hub_agent_runs(status);

-- ─── Row Level Security ────────────────────────────────────────────────────

ALTER TABLE hub_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_agent_runs ENABLE ROW LEVEL SECURITY;

-- Agents: Authenticated users can view all agents; only super_admin and group_admin can create/modify
CREATE POLICY agents_select_authenticated ON hub_agents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY agents_insert_admin ON hub_agents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY agents_update_admin ON hub_agents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY agents_delete_admin ON hub_agents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

-- Agent Runs: Same as agents
CREATE POLICY agent_runs_select_authenticated ON hub_agent_runs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY agent_runs_insert_admin ON hub_agent_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY agent_runs_update_admin ON hub_agent_runs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

-- ─── Helper Functions ──────────────────────────────────────────────────────

-- Auto-update updated_at timestamp on hub_agents
CREATE OR REPLACE FUNCTION update_hub_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_agents_updated_at_trigger
  BEFORE UPDATE ON hub_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_agents_updated_at();
