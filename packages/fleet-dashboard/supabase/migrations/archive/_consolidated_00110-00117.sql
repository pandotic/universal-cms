-- ═════════════════════════════════════════════════════════════════════════════
-- Marketing Ops — consolidated migration bundle (00110–00117)
-- Apply via Supabase SQL editor against project: rimbgolutrxpmwsoswhq (Pandotic Hub)
--
-- IMPORTANT: This file concatenates 9 individual migrations:
--   1. 00110_playbooks.sql
--   2. 00110_property_marketing_extensions.sql
--   3. 00111_brand_voice_and_assets.sql
--   4. 00112_unified_content_pipeline.sql
--   5. 00113_brand_setup_checklist.sql
--   6. 00114_qa_autopilot.sql
--   7. 00115_link_building.sql
--   8. 00116_agent_type_migration.sql
--   9. 00117_marketing_operations.sql
--
-- ─── PRE-MIGRATION SAFETY CHECK ──────────────────────────────────────────────
-- BEFORE running the rest of this file, run JUST this query alone first:
--
--   SELECT COUNT(*) FROM hub_social_content;
--
-- If COUNT > 0, STOP. Migration 00112 renames hub_social_content → hub_content_pipeline.
-- Existing rows carry over (rename is non-destructive), but any external code that
-- still references the old table name will break. Only proceed when you have
-- verified zero production data OR confirmed all consumers are updated.
--
-- If COUNT = 0, paste and run the rest of this file (everything below the
-- ═══ banner) as a single transaction.
-- ═════════════════════════════════════════════════════════════════════════════


-- ═════════════════════════════════════════════════════════════════════════════
-- 00110_playbooks.sql
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── Playbooks ─────────────────────────────────────────────────────────────
-- Reusable operation templates and per-property instances with step tracking.

create type hub_playbook_step_type as enum (
  'manual',        -- user marks done manually
  'deploy_skill',  -- triggers skill fanout
  'upgrade_cms',   -- triggers CMS upgrade
  'run_agent',     -- triggers an agent run
  'open_url'       -- opens an external link
);

create type hub_playbook_status as enum (
  'not_started',
  'in_progress',
  'completed',
  'cancelled'
);

-- Playbook templates (reusable definitions)
create table hub_playbook_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text,
  category     text,                        -- 'onboarding' | 'upgrade' | 'deploy' | 'audit'
  is_system    boolean not null default false,
  created_by   uuid references hub_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Steps within a template (ordered)
create table hub_playbook_template_steps (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references hub_playbook_templates(id) on delete cascade,
  position      smallint not null default 0,
  title         text not null,
  description   text,
  step_type     hub_playbook_step_type not null default 'manual',
  step_config   jsonb not null default '{}',  -- {skill_id, url, agent_id, etc.}
  required      boolean not null default true,
  created_at    timestamptz not null default now()
);

