-- ─── Marketing Operations Tables ─────────────────────────────────────────────
-- Press releases, influencer tracking, podcast booking, and research studies.
-- Created: Marketing Ops Module — Chunk 1

-- ─── Press Releases ─────────────────────────────────────────────────────────

CREATE TABLE hub_press_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES hub_properties(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  status TEXT,
  distributed_via TEXT,
  distributed_at TIMESTAMPTZ,
  pickup_count INTEGER DEFAULT 0,
  pickup_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_press_releases_property ON hub_press_releases(property_id);

-- ─── Influencers ────────────────────────────────────────────────────────────

CREATE TABLE hub_influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES hub_properties(id) ON DELETE CASCADE,
  name TEXT,
  handle TEXT,
  platform TEXT,
  tier TEXT CHECK (tier IN ('tier_1', 'tier_2', 'tier_3')),
  niche TEXT,
  audience_size INTEGER,
  engagement_rate NUMERIC,
  fit_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_influencers_property ON hub_influencers(property_id);
CREATE INDEX idx_hub_influencers_tier ON hub_influencers(tier);

-- ─── Influencer Interactions ────────────────────────────────────────────────

CREATE TABLE hub_influencer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID REFERENCES hub_influencers(id) ON DELETE CASCADE,
  interaction_type TEXT,
  notes TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_influencer_interactions_influencer ON hub_influencer_interactions(influencer_id);

-- ─── Podcasts ───────────────────────────────────────────────────────────────

CREATE TABLE hub_podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES hub_properties(id) ON DELETE CASCADE,
  podcast_name TEXT,
  host_name TEXT,
  niche TEXT,
  audience_size INTEGER,
  status TEXT,
  pitched_at TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ,
  episode_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_podcasts_property ON hub_podcasts(property_id);

-- ─── Research Studies ───────────────────────────────────────────────────────

CREATE TABLE hub_research_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES hub_properties(id) ON DELETE CASCADE,
  title TEXT,
  type TEXT,
  status TEXT,
  data_source TEXT,
  published_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_research_studies_property ON hub_research_studies(property_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE hub_press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_influencer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_research_studies ENABLE ROW LEVEL SECURITY;

-- All tables: authenticated read, admin write
CREATE POLICY press_releases_select ON hub_press_releases FOR SELECT TO authenticated USING (true);
CREATE POLICY press_releases_modify ON hub_press_releases FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

CREATE POLICY influencers_select ON hub_influencers FOR SELECT TO authenticated USING (true);
CREATE POLICY influencers_modify ON hub_influencers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

CREATE POLICY influencer_interactions_select ON hub_influencer_interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY influencer_interactions_modify ON hub_influencer_interactions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

CREATE POLICY podcasts_select ON hub_podcasts FOR SELECT TO authenticated USING (true);
CREATE POLICY podcasts_modify ON hub_podcasts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

CREATE POLICY research_studies_select ON hub_research_studies FOR SELECT TO authenticated USING (true);
CREATE POLICY research_studies_modify ON hub_research_studies FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM hub_users hu WHERE hu.auth_user_id = auth.uid() AND hu.hub_role IN ('super_admin', 'group_admin')));

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_hub_press_releases_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER hub_press_releases_updated_at_trigger BEFORE UPDATE ON hub_press_releases
  FOR EACH ROW EXECUTE FUNCTION update_hub_press_releases_updated_at();

CREATE OR REPLACE FUNCTION update_hub_influencers_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER hub_influencers_updated_at_trigger BEFORE UPDATE ON hub_influencers
  FOR EACH ROW EXECUTE FUNCTION update_hub_influencers_updated_at();

CREATE OR REPLACE FUNCTION update_hub_podcasts_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER hub_podcasts_updated_at_trigger BEFORE UPDATE ON hub_podcasts
  FOR EACH ROW EXECUTE FUNCTION update_hub_podcasts_updated_at();

CREATE OR REPLACE FUNCTION update_hub_research_studies_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER hub_research_studies_updated_at_trigger BEFORE UPDATE ON hub_research_studies
  FOR EACH ROW EXECUTE FUNCTION update_hub_research_studies_updated_at();
