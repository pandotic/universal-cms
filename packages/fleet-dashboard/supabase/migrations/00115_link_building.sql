-- ─── Link Building ───────────────────────────────────────────────────────────
-- Link opportunity catalog, per-property submissions, and Featured.com tracking.
-- Created: Marketing Ops Module — Chunk 1

-- ─── Link Opportunities (shared catalog) ────────────────────────────────────

CREATE TABLE hub_link_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  industry TEXT[],
  domain_authority INTEGER,
  priority TEXT CHECK (priority IN ('tier_1', 'tier_2', 'tier_3')),
  submission_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_link_opportunities_category ON hub_link_opportunities(category);
CREATE INDEX idx_hub_link_opportunities_priority ON hub_link_opportunities(priority);

-- ─── Link Submissions (per-property) ────────────────────────────────────────

CREATE TABLE hub_link_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES hub_link_opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'submitted', 'pending', 'verified', 'live', 'rejected', 'failed'
  )),
  submitted_url TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  is_live BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_link_submissions_property ON hub_link_submissions(property_id);
CREATE INDEX idx_hub_link_submissions_opportunity ON hub_link_submissions(opportunity_id);
CREATE INDEX idx_hub_link_submissions_status ON hub_link_submissions(status);

-- ─── Featured.com Outbound Pitches ──────────────────────────────────────────

CREATE TABLE hub_featured_outbound_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES hub_properties(id) ON DELETE CASCADE,
  question TEXT,
  answer TEXT,
  publication TEXT,
  status TEXT,
  pitched_at TIMESTAMPTZ,
  published_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_featured_outbound_property ON hub_featured_outbound_pitches(property_id);

-- ─── Featured.com Inbound Submissions ───────────────────────────────────────

CREATE TABLE hub_featured_inbound_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES hub_properties(id) ON DELETE CASCADE,
  contributor_email TEXT,
  pitch_summary TEXT,
  status TEXT,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_featured_inbound_property ON hub_featured_inbound_submissions(property_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE hub_link_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_link_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_featured_outbound_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_featured_inbound_submissions ENABLE ROW LEVEL SECURITY;

-- Opportunities: authenticated read, admin write
CREATE POLICY link_opps_select ON hub_link_opportunities
  FOR SELECT TO authenticated USING (true);
CREATE POLICY link_opps_insert ON hub_link_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));
CREATE POLICY link_opps_update ON hub_link_opportunities
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));
CREATE POLICY link_opps_delete ON hub_link_opportunities
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

-- Submissions: authenticated read, admin write
CREATE POLICY link_subs_select ON hub_link_submissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY link_subs_insert ON hub_link_submissions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));
CREATE POLICY link_subs_update ON hub_link_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));
CREATE POLICY link_subs_delete ON hub_link_submissions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

-- Featured outbound: authenticated read, admin write
CREATE POLICY featured_out_select ON hub_featured_outbound_pitches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY featured_out_insert ON hub_featured_outbound_pitches
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));
CREATE POLICY featured_out_update ON hub_featured_outbound_pitches
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

-- Featured inbound: authenticated read, admin write
CREATE POLICY featured_in_select ON hub_featured_inbound_submissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY featured_in_insert ON hub_featured_inbound_submissions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));
CREATE POLICY featured_in_update ON hub_featured_inbound_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_hub_link_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_link_submissions_updated_at_trigger
  BEFORE UPDATE ON hub_link_submissions
  FOR EACH ROW EXECUTE FUNCTION update_hub_link_submissions_updated_at();

CREATE OR REPLACE FUNCTION update_hub_featured_outbound_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_featured_outbound_updated_at_trigger
  BEFORE UPDATE ON hub_featured_outbound_pitches
  FOR EACH ROW EXECUTE FUNCTION update_hub_featured_outbound_updated_at();

CREATE OR REPLACE FUNCTION update_hub_featured_inbound_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_featured_inbound_updated_at_trigger
  BEFORE UPDATE ON hub_featured_inbound_submissions
  FOR EACH ROW EXECUTE FUNCTION update_hub_featured_inbound_updated_at();
