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
