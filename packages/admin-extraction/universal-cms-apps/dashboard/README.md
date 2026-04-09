# Universal CMS Dashboard

An oversight dashboard for managing connected apps that use the `@universal-cms` admin packages.

## Design Decision: Oversight, Not Remote Control

This dashboard is intentionally **read-only + deep-link** in v1. Here's why:

1. **Auth boundaries**: Each connected app has its own Supabase project with its own auth. Cross-app writes would require storing service-role keys for every app, creating a high-value attack target.

2. **Simplicity**: Deep-linking into each app's admin panel means the admin UI is always running within that app's auth context. No session proxying, no cross-origin token passing.

3. **Correctness**: Each app's RLS policies, audit logging, and permission checks run normally when the admin operates within that app's own admin panel.

4. **Incremental**: v2 can add read-only analytics aggregation (each app pushes metrics to the dashboard's Supabase). v3 could add cross-app actions via a well-defined API contract if needed.

## What it does today

- Lists connected apps with health status badges
- "Open Admin" button deep-links into each app's admin panel
- Register new apps with their URL and Supabase project info
- v1 uses localStorage; production would use a `connected_apps` table on the dashboard's own Supabase

## Running locally

```bash
cd apps/dashboard
npm install
npm run dev
```

## Connected Apps Table Schema (for production)

```sql
CREATE TABLE connected_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  supabase_project_url text NOT NULL,
  admin_deep_link_template text,
  status text DEFAULT 'unknown',
  last_health_check timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
