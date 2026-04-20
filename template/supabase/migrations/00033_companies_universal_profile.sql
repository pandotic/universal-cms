-- Universal Company Profile: extend companies table + add child tables
-- Builds on 00026_business_entities.sql to create the canonical company record
-- that unifies ESG Directory entities and Business for Better organizations.

-- =============================================================================
-- Extend companies table with universal profile columns
-- =============================================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS long_description TEXT,
  ADD COLUMN IF NOT EXISTS headquarters TEXT,
  ADD COLUMN IF NOT EXISTS founded INTEGER,
  ADD COLUMN IF NOT EXISTS employee_range TEXT,
  ADD COLUMN IF NOT EXISTS company_type TEXT NOT NULL DEFAULT 'organization',
  ADD COLUMN IF NOT EXISTS ownership TEXT,
  ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS esg_entity_slug TEXT,
  ADD COLUMN IF NOT EXISTS bfb_org_slug TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Backfill slug from domain or name for existing rows
UPDATE companies
  SET slug = COALESCE(
    domain,
    lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
  )
  WHERE slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies (slug);
CREATE INDEX IF NOT EXISTS idx_companies_source_system ON companies (source_system);
CREATE INDEX IF NOT EXISTS idx_companies_esg_entity_slug ON companies (esg_entity_slug);
CREATE INDEX IF NOT EXISTS idx_companies_bfb_org_slug ON companies (bfb_org_slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies (status);
CREATE INDEX IF NOT EXISTS idx_companies_company_type ON companies (company_type);

-- =============================================================================
-- company_links (social profiles, blog, RSS, etc.)
-- =============================================================================
CREATE TABLE company_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  confidence REAL DEFAULT 1.0,
  verified BOOLEAN DEFAULT false,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_links_company ON company_links (company_id);
CREATE INDEX idx_company_links_type ON company_links (link_type);

-- =============================================================================
-- company_documents (methodology PDFs, annual reports, etc.)
-- =============================================================================
CREATE TABLE company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  confidence REAL DEFAULT 1.0,
  verified BOOLEAN DEFAULT false,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_documents_company ON company_documents (company_id);
CREATE INDEX idx_company_documents_type ON company_documents (doc_type);

-- =============================================================================
-- company_evidence (per-field provenance tracking)
-- =============================================================================
CREATE TABLE company_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  source_url TEXT,
  source_type TEXT,
  confidence REAL DEFAULT 1.0,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_evidence_company ON company_evidence (company_id);
CREATE INDEX idx_company_evidence_field ON company_evidence (field_name);

-- =============================================================================
-- RLS: company_links
-- =============================================================================
ALTER TABLE company_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_links_select_public
  ON company_links FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY company_links_insert_admin
  ON company_links FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY company_links_update_admin
  ON company_links FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY company_links_delete_admin
  ON company_links FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- =============================================================================
-- RLS: company_documents
-- =============================================================================
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_documents_select_public
  ON company_documents FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY company_documents_insert_admin
  ON company_documents FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY company_documents_update_admin
  ON company_documents FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY company_documents_delete_admin
  ON company_documents FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- =============================================================================
-- RLS: company_evidence
-- =============================================================================
ALTER TABLE company_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_evidence_select_public
  ON company_evidence FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY company_evidence_insert_admin
  ON company_evidence FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY company_evidence_update_admin
  ON company_evidence FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY company_evidence_delete_admin
  ON company_evidence FOR DELETE
  TO authenticated
  USING (has_role('admin'));
