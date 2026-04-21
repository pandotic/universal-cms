-- Company Vendor Profiles: universal product/service data for directory entities.
-- One-to-one extension of companies table.
-- Fields match EntityProfile from src/lib/types/entity.ts.

CREATE TABLE company_vendor_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,

  -- Products & Services (structured JSONB: [{name, description, category}])
  products                  JSONB DEFAULT '[]'::jsonb,

  -- What they do
  use_cases                 TEXT[] DEFAULT '{}',
  strengths                 TEXT[] DEFAULT '{}',
  best_for                  TEXT,

  -- Who it's for
  target_market_segments    TEXT[] DEFAULT '{}',
  target_market_company_size TEXT,
  industries                TEXT[] DEFAULT '{}',
  regions                   TEXT[] DEFAULT '{}',

  -- How it works
  pricing_model             TEXT,
  deployment                TEXT[] DEFAULT '{}',
  integrations              TEXT[] DEFAULT '{}',

  -- Credibility
  certifications            TEXT[] DEFAULT '{}',
  notable_clients           TEXT[] DEFAULT '{}',
  partnerships              TEXT[] DEFAULT '{}',

  -- Business info
  funding_stage             TEXT,
  parent_org                TEXT,

  -- Standards / regulators
  governance_scope          TEXT,
  covered_topics            TEXT[] DEFAULT '{}',
  adoption_stats            TEXT,
  compliance_timeline       JSONB DEFAULT '[]'::jsonb,

  -- Competitive context
  alternatives              TEXT[] DEFAULT '{}',

  -- Metadata
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_vendor_profiles_updated_at
  BEFORE UPDATE ON company_vendor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_vendor_profiles_company ON company_vendor_profiles (company_id);

-- =============================================================================
-- RLS (matches company_esg_profiles pattern from 00030)
-- =============================================================================
ALTER TABLE company_vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY vendor_profiles_select_public
  ON company_vendor_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin-only mutations
CREATE POLICY vendor_profiles_insert_admin
  ON company_vendor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY vendor_profiles_update_admin
  ON company_vendor_profiles FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY vendor_profiles_delete_admin
  ON company_vendor_profiles FOR DELETE
  TO authenticated
  USING (has_role('admin'));
