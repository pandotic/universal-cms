-- ═══════════════════════════════════════════════════════════════════════════
-- 00106_hub_skills.sql — Skill Library tables for Pandotic Hub
-- Stores skill definitions, deployments to properties, and execution runs.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Enums ────────────────────────────────────────────────────────────────

create type skill_platform as enum (
  'google_ads', 'meta_ads', 'linkedin', 'twitter', 'tiktok',
  'email', 'seo', 'analytics', 'content', 'social_organic', 'cross_platform'
);

create type skill_category as enum (
  'acquisition', 'retention', 'engagement', 'analytics',
  'content_creation', 'brand_management', 'automation'
);

create type skill_execution_mode as enum (
  'scheduled', 'manual', 'webhook', 'event'
);

create type skill_status as enum (
  'draft', 'active', 'paused', 'archived'
);

create type deploy_target_type as enum (
  'universal_cms', 'wordpress', 'static', 'custom'
);

create type deployment_status as enum (
  'pending', 'active', 'paused', 'failed', 'removed'
);

create type deployment_run_status as enum (
  'pending', 'running', 'completed', 'failed', 'cancelled'
);

create type run_trigger as enum (
  'schedule', 'manual', 'webhook', 'event'
);

-- ─── Skill Definitions ────────────────────────────────────────────────────

create table hub_skills (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text not null default '',
  platform      skill_platform not null,
  category      skill_category not null,
  execution_mode skill_execution_mode not null default 'manual',
  default_config jsonb not null default '{}'::jsonb,
  config_schema  jsonb,
  default_schedule text,  -- cron expression
  status        skill_status not null default 'draft',
  version       text not null default '0.1.0',
  tags          text[] not null default '{}',
  created_by    uuid references hub_users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_hub_skills_platform on hub_skills(platform);
create index idx_hub_skills_category on hub_skills(category);
create index idx_hub_skills_status on hub_skills(status);
create index idx_hub_skills_tags on hub_skills using gin(tags);

-- ─── Skill Deployments ────────────────────────────────────────────────────

create table hub_skill_deployments (
  id              uuid primary key default gen_random_uuid(),
  skill_id        uuid not null references hub_skills(id) on delete cascade,
  property_id     uuid not null references hub_properties(id) on delete cascade,
  config_overrides jsonb not null default '{}'::jsonb,
  schedule        text,  -- cron override
  target_type     deploy_target_type not null default 'universal_cms',
  status          deployment_status not null default 'pending',
  last_run_at     timestamptz,
  last_run_status deployment_run_status,
  deployed_by     uuid references hub_users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- A skill can only be deployed once per property
  unique (skill_id, property_id)
);

create index idx_hub_skill_deployments_skill on hub_skill_deployments(skill_id);
create index idx_hub_skill_deployments_property on hub_skill_deployments(property_id);
create index idx_hub_skill_deployments_status on hub_skill_deployments(status);

-- ─── Deployment Runs ──────────────────────────────────────────────────────

create table hub_skill_deployment_runs (
  id              uuid primary key default gen_random_uuid(),
  deployment_id   uuid not null references hub_skill_deployments(id) on delete cascade,
  skill_id        uuid not null references hub_skills(id) on delete cascade,
  property_id     uuid not null references hub_properties(id) on delete cascade,
  status          deployment_run_status not null default 'pending',
  triggered_by    run_trigger not null default 'manual',
  effective_config jsonb not null default '{}'::jsonb,
  result          jsonb,
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_hub_skill_runs_deployment on hub_skill_deployment_runs(deployment_id, created_at desc);
create index idx_hub_skill_runs_property on hub_skill_deployment_runs(property_id);
create index idx_hub_skill_runs_status on hub_skill_deployment_runs(status);

-- ─── RLS ──────────────────────────────────────────────────────────────────

alter table hub_skills enable row level security;
alter table hub_skill_deployments enable row level security;
alter table hub_skill_deployment_runs enable row level security;

-- Skills: all authenticated users can read, super_admin/group_admin can write
create policy "hub_skills_select" on hub_skills
  for select to authenticated using (true);

create policy "hub_skills_insert" on hub_skills
  for insert to authenticated
  with check (
    exists (
      select 1 from hub_users
      where auth_user_id = auth.uid()
        and hub_role in ('super_admin', 'group_admin')
    )
  );

create policy "hub_skills_update" on hub_skills
  for update to authenticated
  using (
    exists (
      select 1 from hub_users
      where auth_user_id = auth.uid()
        and hub_role in ('super_admin', 'group_admin')
    )
  );

-- Deployments: all authenticated can read, super_admin/group_admin can write
create policy "hub_skill_deployments_select" on hub_skill_deployments
  for select to authenticated using (true);

create policy "hub_skill_deployments_insert" on hub_skill_deployments
  for insert to authenticated
  with check (
    exists (
      select 1 from hub_users
      where auth_user_id = auth.uid()
        and hub_role in ('super_admin', 'group_admin')
    )
  );

create policy "hub_skill_deployments_update" on hub_skill_deployments
  for update to authenticated
  using (
    exists (
      select 1 from hub_users
      where auth_user_id = auth.uid()
        and hub_role in ('super_admin', 'group_admin')
    )
  );

-- Runs: all authenticated can read, super_admin/group_admin can write
create policy "hub_skill_runs_select" on hub_skill_deployment_runs
  for select to authenticated using (true);

create policy "hub_skill_runs_insert" on hub_skill_deployment_runs
  for insert to authenticated
  with check (
    exists (
      select 1 from hub_users
      where auth_user_id = auth.uid()
        and hub_role in ('super_admin', 'group_admin')
    )
  );

create policy "hub_skill_runs_update" on hub_skill_deployment_runs
  for update to authenticated
  using (
    exists (
      select 1 from hub_users
      where auth_user_id = auth.uid()
        and hub_role in ('super_admin', 'group_admin')
    )
  );
