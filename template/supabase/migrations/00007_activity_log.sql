-- Activity Log: audit trail for CMS actions

-- =============================================================================
-- Enums
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE activity_action AS ENUM (
    'create', 'update', 'delete', 'publish', 'archive', 'login', 'bulk_import'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- activity_log
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action       activity_action NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT,
  entity_title TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON activity_log (entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log (user_id);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Admins and editors can read activity logs
DROP POLICY IF EXISTS activity_log_select_editorial ON activity_log;
CREATE POLICY activity_log_select_editorial
  ON activity_log FOR SELECT
  TO authenticated
  USING (has_role('admin') OR has_role('editor'));

-- Any authenticated user can insert activity entries (so actions get logged)
DROP POLICY IF EXISTS activity_log_insert_authenticated ON activity_log;
CREATE POLICY activity_log_insert_authenticated
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
