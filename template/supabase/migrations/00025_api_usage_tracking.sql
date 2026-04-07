-- API Usage Tracking
-- Records every outbound API call for cost tracking and auditing

CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT 'POST',
  status_code INTEGER NOT NULL DEFAULT 200,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd NUMERIC(12, 6),
  latency_ms INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for date range + provider queries (the primary access pattern)
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON api_usage (provider, created_at DESC);

-- API Keys Registry
-- Tracks which API keys are in use, where, and their budgets

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  key_name TEXT NOT NULL,
  key_hint TEXT NOT NULL DEFAULT '',
  environment TEXT NOT NULL DEFAULT 'production',
  project_name TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  monthly_budget_usd NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys (provider);

-- API Audit / Reconciliation
-- Compare self-reported costs against vendor invoices

CREATE TABLE IF NOT EXISTS api_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  self_reported_cost_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  vendor_invoice_cost_usd NUMERIC(12, 2),
  discrepancy_usd NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_audit_provider ON api_audit (provider, period_start DESC);

-- RLS: Only admins can read/write these tables
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_audit ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by the app backend)
CREATE POLICY "Service role full access on api_usage" ON api_usage
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on api_keys" ON api_keys
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on api_audit" ON api_audit
  FOR ALL USING (auth.role() = 'service_role');

-- Admins can read via authenticated role
CREATE POLICY "Admin read api_usage" ON api_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
  );
CREATE POLICY "Admin read api_keys" ON api_keys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
  );
CREATE POLICY "Admin manage api_audit" ON api_audit
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin'))
  );
