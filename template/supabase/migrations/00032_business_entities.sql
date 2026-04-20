-- Business Entities: companies + user_companies
-- Allows users to associate with a company during onboarding or assessment.
-- Multiple users from the same organization share a single company record.

-- =============================================================================
-- companies
-- =============================================================================
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  domain      TEXT UNIQUE,                -- e.g. "microsoft.com" — used for dedup & enrichment
  industry    TEXT,
  sector      TEXT,                       -- ESG-relevant: "Energy", "Finance", etc.
  size_range  TEXT,                       -- "1-10" | "11-50" | "51-200" | "201-1000" | "1001-5000" | "5000+"
  country     TEXT,
  city        TEXT,
  website     TEXT,
  linkedin_url TEXT,
  description TEXT,
  logo_url    TEXT,
  data_source TEXT DEFAULT 'manual',     -- "manual" | "google_places" | "opencorporates" | "gleif" | "linkedin"
  verified    BOOLEAN DEFAULT false,     -- admin-verified flag
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_companies_name ON companies USING gin (name gin_trgm_ops);
CREATE INDEX idx_companies_domain ON companies (domain);

-- =============================================================================
-- user_companies (many-to-many: users ↔ companies)
-- =============================================================================
CREATE TABLE user_companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies ON DELETE CASCADE,
  role        TEXT DEFAULT 'member',     -- "owner" | "admin" | "member"
  is_primary  BOOLEAN DEFAULT true,      -- user's main org (for default selection)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_user_companies_user ON user_companies (user_id);
CREATE INDEX idx_user_companies_company ON user_companies (company_id);

-- =============================================================================
-- RLS: companies
-- =============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Anyone can read companies (for typeahead/search)
CREATE POLICY companies_select_anon
  ON companies FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert (creating a company during onboarding)
CREATE POLICY companies_insert_authenticated
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can update/delete
CREATE POLICY companies_update_admin
  ON companies FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY companies_delete_admin
  ON companies FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- =============================================================================
-- RLS: user_companies
-- =============================================================================
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Users can see their own company links; admins see all
CREATE POLICY user_companies_select
  ON user_companies FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role('admin'));

-- Users can link themselves to a company
CREATE POLICY user_companies_insert_self
  ON user_companies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own links; admins can update any
CREATE POLICY user_companies_update
  ON user_companies FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR has_role('admin'))
  WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- Users can remove their own links; admins can remove any
CREATE POLICY user_companies_delete
  ON user_companies FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR has_role('admin'));
