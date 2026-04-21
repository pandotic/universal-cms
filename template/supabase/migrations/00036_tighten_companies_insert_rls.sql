-- Tighten the companies INSERT RLS policy.
-- Originally any authenticated user could insert (for onboarding). Now that
-- companies are the canonical directory records, restrict inserts to admins.
-- Onboarding flows should use the service-role key (via admin API) instead.

DROP POLICY IF EXISTS companies_insert_authenticated ON companies;

CREATE POLICY companies_insert_admin
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));
