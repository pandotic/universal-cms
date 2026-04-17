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
  using (exists (select 1 from hub_users where auth_user_id = auth.uid() and role = 'super_admin'));

create policy "authenticated read template steps"
  on hub_playbook_template_steps for select to authenticated using (true);

create policy "super_admin manage template steps"
  on hub_playbook_template_steps for all to authenticated
  using (exists (select 1 from hub_users where auth_user_id = auth.uid() and role = 'super_admin'));

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
