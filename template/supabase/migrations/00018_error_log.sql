-- Error log — captures runtime, API, UI and build errors for triage
-- Idempotent: safe to re-apply.

CREATE TABLE IF NOT EXISTS error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  component TEXT,
  severity TEXT NOT NULL DEFAULT 'error'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category TEXT NOT NULL DEFAULT 'runtime'
    CHECK (category IN ('runtime', 'api', 'ui', 'build')),
  fingerprint TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  user_agent TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_log_fingerprint ON error_log(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_log_severity ON error_log(severity);
CREATE INDEX IF NOT EXISTS idx_error_log_category ON error_log(category);
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_log_updated_at ON error_log(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_log_unresolved
  ON error_log(updated_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;

-- Public can insert (for client-side errors) but not read
DROP POLICY IF EXISTS error_log_insert ON error_log;
CREATE POLICY error_log_insert ON error_log FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admins can read, update, delete
DROP POLICY IF EXISTS error_log_admin ON error_log;
CREATE POLICY error_log_admin ON error_log FOR ALL TO authenticated USING (has_role('admin')) WITH CHECK (has_role('admin'));