-- A playbook "run" — one instance of a template applied to one property
create table hub_playbook_runs (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references hub_playbook_templates(id) on delete cascade,
  property_id  uuid not null references hub_properties(id) on delete cascade,
  status       hub_playbook_status not null default 'not_started',
  started_by   uuid references hub_users(id) on delete set null,
  started_at   timestamptz,
  completed_at timestamptz,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Per-step completion state for each run
create table hub_playbook_run_steps (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null references hub_playbook_runs(id) on delete cascade,
  template_step_id uuid not null references hub_playbook_template_steps(id) on delete cascade,
  status          hub_playbook_status not null default 'not_started',
  completed_by    uuid references hub_users(id) on delete set null,
  completed_at    timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);

-- Indexes
create index idx_playbook_runs_property on hub_playbook_runs(property_id);
create index idx_playbook_runs_template on hub_playbook_runs(template_id);
create index idx_playbook_runs_status on hub_playbook_runs(status);
create index idx_playbook_run_steps_run on hub_playbook_run_steps(run_id);
create index idx_template_steps_template on hub_playbook_template_steps(template_id, position);

-- RLS
alter table hub_playbook_templates enable row level security;
alter table hub_playbook_template_steps enable row level security;
alter table hub_playbook_runs enable row level security;
alter table hub_playbook_run_steps enable row level security;

create policy "authenticated read playbook templates"
  on hub_playbook_templates for select to authenticated using (true);

create policy "super_admin manage playbook templates"
  on hub_playbook_templates for all to authenticated
  using (exists (select 1 from hub_users where auth_user_id = auth.uid() and hub_role = 'super_admin'));

create policy "authenticated read template steps"
  on hub_playbook_template_steps for select to authenticated using (true);

create policy "super_admin manage template steps"
  on hub_playbook_template_steps for all to authenticated
  using (exists (select 1 from hub_users where auth_user_id = auth.uid() and hub_role = 'super_admin'));

create policy "authenticated read playbook runs"
  on hub_playbook_runs for select to authenticated using (true);

create policy "authenticated manage playbook runs"
  on hub_playbook_runs for all to authenticated using (true);

create policy "authenticated manage run steps"
  on hub_playbook_run_steps for all to authenticated using (true);

-- Seed system playbook templates
insert into hub_playbook_templates (name, slug, description, category, is_system) values
  ('Onboard new site', 'onboard-site', 'Steps to fully onboard a new client or personal site into the Hub.', 'onboarding', true),
  ('Upgrade CMS across fleet', 'upgrade-cms-fleet', 'Safely roll out a CMS version upgrade to one or more sites.', 'upgrade', true),
  ('Deploy skill to fleet', 'deploy-skill-fleet', 'Propagate a new or updated skill to selected sites.', 'deploy', true),
  ('Monthly health audit', 'monthly-health-audit', 'Run a health check pass: SSL, versions, agents, costs.', 'audit', true);

-- Seed steps for "Onboard new site"
with t as (select id from hub_playbook_templates where slug = 'onboard-site')
insert into hub_playbook_template_steps (template_id, position, title, description, step_type) values
  ((select id from t), 0, 'Register property in Hub', 'Create the property record and set ownership/stage.', 'manual'),
  ((select id from t), 1, 'Connect GitHub repo', 'Link the GitHub repository for deploy tracking.', 'open_url'),
  ((select id from t), 2, 'Install universal-cms package', 'Run the CMS install command on the site.', 'manual'),
  ((select id from t), 3, 'Deploy core skills', 'Deploy required skills to the new site.', 'deploy_skill'),
  ((select id from t), 4, 'Configure Supabase project', 'Link the Supabase project ref and run migrations.', 'manual'),
  ((select id from t), 5, 'Verify health check endpoint', 'Confirm /api/admin/health returns 200.', 'open_url'),
  ((select id from t), 6, 'Set up marketing services', 'Add relevant marketing service records.', 'manual');

-- Seed steps for "Upgrade CMS across fleet"
with t as (select id from hub_playbook_templates where slug = 'upgrade-cms-fleet')
insert into hub_playbook_template_steps (template_id, position, title, description, step_type) values
  ((select id from t), 0, 'Review changelog', 'Read the release notes for breaking changes.', 'open_url'),
  ((select id from t), 1, 'Deploy to staging site first', 'Test the upgrade on a low-risk property.', 'upgrade_cms'),
  ((select id from t), 2, 'Run health checks on staging', 'Confirm staging site is healthy after upgrade.', 'run_agent'),
  ((select id from t), 3, 'Deploy to remaining fleet', 'Propagate upgrade to all selected sites.', 'upgrade_cms'),
  ((select id from t), 4, 'Verify all sites healthy', 'Run a fleet-wide health check pass.', 'run_agent');

-- ═════════════════════════════════════════════════════════════════════════════
-- 00110_property_marketing_extensions.sql
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── Property Marketing Extensions ──────────────────────────────────────────
-- Extends hub_properties with marketing categorization, operational flags,
-- and denormalized counts for dashboard performance.
-- Created: Marketing Ops Module — Chunk 1

-- Marketing categorization
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS relationship_type TEXT
  CHECK (relationship_type IN (
    'gbi_personal', 'pandotic_studio', 'pandotic_studio_product',
    'pandotic_client', 'standalone', 'local_service'
  ));

ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS parent_property_id UUID
  REFERENCES hub_properties(id) ON DELETE SET NULL;

ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS site_profile TEXT
  CHECK (site_profile IN (
    'marketing_only', 'marketing_and_cms', 'app_only', 'local_service'
  ));

-- Marketing operational flags
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS auto_pilot_enabled BOOLEAN DEFAULT false;
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS kill_switch BOOLEAN DEFAULT false;
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS analytics_provider TEXT;
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS analytics_site_id TEXT;

-- Denormalized counts for dashboard speed
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS content_pending_review_count INTEGER DEFAULT 0;
ALTER TABLE hub_properties ADD COLUMN IF NOT EXISTS agent_errors_24h_count INTEGER DEFAULT 0;

-- Index for parent→child property lookups
CREATE INDEX IF NOT EXISTS idx_hub_properties_parent_property_id
  ON hub_properties(parent_property_id) WHERE parent_property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hub_properties_relationship_type
  ON hub_properties(relationship_type) WHERE relationship_type IS NOT NULL;

-- ═════════════════════════════════════════════════════════════════════════════
-- 00111_brand_voice_and_assets.sql
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── Brand Voice Extensions + Brand Assets ──────────────────────────────────
-- Extends hub_brand_voice_briefs with voice modeling and visual identity.
-- Creates hub_brand_assets for derivative brand assets per property.
-- Created: Marketing Ops Module — Chunk 1

-- ─── Part A: Brand Voice Brief Extensions ───────────────────────────────────

-- Voice modeling
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS voice_attributes TEXT[] DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS tone_variations JSONB DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS vocabulary JSONB DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS sentence_patterns JSONB DEFAULT '{}';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS anti_examples JSONB DEFAULT '[]';
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS humor_guidelines TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS corrections_journal JSONB DEFAULT '[]';

-- Visual identity
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS font_family TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS photo_style_guide TEXT;
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS photo_mood_keywords TEXT[];
ALTER TABLE hub_brand_voice_briefs ADD COLUMN IF NOT EXISTS use_ai_generation BOOLEAN DEFAULT false;

-- ─── Part B: Brand Assets Table ─────────────────────────────────────────────

CREATE TABLE hub_brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,

  -- Descriptions at multiple lengths
  description_25 TEXT,
  description_50 TEXT,
  description_100 TEXT,
  description_250 TEXT,
  description_500 TEXT,

  -- Per-platform social bios
  bio_twitter TEXT,
  bio_linkedin TEXT,
  bio_instagram TEXT,
  bio_facebook TEXT,

  -- Categorization
  category_primary TEXT,
  categories_secondary TEXT[],
  keywords TEXT[],

  -- Press & PR
  press_boilerplate TEXT,

  -- Visual assets
  hashtags JSONB DEFAULT '{}',
  logo_urls JSONB DEFAULT '{}',

  -- NAP (Name, Address, Phone) for local SEO
  nap_name TEXT,
  nap_address TEXT,
  nap_phone TEXT,
  nap_email TEXT,

  -- Structured data
  schema_jsonld JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(property_id)
);

