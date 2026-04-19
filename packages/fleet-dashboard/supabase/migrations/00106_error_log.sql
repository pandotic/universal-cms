-- Hub error log — captures runtime, API, UI and build errors for triage
-- Idempotent: safe to re-apply.

CREATE TABLE IF NOT EXISTS error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  stack text,
  url text,
  component text,
  severity text NOT NULL DEFAULT 'error'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category text NOT NULL DEFAULT 'runtime'
    CHECK (category IN ('runtime', 'api', 'ui', 'build')),
  fingerprint text,
  count integer NOT NULL DEFAULT 1,
  user_agent text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_log_fingerprint ON error_log(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_log_severity ON error_log(severity);
CREATE INDEX IF NOT EXISTS idx_error_log_category ON error_log(category);
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_log_updated_at ON error_log(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_log_unresolved
  ON error_log(updated_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;

-- Anyone can insert error reports (the ingest endpoint uses the service role
-- client so this mainly matters if you later wire anon client inserts).
DROP POLICY IF EXISTS error_log_insert ON error_log;
CREATE POLICY error_log_insert ON error_log
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Authenticated hub users can read and manage errors. Fine-grained role
-- checks are enforced at the API route layer.
DROP POLICY IF EXISTS error_log_read ON error_log;
CREATE POLICY error_log_read ON error_log
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS error_log_update ON error_log;
CREATE POLICY error_log_update ON error_log
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS error_log_delete ON error_log;
CREATE POLICY error_log_delete ON error_log
  FOR DELETE TO authenticated
  USING (true);
