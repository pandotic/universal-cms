-- ─── Brand Voice Extensions + Brand Assets ──────────────────────────────────
-- Extends hub_brand_voice_briefs with voice modeling and visual identity.
-- Creates hub_brand_assets for derivative brand assets per property.
-- Created: Marketing Ops Module — Chunk 1

-- ─── Part A: Brand Voice Brief Extensions ───────────────────────────────────

-- Voice modeling
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS voice_attributes TEXT[] DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS tone_variations JSONB DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS vocabulary JSONB DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS sentence_patterns JSONB DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS anti_examples JSONB DEFAULT '[]';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS humor_guidelines TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS corrections_journal JSONB DEFAULT '[]';

-- Visual identity
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS font_family TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS photo_style_guide TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS photo_mood_keywords TEXT[];
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS use_ai_generation BOOLEAN DEFAULT false;

-- ─── Part B: Brand Assets Table ─────────────────────────────────────────────

CREATE TABLE hub_brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,

  -- Descriptions at multiple lengths
  description_25 TEXT,
  description_50 TEXT,
  description_100 TEXT,
  description_250 TEXT,
  description_500 TEXT,

  -- Per-platform social bios
  bio_twitter TEXT,
  bio_linkedin TEXT,
  bio_instagram TEXT,
  bio_facebook TEXT,

  -- Categorization
  category_primary TEXT,
  categories_secondary TEXT[],
  keywords TEXT[],

  -- Press & PR
  press_boilerplate TEXT,

  -- Visual assets
  hashtags JSONB DEFAULT '{}',
  logo_urls JSONB DEFAULT '{}',

  -- NAP (Name, Address, Phone) for local SEO
  nap_name TEXT,
  nap_address TEXT,
  nap_phone TEXT,
  nap_email TEXT,

  -- Structured data
  schema_jsonld JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(property_id)
);

-- RLS
ALTER TABLE hub_brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_assets_select_authenticated ON hub_brand_assets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY brand_assets_insert_admin ON hub_brand_assets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY brand_assets_update_admin ON hub_brand_assets
  FOR UPDATE TO authenticated
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

CREATE POLICY brand_assets_delete_admin ON hub_brand_assets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_hub_brand_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_brand_assets_updated_at_trigger
  BEFORE UPDATE ON hub_brand_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_brand_assets_updated_at();
