-- Core taxonomy tables: entities, frameworks, glossary, categories
-- Migrates static JSON data into Supabase for CMS-driven content

-- ── Entities ──
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vendor','organization','regulator','standard-body')),
  description TEXT NOT NULL DEFAULT '',
  long_description TEXT,
  logo TEXT,
  screenshot TEXT,
  website TEXT NOT NULL DEFAULT '',
  headquarters TEXT,
  founded INTEGER,
  employee_range TEXT,
  category_ids TEXT[] DEFAULT '{}',
  framework_ids TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  tier TEXT CHECK (tier IN ('major','mid','emerging')),
  seo JSONB,
  profile JSONB,
  status TEXT DEFAULT 'published' CHECK (status IN ('published','draft','archived')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Frameworks ──
CREATE TABLE IF NOT EXISTS frameworks (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  acronym TEXT NOT NULL DEFAULT '',
  governing_body TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('standard','framework','protocol','regulation','taxonomy')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','superseded','draft')),
  region TEXT NOT NULL DEFAULT '',
  year INTEGER,
  description TEXT NOT NULL DEFAULT '',
  long_description TEXT NOT NULL DEFAULT '',
  key_features TEXT[] DEFAULT '{}',
  applicability TEXT,
  related_framework_ids TEXT[] DEFAULT '{}',
  website TEXT NOT NULL DEFAULT '',
  seo JSONB,
  faqs JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Glossary Terms ──
CREATE TABLE IF NOT EXISTS glossary_terms (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  term TEXT NOT NULL,
  acronym TEXT,
  aliases TEXT[] DEFAULT '{}',
  definition TEXT NOT NULL DEFAULT '',
  long_definition TEXT,
  related_term_ids TEXT[] DEFAULT '{}',
  category_ids TEXT[] DEFAULT '{}',
  framework_ids TEXT[] DEFAULT '{}',
  seo JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Categories ──
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL DEFAULT '',
  layer TEXT NOT NULL CHECK (layer IN ('rules-standards','data-measurement','implementation-services')),
  description TEXT NOT NULL DEFAULT '',
  long_description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'circle',
  entity_count INTEGER DEFAULT 0,
  seo JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Category Content (rich editorial per category) ──
CREATE TABLE IF NOT EXISTS category_content (
  category_id TEXT PRIMARY KEY REFERENCES categories(id) ON DELETE CASCADE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Junction: Entity ↔ Category ──
CREATE TABLE IF NOT EXISTS entity_categories (
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'primary' CHECK (role IN ('primary','secondary')),
  PRIMARY KEY (entity_id, category_id)
);

-- ── Junction: Entity ↔ Framework ──
CREATE TABLE IF NOT EXISTS entity_frameworks (
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  framework_id TEXT NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'supports' CHECK (relationship IN ('supports','governs','aligns-with','reports-to')),
  PRIMARY KEY (entity_id, framework_id)
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_featured ON entities(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_tags ON entities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_entities_category_ids ON entities USING GIN(category_ids);
CREATE INDEX IF NOT EXISTS idx_frameworks_type ON frameworks(type);
CREATE INDEX IF NOT EXISTS idx_frameworks_region ON frameworks(region);
CREATE INDEX IF NOT EXISTS idx_glossary_category_ids ON glossary_terms USING GIN(category_ids);
CREATE INDEX IF NOT EXISTS idx_glossary_framework_ids ON glossary_terms USING GIN(framework_ids);
CREATE INDEX IF NOT EXISTS idx_categories_layer ON categories(layer);

-- ── updated_at triggers ──
-- Reuse update_updated_at() if it exists from earlier migrations, otherwise create it
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER frameworks_updated_at BEFORE UPDATE ON frameworks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER glossary_terms_updated_at BEFORE UPDATE ON glossary_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER category_content_updated_at BEFORE UPDATE ON category_content FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS Policies ──
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_frameworks ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY entities_public_read ON entities FOR SELECT USING (status = 'published');
CREATE POLICY frameworks_public_read ON frameworks FOR SELECT USING (true);
CREATE POLICY glossary_public_read ON glossary_terms FOR SELECT USING (true);
CREATE POLICY categories_public_read ON categories FOR SELECT USING (true);
CREATE POLICY category_content_public_read ON category_content FOR SELECT USING (true);
CREATE POLICY entity_categories_public_read ON entity_categories FOR SELECT USING (true);
CREATE POLICY entity_frameworks_public_read ON entity_frameworks FOR SELECT USING (true);

-- Admin full access (uses has_role function from migration 00003)
CREATE POLICY entities_admin_all ON entities FOR ALL USING (has_role('admin'));
CREATE POLICY frameworks_admin_all ON frameworks FOR ALL USING (has_role('admin'));
CREATE POLICY glossary_admin_all ON glossary_terms FOR ALL USING (has_role('admin'));
CREATE POLICY categories_admin_all ON categories FOR ALL USING (has_role('admin'));
CREATE POLICY category_content_admin_all ON category_content FOR ALL USING (has_role('admin'));
CREATE POLICY entity_categories_admin_all ON entity_categories FOR ALL USING (has_role('admin'));
CREATE POLICY entity_frameworks_admin_all ON entity_frameworks FOR ALL USING (has_role('admin'));