-- RLS
ALTER TABLE hub_brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_assets_select_authenticated ON hub_brand_assets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY brand_assets_insert_admin ON hub_brand_assets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY brand_assets_update_admin ON hub_brand_assets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY brand_assets_delete_admin ON hub_brand_assets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_hub_brand_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_brand_assets_updated_at_trigger
  BEFORE UPDATE ON hub_brand_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_brand_assets_updated_at();

-- ═════════════════════════════════════════════════════════════════════════════
-- 00112_unified_content_pipeline.sql
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── Unified Content Pipeline ────────────────────────────────────────────────
-- Generalizes hub_social_content into hub_content_pipeline.
-- Social becomes a channel filter — all content types flow through one pipeline.
-- Created: Marketing Ops Module — Chunk 1

-- Rename table
ALTER TABLE hub_social_content RENAME TO hub_content_pipeline;

-- Add channel column (social, blog, email, press, etc.)
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS channel TEXT
  NOT NULL DEFAULT 'social'
  CHECK (channel IN (
    'social', 'blog', 'email', 'press', 'featured_pitch',
    'newsletter', 'landing_page', 'case_study', 'guest_post'
  ));

-- Agent attribution and QA
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS drafted_by_agent TEXT;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS qa_confidence NUMERIC;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS published_url TEXT;

