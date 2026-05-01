-- ============================================================
-- 00522_hub_media_assets.sql
-- Multimedia Content Engine — Phase 1 schema additions.
--
-- New: hub_media_assets table (generated images/video per pipeline item)
-- Extends: hub_content_pipeline (synced_at, media_status)
-- Extends: hub_agent_runs (session_id for Managed Agents SSE resume)
-- Extends: hub_properties (webhook_secret for per-property HMAC auth)
--
-- Forward-only, fully idempotent (safe to re-run on any DB state).
-- ============================================================

-- ─── hub_media_assets ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hub_media_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id   uuid NOT NULL REFERENCES hub_content_pipeline(id) ON DELETE CASCADE,
  asset_type    text NOT NULL,
  url           text NOT NULL,
  prompt        text,
  prompts_json  jsonb,
  provider      text NOT NULL,
  regen_count   int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE hub_media_assets ADD CONSTRAINT hub_media_assets_asset_type_check
    CHECK (asset_type IN ('hero', 'pillar', 'social_li', 'social_x', 'video'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE hub_media_assets ADD CONSTRAINT hub_media_assets_provider_check
    CHECK (provider IN ('gemini', 'heygen'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_hub_media_assets_pipeline_id
  ON hub_media_assets(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_hub_media_assets_asset_type
  ON hub_media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_hub_media_assets_provider
  ON hub_media_assets(provider);

CREATE OR REPLACE FUNCTION update_hub_media_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hub_media_assets_updated_at_trigger ON hub_media_assets;
CREATE TRIGGER hub_media_assets_updated_at_trigger
  BEFORE UPDATE ON hub_media_assets
  FOR EACH ROW EXECUTE FUNCTION update_hub_media_assets_updated_at();

ALTER TABLE hub_media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_assets_select_authenticated ON hub_media_assets;
DROP POLICY IF EXISTS media_assets_insert_admin         ON hub_media_assets;
DROP POLICY IF EXISTS media_assets_update_admin         ON hub_media_assets;
DROP POLICY IF EXISTS media_assets_delete_admin         ON hub_media_assets;

CREATE POLICY media_assets_select_authenticated ON hub_media_assets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY media_assets_insert_admin ON hub_media_assets
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid()
      AND hub_role IN ('super_admin', 'group_admin')
  ));
CREATE POLICY media_assets_update_admin ON hub_media_assets
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid()
      AND hub_role IN ('super_admin', 'group_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid()
      AND hub_role IN ('super_admin', 'group_admin')
  ));
CREATE POLICY media_assets_delete_admin ON hub_media_assets
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM hub_users WHERE auth_user_id = auth.uid()
      AND hub_role IN ('super_admin', 'group_admin')
  ));

-- ─── hub_content_pipeline extensions ────────────────────────────────────────

-- synced_at: set by consumer site after pulling approved content via syncApprovedMedia
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS synced_at    timestamptz NULL;

-- media_status: tracks parallel media generation lifecycle
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS media_status text NULL;

DO $$ BEGIN
  ALTER TABLE hub_content_pipeline ADD CONSTRAINT hub_content_pipeline_media_status_check
    CHECK (media_status IS NULL OR media_status IN ('pending', 'generating', 'ready', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_synced_at
  ON hub_content_pipeline(synced_at) WHERE synced_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_media_status
  ON hub_content_pipeline(media_status) WHERE media_status IS NOT NULL;

-- ─── hub_agent_runs extension ─────────────────────────────────────────────────

-- session_id: Anthropic Managed Agents session ID (sesn_...) for SSE stream resume
ALTER TABLE hub_agent_runs ADD COLUMN IF NOT EXISTS session_id text NULL;

CREATE INDEX IF NOT EXISTS idx_hub_agent_runs_session_id
  ON hub_agent_runs(session_id) WHERE session_id IS NOT NULL;

-- ─── hub_properties extension ────────────────────────────────────────────────

-- webhook_secret: per-property HMAC-SHA256 secret for /api/webhooks/agent-run auth
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS webhook_secret text NULL;
