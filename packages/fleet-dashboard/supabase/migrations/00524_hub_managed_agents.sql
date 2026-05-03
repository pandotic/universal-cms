-- ============================================================
-- 00524_hub_managed_agents.sql
-- Adds Anthropic Managed Agents agent_id storage to hub_agents.
--
-- Each Managed Agent is created once via `agents.create()` (returns
-- agt_... id + version int). Sessions then reference that ID:
--   sessions.create({agent: managed_agent_id, ...})
--
-- We store the ID per hub_agents row so the runner can look it up
-- when claiming a run. Multiple property rows of the same agent_type
-- share the same managed_agent_id (the register script handles
-- ordering / fan-out).
--
-- Forward-only, fully idempotent.
-- ============================================================

ALTER TABLE hub_agents ADD COLUMN IF NOT EXISTS managed_agent_id      text NULL;
ALTER TABLE hub_agents ADD COLUMN IF NOT EXISTS managed_agent_version int  NULL;

CREATE INDEX IF NOT EXISTS idx_hub_agents_managed_agent_id
  ON hub_agents(managed_agent_id) WHERE managed_agent_id IS NOT NULL;
