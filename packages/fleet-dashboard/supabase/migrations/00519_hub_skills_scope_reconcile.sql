-- ============================================================
-- 00519_hub_skills_scope_reconcile.sql
-- Reconciles hub_skills / hub_skill_deployments with code.
--
-- Fixes the Skills page console error: listSkills() filters on
-- hub_skills.scope and manifest-sync upserts scope/manifest_id/
-- content_path/component_ids, but the live Hub DB never got these
-- columns. Migration 00107_hub_skill_versions.sql declares them but
-- was marked "applied" via `migration repair` without actually
-- running (per docs/MIGRATION-RECONCILIATION.md).
--
-- Fully idempotent — safe to re-run against any state.
-- ============================================================

-- ─── hub_skills extensions ────────────────────────────────────────────────

ALTER TABLE hub_skills
  ADD COLUMN IF NOT EXISTS scope         text NOT NULL DEFAULT 'fleet',
  ADD COLUMN IF NOT EXISTS content_path  text,
  ADD COLUMN IF NOT EXISTS component_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS manifest_id   text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hub_skills_manifest_id
  ON hub_skills (manifest_id) WHERE manifest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hub_skills_scope ON hub_skills(scope);

-- ─── hub_skill_deployments extensions ─────────────────────────────────────

ALTER TABLE hub_skill_deployments
  ADD COLUMN IF NOT EXISTS deployed_version text NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS current_version  text NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS pinned           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS github_pr_url    text,
  ADD COLUMN IF NOT EXISTS github_repo      text;

-- ─── hub_skill_versions table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hub_skill_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     uuid NOT NULL REFERENCES hub_skills(id) ON DELETE CASCADE,
  version      text NOT NULL,
  changelog    text,
  content_hash text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (skill_id, version)
);

CREATE INDEX IF NOT EXISTS idx_hub_skill_versions_skill
  ON hub_skill_versions(skill_id, created_at DESC);

ALTER TABLE hub_skill_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_skill_versions_select" ON hub_skill_versions;
DROP POLICY IF EXISTS "hub_skill_versions_insert" ON hub_skill_versions;

CREATE POLICY "hub_skill_versions_select" ON hub_skill_versions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "hub_skill_versions_insert" ON hub_skill_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE auth_user_id = auth.uid()
        AND hub_role IN ('super_admin', 'group_admin')
    )
  );
