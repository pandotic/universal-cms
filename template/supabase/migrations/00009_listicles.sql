-- Listicles: ranked/curated lists with items

-- =============================================================================
-- Enums
-- =============================================================================
CREATE TYPE listicle_status AS ENUM ('draft', 'published', 'archived');

-- =============================================================================
-- listicles
-- =============================================================================
CREATE TABLE listicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  description     TEXT,
  status          listicle_status NOT NULL DEFAULT 'draft',
  seo_title       TEXT,
  seo_description TEXT,
  og_image        TEXT,
  author_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_listicles_updated_at
  BEFORE UPDATE ON listicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- listicle_items
-- =============================================================================
CREATE TABLE listicle_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listicle_id        UUID NOT NULL REFERENCES listicles(id) ON DELETE CASCADE,
  entity_id          TEXT,
  position           INTEGER NOT NULL DEFAULT 0,
  label              TEXT,
  custom_title       TEXT,
  custom_description TEXT,
  custom_image       TEXT,
  pros               JSONB NOT NULL DEFAULT '[]',
  cons               JSONB NOT NULL DEFAULT '[]',
  affiliate_url      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_listicle_items_updated_at
  BEFORE UPDATE ON listicle_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_listicles_slug ON listicles (slug);
CREATE INDEX idx_listicles_status ON listicles (status);
CREATE INDEX idx_listicle_items_listicle_id ON listicle_items (listicle_id);
CREATE INDEX idx_listicle_items_position ON listicle_items (listicle_id, position);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE listicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listicle_items ENABLE ROW LEVEL SECURITY;

-- Published listicles readable by all
CREATE POLICY listicles_select_published
  ON listicles FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Editors/admins can see all listicles
CREATE POLICY listicles_select_editorial
  ON listicles FOR SELECT
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

CREATE POLICY listicles_insert_editorial
  ON listicles FOR INSERT
  TO authenticated
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY listicles_update_editorial
  ON listicles FOR UPDATE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'))
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY listicles_delete_editorial
  ON listicles FOR DELETE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

-- Items of published listicles readable by all
CREATE POLICY listicle_items_select_published
  ON listicle_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listicles
      WHERE listicles.id = listicle_items.listicle_id
        AND listicles.status = 'published'
    )
  );

-- Editors/admins can see all items
CREATE POLICY listicle_items_select_editorial
  ON listicle_items FOR SELECT
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));

CREATE POLICY listicle_items_insert_editorial
  ON listicle_items FOR INSERT
  TO authenticated
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY listicle_items_update_editorial
  ON listicle_items FOR UPDATE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'))
  WITH CHECK (has_role('editor') OR has_role('admin'));

CREATE POLICY listicle_items_delete_editorial
  ON listicle_items FOR DELETE
  TO authenticated
  USING (has_role('editor') OR has_role('admin'));
