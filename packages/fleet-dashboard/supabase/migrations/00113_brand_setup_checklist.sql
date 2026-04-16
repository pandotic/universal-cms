-- ─── Brand Setup Checklist ───────────────────────────────────────────────────
-- Tracks one-time setup tasks per brand (claiming profiles, creating accounts, etc.)
-- Separate from recurring agent work — these are "have you done this once?" items.
-- Created: Marketing Ops Module — Chunk 1

CREATE TABLE hub_brand_setup_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,

  category TEXT NOT NULL CHECK (category IN (
    'social_profiles', 'directories', 'review_sites', 'email_platform',
    'analytics', 'legal', 'brand_identity', 'press_kit', 'other'
  )),
  task_name TEXT NOT NULL,
  platform TEXT,
  tier TEXT CHECK (tier IN ('tier_1', 'tier_2', 'tier_3')),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'skipped', 'blocked'
  )),
  execution_mode TEXT CHECK (execution_mode IN (
    'automated', 'semi_automated', 'manual'
  )),

  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  result_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_brand_setup_checklist_property_category
  ON hub_brand_setup_checklist(property_id, category);
CREATE INDEX idx_hub_brand_setup_checklist_property_status
  ON hub_brand_setup_checklist(property_id, status);

-- RLS
ALTER TABLE hub_brand_setup_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY setup_checklist_select_authenticated ON hub_brand_setup_checklist
  FOR SELECT TO authenticated USING (true);

CREATE POLICY setup_checklist_insert_admin ON hub_brand_setup_checklist
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY setup_checklist_update_admin ON hub_brand_setup_checklist
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

CREATE POLICY setup_checklist_delete_admin ON hub_brand_setup_checklist
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_hub_brand_setup_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_brand_setup_checklist_updated_at_trigger
  BEFORE UPDATE ON hub_brand_setup_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_brand_setup_checklist_updated_at();
