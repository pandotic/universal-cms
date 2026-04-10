-- API Central: Services, Secrets, and Projects
-- Run this against your Supabase project to set up the required tables.

-- ─── API Services ────────────────────────────────────────────────────────────

create table if not exists api_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  category text default 'Other',
  entity text default 'Other',
  login_method text,
  monthly_budget numeric(10,2) default 0,
  current_spend numeric(10,2) default 0,
  billing_cycle text default 'monthly',
  renewal_date date,
  status text default 'active',
  notes text,
  projects text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── API Secrets ─────────────────────────────────────────────────────────────

create table if not exists api_secrets (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references api_services(id) on delete cascade,
  name text not null,
  value text not null,
  env text default 'production',
  last_rotated date,
  expires_at date,
  encrypted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Projects ────────────────────────────────────────────────────────────────

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  entity text,
  description text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists idx_api_services_status on api_services(status);
create index if not exists idx_api_services_entity on api_services(entity);
create index if not exists idx_api_secrets_service on api_secrets(service_id);
create index if not exists idx_projects_active on projects(active);

-- ─── RLS Policies ────────────────────────────────────────────────────────────
-- Auth is handled at the Netlify Function layer, so we allow anon access
-- through PostgREST. If you want DB-level auth, replace these with
-- authenticated-only policies.

alter table api_services enable row level security;
alter table api_secrets enable row level security;
alter table projects enable row level security;

create policy "api_services_all" on api_services for all using (true) with check (true);
create policy "api_secrets_all" on api_secrets for all using (true) with check (true);
create policy "projects_all" on projects for all using (true) with check (true);
