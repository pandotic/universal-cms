-- Media Library: uploaded files metadata

-- =============================================================================
-- content_media
-- =============================================================================
CREATE TABLE IF NOT EXISTS content_media (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename     TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type    TEXT,
  size_bytes   BIGINT,
  alt_text     TEXT,
  caption      TEXT,
  uploaded_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_content_media_uploaded_by ON content_media (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_content_media_created_at ON content_media (created_at DESC);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE content_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_media_select_authenticated ON content_media;
CREATE POLICY content_media_select_authenticated
  ON content_media FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS content_media_insert_editorial ON content_media;
CREATE POLICY content_media_insert_editorial
  ON content_media FOR INSERT
  TO authenticated
  WITH CHECK (has_role('editor') OR has_role('admin'));

DROP POLICY IF EXISTS content_media_update_editorial ON content_media;
CREATE POLICY content_media_update_editorial
  ON content_media FOR UPDATE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'))
  WITH CHECK (has_role('editor') OR has_role('admin'));

DROP POLICY IF EXISTS content_media_delete_editorial ON content_media;
CREATE POLICY content_media_delete_editorial
  ON content_media FOR DELETE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));
