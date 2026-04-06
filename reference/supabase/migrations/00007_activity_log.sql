-- Activity Log: audit trail for CMS actions

-- =============================================================================
-- Enums
-- =============================================================================
CREATE TYPE activity_action AS ENUM (
  'create', 'update', 'delete', 'publish', 'archive', 'login', 'bulk_import'
);

-- =============================================================================
-- activity_log
-- =============================================================================
CREATE TABLE activity_log (
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
CREATE INDEX idx_activity_log_entity_type ON activity_log (entity_type);
CREATE INDEX idx_activity_log_created_at ON activity_log (created_at DESC);
CREATE INDEX idx_activity_log_user_id ON activity_log (user_id);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Admins and editors can read activity logs
CREATE POLICY activity_log_select_editorial
  ON activity_log FOR SELECT
  TO authenticated
  USING (has_role('admin') OR has_role('editor'));

-- Any authenticated user can insert activity entries (so actions get logged)
CREATE POLICY activity_log_insert_authenticated
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
