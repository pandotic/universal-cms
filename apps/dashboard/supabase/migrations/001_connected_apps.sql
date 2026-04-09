-- Connected Apps table for the Universal CMS Dashboard
-- Prerequisite: admin-schema migrations must be applied first (provides is_platform_admin() function)

create table if not exists connected_apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  supabase_project_url text,
  admin_deep_link_template text,
  status text not null default 'unknown'
    check (status in ('healthy', 'degraded', 'down', 'unknown')),
  last_health_check timestamptz,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table connected_apps enable row level security;

-- Any authenticated user can view connected apps
create policy "Authenticated users can view apps"
  on connected_apps for select
  to authenticated
  using (true);

-- Only platform admins can insert/update/delete
create policy "Platform admins can insert apps"
  on connected_apps for insert
  to authenticated
  with check (is_platform_admin(auth.uid()));

create policy "Platform admins can update apps"
  on connected_apps for update
  to authenticated
  using (is_platform_admin(auth.uid()));

create policy "Platform admins can delete apps"
  on connected_apps for delete
  to authenticated
  using (is_platform_admin(auth.uid()));

-- Auto-update updated_at
create or replace function update_connected_apps_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger connected_apps_updated_at
  before update on connected_apps
  for each row
  execute function update_connected_apps_updated_at();
