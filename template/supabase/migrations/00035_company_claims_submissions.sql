-- Phase 4: Company Claim Workflow + Submissions
-- Allows companies to claim their profiles via domain email verification,
-- and submit profile updates for admin review.

-- =============================================================================
-- Extend user_roles CHECK to allow company-level roles
-- =============================================================================
ALTER TABLE user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'editor', 'moderator', 'company_owner', 'company_editor'));

-- =============================================================================
-- has_company_role(): check user's role within a specific company
-- Uses user_companies table (from 00026) for company-scoped role checks
-- =============================================================================
CREATE OR REPLACE FUNCTION has_company_role(p_company_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_companies
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
      AND role = p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Broader check: does user have any role for this company?
CREATE OR REPLACE FUNCTION is_company_member(p_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_companies
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- company_claim_requests
-- =============================================================================
CREATE TABLE company_claim_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  company_email     TEXT NOT NULL,
  verification_method TEXT NOT NULL DEFAULT 'email-domain'
                    CHECK (verification_method IN ('email-domain', 'manual')),
  verification_token TEXT,
  verified_at       TIMESTAMPTZ,
  evidence_url      TEXT,
  admin_notes       TEXT,
  reviewed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_claim_requests_updated_at
  BEFORE UPDATE ON company_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_claim_requests_company ON company_claim_requests (company_id);
CREATE INDEX idx_claim_requests_user ON company_claim_requests (user_id);
CREATE INDEX idx_claim_requests_status ON company_claim_requests (status);

-- =============================================================================
-- company_submissions (profile change requests from claimed companies)
-- =============================================================================
CREATE TABLE company_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  submitted_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  submission_type TEXT NOT NULL DEFAULT 'correction'
                  CHECK (submission_type IN ('correction', 'enhancement', 'new-link', 'new-document')),
  changes         JSONB NOT NULL DEFAULT '{}',
  notes           TEXT,
  admin_notes     TEXT,
  reviewed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON company_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_submissions_company ON company_submissions (company_id);
CREATE INDEX idx_submissions_submitted_by ON company_submissions (submitted_by);
CREATE INDEX idx_submissions_status ON company_submissions (status);

-- =============================================================================
-- RLS: company_claim_requests
-- =============================================================================
ALTER TABLE company_claim_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own claims; admins see all
CREATE POLICY claim_requests_select
  ON company_claim_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role('admin'));

-- Authenticated users can submit claims
CREATE POLICY claim_requests_insert
  ON company_claim_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can update (approve/reject)
CREATE POLICY claim_requests_update_admin
  ON company_claim_requests FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

-- Only admins can delete
CREATE POLICY claim_requests_delete_admin
  ON company_claim_requests FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- =============================================================================
-- RLS: company_submissions
-- =============================================================================
ALTER TABLE company_submissions ENABLE ROW LEVEL SECURITY;

-- Users can see their own submissions; company owners/admins can see company's; admins see all
CREATE POLICY submissions_select
  ON company_submissions FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR is_company_member(company_id)
    OR has_role('admin')
  );

-- Company members can insert submissions for their company
CREATE POLICY submissions_insert
  ON company_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND is_company_member(company_id)
  );

-- Only admins can update (review)
CREATE POLICY submissions_update_admin
  ON company_submissions FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

-- Only admins can delete
CREATE POLICY submissions_delete_admin
  ON company_submissions FOR DELETE
  TO authenticated
  USING (has_role('admin'));
