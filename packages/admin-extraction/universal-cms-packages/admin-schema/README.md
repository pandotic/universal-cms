# @universal-cms/admin-schema

Portable Supabase migrations and RLS policies for the three-tier admin system.

## How to apply to a new Supabase project

### Option A: Using Supabase CLI

1. Copy the migration files into your project's `supabase/migrations/` directory:
   ```bash
   cp packages/admin-schema/migrations/*.sql your-project/supabase/migrations/
   ```

2. Apply RLS policies:
   ```bash
   cat packages/admin-schema/rls/*.sql | supabase db push
   ```

3. Seed default data:
   ```bash
   cat packages/admin-schema/seed/*.sql | supabase db push
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

### Option B: Supabase Dashboard

1. Open your Supabase project's SQL Editor
2. Run each file in order:
   - `migrations/001_user_profiles_and_roles.sql`
   - `migrations/002_organizations_and_modules.sql`
   - `migrations/003_rpc_functions.sql`
   - `rls/001_user_policies.sql`
   - `rls/002_org_policies.sql`
   - `seed/001_default_roles.sql`

## What you get

After applying these migrations, your Supabase project will have:

- **User profiles** with account status (active/suspended/deactivated)
- **Role-based access control** with 5 core roles (extensible via the `user_roles` table)
- **Organizations** with tiers, branding, and member management
- **Module access control** at platform, org, and user levels
- **Audit logging** with before/after state tracking
- **Feature flags** with per-user, per-org, per-role targeting
- **System health metrics** and **admin alerts**
- **Admin settings** for runtime configuration without redeploy

## Extending with app-specific tables

The schema is designed to be extended. Your app-specific entities (homes, concerts, bids, etc.) should:

1. Create their own tables in separate migrations
2. Add RLS policies that reference `is_platform_admin()` for admin overrides
3. Use the `admin_audit_log` table for audit trail integration

## File inventory

```
migrations/
  001_user_profiles_and_roles.sql   — User profiles, roles, settings, notifications
  002_organizations_and_modules.sql — Orgs, modules, audit log, alerts, feature flags
  003_rpc_functions.sql             — is_platform_admin, get_user_highest_role, bootstrap

rls/
  001_user_policies.sql             — User-scoped + admin-override policies
  002_org_policies.sql              — Org-scoped + admin-override policies

seed/
  001_default_roles.sql             — Default admin settings
```
