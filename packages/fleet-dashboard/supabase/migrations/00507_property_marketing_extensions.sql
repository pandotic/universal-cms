-- ─── Property Marketing Extensions ──────────────────────────────────────────
-- Extends hub_properties with marketing categorization, operational flags,
-- and denormalized counts for dashboard performance.
-- Created: Marketing Ops Module — Chunk 1

-- Marketing categorization
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS relationship_type TEXT
  CHECK (relationship_type IN (
    'gbi_personal', 'pandotic_studio', 'pandotic_studio_product',
    'pandotic_client', 'standalone', 'local_service'
  ));

ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS parent_property_id UUID
  REFERENCES hub_properties(id) ON DELETE SET NULL;

ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS site_profile TEXT
  CHECK (site_profile IN (
    'marketing_only', 'marketing_and_cms', 'app_only', 'local_service'
  ));

-- Marketing operational flags
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS auto_pilot_enabled BOOLEAN DEFAULT false;
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS kill_switch BOOLEAN DEFAULT false;
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS analytics_provider TEXT;
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS analytics_site_id TEXT;

-- Denormalized counts for dashboard speed
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS content_pending_review_count INTEGER DEFAULT 0;
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS agent_errors_24h_count INTEGER DEFAULT 0;

-- Index for parent→child property lookups
CREATE INDEX IF NOT EXISTS idx_hub_properties_parent_property_id
  ON hub_properties(parent_property_id) WHERE parent_property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hub_properties_relationship_type
  ON hub_properties(relationship_type) WHERE relationship_type IS NOT NULL;
