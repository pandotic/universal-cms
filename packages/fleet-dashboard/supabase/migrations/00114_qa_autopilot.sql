-- ─── QA Reviews + Auto-Pilot Settings ────────────────────────────────────────
-- Content QA reviews with confidence scoring, auto-pilot thresholds per brand,
-- and a learning log for human override feedback.
-- Created: Marketing Ops Module — Chunk 1

-- ─── Content QA Reviews ─────────────────────────────────────────────────────

CREATE TABLE hub_content_qa_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_table TEXT NOT NULL,
  reviewer_agent TEXT NOT NULL,
  overall_confidence NUMERIC,
  status TEXT CHECK (status IN ('passed', 'flagged', 'failed')),
  checks JSONB,
  suggested_fixes TEXT[],
  human_override BOOLEAN DEFAULT false,
  override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_content_qa_reviews_content
  ON hub_content_qa_reviews(content_id, content_table);
CREATE INDEX idx_hub_content_qa_reviews_status
  ON hub_content_qa_reviews(status);

-- ─── Auto-Pilot Settings ────────────────────────────────────────────────────

CREATE TABLE hub_auto_pilot_settings (
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  auto_pilot_enabled BOOLEAN DEFAULT false,
  confidence_threshold NUMERIC DEFAULT 0.85,
  trust_score NUMERIC DEFAULT 0,
  max_per_day INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (property_id, content_type)
);

-- ─── QA Learning Log ────────────────────────────────────────────────────────

CREATE TABLE hub_qa_learning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES hub_properties(id) ON DELETE CASCADE,
  check_type TEXT,
  outcome TEXT CHECK (outcome IN (
    'human_agreed', 'human_overrode', 'false_positive', 'false_negative'
  )),
  human_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_qa_learning_log_property
  ON hub_qa_learning_log(property_id);
CREATE INDEX idx_hub_qa_learning_log_created_at
  ON hub_qa_learning_log(created_at);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE hub_content_qa_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_auto_pilot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_qa_learning_log ENABLE ROW LEVEL SECURITY;

-- All three: authenticated read, admin write
CREATE POLICY qa_reviews_select ON hub_content_qa_reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY qa_reviews_insert ON hub_content_qa_reviews
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));
CREATE POLICY qa_reviews_update ON hub_content_qa_reviews
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

CREATE POLICY autopilot_select ON hub_auto_pilot_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY autopilot_insert ON hub_auto_pilot_settings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));
CREATE POLICY autopilot_update ON hub_auto_pilot_settings
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

CREATE POLICY qa_learning_select ON hub_qa_learning_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY qa_learning_insert ON hub_qa_learning_log
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

-- Auto-update timestamp for auto_pilot_settings
CREATE OR REPLACE FUNCTION update_hub_auto_pilot_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_auto_pilot_settings_updated_at_trigger
  BEFORE UPDATE ON hub_auto_pilot_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_auto_pilot_settings_updated_at();