-- Repurposing chain: link derived content back to source
ALTER TABLE hub_content_pipeline ADD COLUMN IF NOT EXISTS source_content_id UUID
  REFERENCES hub_content_pipeline(id) ON DELETE SET NULL;

-- Broaden status enum to include pipeline stages
-- The existing enum has: draft, review, approved, published, archived
-- We need to add: drafted, qa_review, needs_human_review, revision_requested, scheduled
-- Strategy: convert to text + CHECK for flexibility
ALTER TABLE hub_content_pipeline ALTER COLUMN status TYPE TEXT;
DROP TYPE IF EXISTS social_content_status;
ALTER TABLE hub_content_pipeline ADD CONSTRAINT hub_content_pipeline_status_check
  CHECK (status IN (
    'draft', 'drafted', 'qa_review', 'review', 'needs_human_review',
    'revision_requested', 'approved', 'scheduled', 'published', 'archived'
  ));

-- Convert platform from enum to text for flexibility
ALTER TABLE hub_content_pipeline ALTER COLUMN platform TYPE TEXT;
ALTER TABLE hub_content_pipeline ALTER COLUMN platform DROP NOT NULL;
DROP TYPE IF EXISTS social_platform;

-- Convert content_type from enum to text for flexibility
ALTER TABLE hub_content_pipeline ALTER COLUMN content_type TYPE TEXT;
ALTER TABLE hub_content_pipeline ALTER COLUMN content_type DROP NOT NULL;
DROP TYPE IF EXISTS social_content_type;

-- New indexes
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_channel
  ON hub_content_pipeline(channel);
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_drafted_by_agent
  ON hub_content_pipeline(drafted_by_agent) WHERE drafted_by_agent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hub_content_pipeline_source_content_id
  ON hub_content_pipeline(source_content_id) WHERE source_content_id IS NOT NULL;

-- Rename existing indexes and triggers to match new table name
-- (PostgreSQL renames indexes automatically with ALTER TABLE RENAME,
-- but triggers keep their old names — update for clarity)
ALTER FUNCTION IF EXISTS update_hub_social_content_updated_at() RENAME TO update_hub_content_pipeline_updated_at;

-- ═════════════════════════════════════════════════════════════════════════════
-- 00113_brand_setup_checklist.sql
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── Brand Setup Checklist ───────────────────────────────────────────────────
-- Tracks one-time setup tasks per brand (claiming profiles, creating accounts, etc.)
-- Separate from recurring agent work — these are "have you done this once?" items.
-- Created: Marketing Ops Module — Chunk 1

CREATE TABLE hub_brand_setup_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,

  category TEXT NOT NULL CHECK (category IN (
    'social_profiles', 'directories', 'review_sites', 'email_platform',
    'analytics', 'legal', 'brand_identity', 'press_kit', 'other'
  )),
  task_name TEXT NOT NULL,
  platform TEXT,
  tier TEXT CHECK (tier IN ('tier_1', 'tier_2', 'tier_3')),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'skipped', 'blocked'
  )),
  execution_mode TEXT CHECK (execution_mode IN (
    'automated', 'semi_automated', 'manual'
  )),

  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  result_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_brand_setup_checklist_property_category
  ON hub_brand_setup_checklist(property_id, category);
CREATE INDEX idx_hub_brand_setup_checklist_property_status
  ON hub_brand_setup_checklist(property_id, status);

-- RLS
ALTER TABLE hub_brand_setup_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY setup_checklist_select_authenticated ON hub_brand_setup_checklist
  FOR SELECT TO authenticated USING (true);

CREATE POLICY setup_checklist_insert_admin ON hub_brand_setup_checklist
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY setup_checklist_update_admin ON hub_brand_setup_checklist
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

CREATE POLICY setup_checklist_delete_admin ON hub_brand_setup_checklist
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users hu
      WHERE hu.auth_user_id = auth.uid()
      AND hu.hub_role IN ('super_admin', 'group_admin')
    )
  );

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_hub_brand_setup_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hub_brand_setup_checklist_updated_at_trigger
  BEFORE UPDATE ON hub_brand_setup_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_brand_setup_checklist_updated_at();

-- ═════════════════════════════════════════════════════════════════════════════
-- 00114_qa_autopilot.sql
-- ═════════════════════════════════════════════════════════════════════════════

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

