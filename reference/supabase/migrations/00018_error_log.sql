CREATE TABLE IF NOT EXISTS error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  component TEXT,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category TEXT NOT NULL DEFAULT 'runtime' CHECK (category IN ('runtime', 'api', 'ui', 'build')),
  fingerprint TEXT,  -- hash of message for grouping duplicates
  count INTEGER NOT NULL DEFAULT 1,
  user_agent TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_log_fingerprint ON error_log(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_log_severity ON error_log(severity);
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_log_resolved ON error_log(resolved_at) WHERE resolved_at IS NULL;

ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;
-- Public can insert (for client-side errors) but not read
CREATE POLICY error_log_insert ON error_log FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Admins can read, update, delete
CREATE POLICY error_log_admin ON error_log FOR ALL TO authenticated USING (has_role('admin')) WITH CHECK (has_role('admin'));
