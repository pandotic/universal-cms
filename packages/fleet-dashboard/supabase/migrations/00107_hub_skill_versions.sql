-- ═══════════════════════════════════════════════════════════════════════════
-- 00107_hub_skill_versions.sql — Version tracking + scope/deployment fields
-- Extends the skill library schema from 00106 with version history,
-- skill scope (fleet vs site), and deployment version pinning.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Skill Version History ────────────────────────────────────────────────

create table hub_skill_versions (
  id            uuid primary key default gen_random_uuid(),
  skill_id      uuid not null references hub_skills(id) on delete cascade,
  version       text not null,
  changelog     text,
  content_hash  text not null,
  created_at    timestamptz not null default now(),

  unique (skill_id, version)
);

create index idx_hub_skill_versions_skill on hub_skill_versions(skill_id, created_at desc);

-- ─── Extend hub_skills ────────────────────────────────────────────────────

alter table hub_skills add column if not exists scope text not null default 'fleet';
alter table hub_skills add column if not exists content_path text;
alter table hub_skills add column if not exists component_ids text[] not null default '{}';
alter table hub_skills add column if not exists manifest_id text unique;

create index idx_hub_skills_scope on hub_skills(scope);
create index idx_hub_skills_manifest_id on hub_skills(manifest_id);

-- ─── Extend hub_skill_deployments ─────────────────────────────────────────

alter table hub_skill_deployments add column if not exists deployed_version text not null default '1.0.0';
alter table hub_skill_deployments add column if not exists current_version text not null default '1.0.0';
alter table hub_skill_deployments add column if not exists pinned boolean not null default false;
alter table hub_skill_deployments add column if not exists github_pr_url text;
alter table hub_skill_deployments add column if not exists github_repo text;

-- ─── RLS for hub_skill_versions ───────────────────────────────────────────

alter table hub_skill_versions enable row level security;

create policy "hub_skill_versions_select" on hub_skill_versions
  for select to authenticated using (true);

create policy "hub_skill_versions_insert" on hub_skill_versions
  for insert to authenticated
  with check (
    exists (
      select 1 from hub_users
      where auth_user_id = auth.uid()
        and hub_role in ('super_admin', 'group_admin')
    )
  );