-- ═════════════════════════════════════════════════════════════════════════════
-- 00115_link_building.sql
-- ═════════════════════════════════════════════════════════════════════════════

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

-- ═════════════════════════════════════════════════════════════════════════════
-- 00116_agent_type_migration.sql
-- ═════════════════════════════════════════════════════════════════════════════

-- ─── Agent Type Migration ────────────────────────────────────────────────────
-- Converts agent_type from PostgreSQL enum to text with CHECK constraint.
-- Adds 22+ marketing-specific agent types.
-- Created: Marketing Ops Module — Chunk 1

-- Step 1: Convert column from enum to text
ALTER TABLE hub_agents ALTER COLUMN agent_type TYPE TEXT USING agent_type::TEXT;

-- Step 2: Drop the enum type (no longer needed)
DROP TYPE IF EXISTS agent_type;

-- Step 3: Add CHECK constraint with all original + marketing types
ALTER TABLE hub_agents ADD CONSTRAINT hub_agents_agent_type_check
  CHECK (agent_type IN (
    -- Original types
    'seo_audit', 'broken_links', 'dependency_update',
    'content_freshness', 'ssl_monitor', 'custom',

    -- Department 1: Office of the Marketing Director
    'marketing_director',

    -- Department 2: Content & Creative
    'editorial_director', 'long_form_writer', 'copywriter',
    'repurposing_specialist', 'graphics_orchestrator',

    -- Department 3: Distribution & Growth
    'growth_director', 'social_media_manager', 'pr_strategist',
    'seo_specialist', 'link_builder',

    -- Department 4: Relationships & Outreach
    'head_of_partnerships', 'influencer_researcher',
    'podcast_booker', 'community_manager',

    -- Department 5: Email & Owned Audience
    'email_marketing_manager',

    -- Department 6: Original Research & Authority
    'research_analyst',

    -- Department 7: Operations & Intelligence
    'head_of_marketing_ops', 'analyst', 'customer_voice_researcher',
    'skeptical_reviewer', 'compliance_officer',

    -- Link Building bonus agents
    'brand_profile_builder', 'social_profile_creator',
    'directory_submission_agent', 'review_site_claimer',
    'link_monitoring_agent'
  ));

-- Also convert agent_run_status and agent_trigger enums to text for consistency
ALTER TABLE hub_agent_runs ALTER COLUMN status TYPE TEXT USING status::TEXT;
DROP TYPE IF EXISTS agent_run_status;
ALTER TABLE hub_agent_runs ADD CONSTRAINT hub_agent_runs_status_check
  CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));

ALTER TABLE hub_agent_runs ALTER COLUMN triggered_by TYPE TEXT USING triggered_by::TEXT;
DROP TYPE IF EXISTS agent_trigger;
ALTER TABLE hub_agent_runs ADD CONSTRAINT hub_agent_runs_triggered_by_check
  CHECK (triggered_by IN ('schedule', 'manual', 'webhook'));

-- ═════════════════════════════════════════════════════════════════════════════
-- 00117_marketing_operations.sql
-- ═════════════════════════════════════════════════════════════════════════════

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

-- ═════════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION VERIFICATION QUERIES
-- Run these after the bundle to confirm everything landed correctly.
-- ═════════════════════════════════════════════════════════════════════════════

-- Should return 15 rows:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'hub_brand_assets',
    'hub_content_pipeline',
    'hub_brand_setup_checklist',
    'hub_content_qa_reviews',
    'hub_auto_pilot_settings',
    'hub_qa_learning_log',
    'hub_link_opportunities',
    'hub_link_submissions',
    'hub_featured_outbound_pitches',
    'hub_featured_inbound_submissions',
    'hub_press_releases',
    'hub_influencers',
    'hub_influencer_interactions',
    'hub_podcasts',
    'hub_research_studies'
  )
ORDER BY table_name;

-- Should return 5 rows (the new hub_properties columns):
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'hub_properties'
  AND column_name IN (
    'relationship_type',
    'parent_property_id',
    'site_profile',
    'auto_pilot_enabled',
    'kill_switch'
  )
ORDER BY column_name;

-- Should return 0 rows (old table renamed away):
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'hub_social_content';
