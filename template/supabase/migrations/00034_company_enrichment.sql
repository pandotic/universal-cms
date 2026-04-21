-- Company Enrichment Pipeline: tracks enrichment runs with proposed/approved changes.
-- Supports semi-automated research with human review per field.

-- =============================================================================
-- company_enrichment_runs
-- =============================================================================
CREATE TABLE company_enrichment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  stage TEXT,
  proposed_changes JSONB,
  approved_changes JSONB,
  triggered_by UUID,
  reviewed_by UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_enrichment_runs_company ON company_enrichment_runs (company_id);
CREATE INDEX idx_enrichment_runs_status ON company_enrichment_runs (status);

-- =============================================================================
-- RLS: company_enrichment_runs
-- =============================================================================
ALTER TABLE company_enrichment_runs ENABLE ROW LEVEL SECURITY;

-- Admins can see all enrichment runs
CREATE POLICY enrichment_runs_select_admin
  ON company_enrichment_runs FOR SELECT
  TO authenticated
  USING (has_role('admin'));

CREATE POLICY enrichment_runs_insert_admin
  ON company_enrichment_runs FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

CREATE POLICY enrichment_runs_update_admin
  ON company_enrichment_runs FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

CREATE POLICY enrichment_runs_delete_admin
  ON company_enrichment_runs FOR DELETE
  TO authenticated
  USING (has_role('admin'));
