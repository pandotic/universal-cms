-- media_meta: an overlay table for image metadata (alt text, caption) on
-- images that don't live in the content_media uploads table.
--
-- The media library scanner surfaces images from many sources:
--   - upload               -> content_media row (editable natively)
--   - content_page_og      -> content_pages.og_image
--   - content_page_body    -> inline <img> inside content_pages.body
--   - static               -> files in /public/images/**
--   - entity_logo          -> src/data/entities.json (logo)
--   - entity_screenshot    -> src/data/entities.json (screenshot)
--   - youtube              -> ch_resources / ch_providers
--
-- For non-upload sources, metadata changes in the CMS are written here as
-- an overlay; readers consult the overlay first, then fall back to the
-- source. This keeps JSON-as-code the source of truth for image URLs but
-- makes alt text / captions CMS-editable without requiring a redeploy.

CREATE TABLE IF NOT EXISTS media_meta (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN (
    'upload',
    'content_page_og',
    'content_page_body',
    'static',
    'entity_logo',
    'entity_screenshot',
    'youtube'
  )),
  -- A stable reference to the source: content_media.id, content_pages.slug,
  -- entity slug, or a relative static path. Composite uniqueness is
  -- (source_type, source_ref, url).
  source_ref  TEXT NOT NULL,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  caption     TEXT,
  updated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_ref, url)
);

CREATE INDEX IF NOT EXISTS idx_media_meta_source ON media_meta (source_type, source_ref);
CREATE INDEX IF NOT EXISTS idx_media_meta_url ON media_meta (url);

CREATE TRIGGER trg_media_meta_updated_at
  BEFORE UPDATE ON media_meta
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS — public read (so site renderers can resolve alt text without auth),
-- editorial write (admin + editor roles).
-- =============================================================================
ALTER TABLE media_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_meta_select_public
  ON media_meta FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY media_meta_insert_editorial
  ON media_meta FOR INSERT
  TO authenticated
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY media_meta_update_editorial
  ON media_meta FOR UPDATE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'))
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY media_meta_delete_editorial
  ON media_meta FOR DELETE
  TO authenticated
  USING (has_role('admin'));
