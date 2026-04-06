# Universal CMS Upgrade Guide

How to update an existing Universal CMS installation to the latest version.

---

## Checking for Updates

### From the Reference Repository

If the CMS was scaffolded from the ESGsource reference repo:

```bash
# In the reference repo
cd /home/user/esgsource
git log --oneline -20 -- src/lib/cms/ src/lib/data/ src/components/admin/ supabase/migrations/
```

Compare the latest commits against what was copied to the target project. Key directories to watch:

- `src/lib/cms/cms.config.ts` -- new modules, config schema changes
- `src/lib/data/` -- new or updated data layer functions
- `src/components/admin/` -- shell, sidebar, command palette updates
- `src/app/admin/` -- admin page template changes
- `supabase/migrations/` -- new migration files (higher sequence numbers)
- `src/lib/analytics/` -- new provider adapters or tracking API changes
- `src/lib/security/` -- security utility updates

### From npm Package (Future)

When the `@pandotic/universal-cms` npm package is published:

```bash
# Check for updates
pnpm outdated @pandotic/universal-cms

# Update
pnpm update @pandotic/universal-cms

# Check changelog
npx universal-cms changelog
```

---

## Migration Sync Process

### Step 1: Identify New Migrations

Compare migration files between the reference repo and the target project:

```bash
# List migrations in reference repo
ls /home/user/esgsource/supabase/migrations/

# List migrations in target project
ls <target-project>/supabase/migrations/

# Find new files
diff <(ls /home/user/esgsource/supabase/migrations/) <(ls <target-project>/supabase/migrations/)
```

New migrations will have sequence numbers higher than the last migration in the target project (e.g., if target has up to `00022`, look for `00023+`).

### Step 2: Check Module Relevance

Not all new migrations apply to every installation. Cross-reference new migrations against the module-to-migration mapping in `module-catalog.md`:

- If the migration supports a module that is **enabled** in the target project, it must be applied.
- If the migration supports a module that is **disabled**, skip it unless the user wants to enable that module.
- If the migration is a **CORE** migration, it must always be applied.

### Step 3: Copy Migration Files

```bash
# Copy specific new migrations
cp /home/user/esgsource/supabase/migrations/00023_new_feature.sql <target>/supabase/migrations/

# Or copy all and let Supabase skip already-applied ones
cp /home/user/esgsource/supabase/migrations/*.sql <target>/supabase/migrations/
```

### Step 4: Apply Migrations

```bash
# For hosted Supabase
supabase db push

# For local development
supabase migration up

# To preview without applying
supabase db diff
```

### Step 5: Verify

```bash
# Check that tables exist
supabase db lint

# Run the build
pnpm build
```

---

## Updating Admin Pages

When admin page templates change in the reference repo:

### Safe Update Strategy

1. **Diff the changes** before overwriting:
   ```bash
   diff -r /home/user/esgsource/src/app/admin/content-pages/ <target>/src/app/admin/content-pages/
   ```

2. **Check for local customizations** in the target project. If the target has customized admin pages, merge changes manually rather than overwriting.

3. **Copy updated pages** for modules that have not been customized:
   ```bash
   cp -r /home/user/esgsource/src/app/admin/content-pages/ <target>/src/app/admin/content-pages/
   ```

4. **Update imports** if data layer function signatures changed.

### Common Admin Page Changes

| Change Type | What to Look For |
|---|---|
| New columns in table views | New fields in the data layer, new columns in admin table components |
| Updated form fields | New Zod schemas, new form inputs in create/edit pages |
| Renamed components | Import path changes, component prop changes |
| New data layer functions | New exports from `src/lib/data/*.ts` |
| Updated AdminShell | Changes to sidebar, command palette, or layout structure |

---

## Updating Core Components

### AdminShell, AdminSidebar, CommandPalette

These are shared across all admin pages. When updating:

1. Copy the updated files from `src/components/admin/`
2. Check if `CmsNavItem` or `CmsNavGroup` types changed in `cms.config.ts`
3. Verify the sidebar renders correctly with the target project's `adminNav` config

### Analytics Layer

When analytics providers are added or the tracking API changes:

1. Copy the entire `src/lib/analytics/` directory
2. Check if `AnalyticsContextProvider` props changed
3. Update the root layout if the provider API changed
4. Verify provider initialization in the browser console

### Security Utilities

When security utilities are updated:

1. Copy `src/lib/security/*.ts`
2. Check for new environment variables required by `env-check.ts`
3. Update `next.config.ts` if security header recommendations changed
4. Update `netlify.toml` or `vercel.json` if deployment header config changed

---

## Breaking Change Handling

### Identifying Breaking Changes

Breaking changes typically involve:

1. **Schema changes to existing tables** -- columns renamed, types changed, constraints added
2. **Config type changes** -- new required fields in `CmsConfig`, renamed module names
3. **Data layer API changes** -- function signatures changed, return types changed
4. **Component prop changes** -- admin components requiring new or renamed props

### Migration for Schema Changes

If a migration alters an existing table (not just creating new ones):

```sql
-- Example: adding a required column with a default
ALTER TABLE content_pages ADD COLUMN featured boolean NOT NULL DEFAULT false;

-- Example: renaming a column
ALTER TABLE content_pages RENAME COLUMN old_name TO new_name;
```

After applying, update the data layer and admin pages to use the new schema.

### Config Type Changes

If `CmsModuleName` adds new module names:

1. Add the new module to the `CmsModuleName` type in `cms.config.ts`
2. Add the module's boolean to the `modules` record (set to `false` if not needed)
3. Add the module's entry to `MODULE_MIGRATIONS`
4. Optionally add nav items to `adminNav`

If `CmsConfig` adds new required fields:

1. Check the reference `cms.config.ts` for new fields
2. Add them to the target project's config with appropriate values

---

## Rollback Procedures

### Rolling Back a Migration

Supabase does not natively support down migrations. To roll back:

1. **Write a reverse migration** that undoes the changes:
   ```sql
   -- reverse_00023_new_feature.sql
   DROP TABLE IF EXISTS new_table;
   DROP POLICY IF EXISTS "policy_name" ON existing_table;
   ALTER TABLE existing_table DROP COLUMN IF EXISTS new_column;
   ```

2. **Apply the reverse migration**:
   ```bash
   supabase db push
   ```

3. **Remove the original migration file** from the target project to prevent re-application.

### Rolling Back Admin Page Changes

1. Use git to restore previous versions:
   ```bash
   git checkout HEAD~1 -- src/app/admin/content-pages/
   ```

2. Or restore from a backup if not using git.

### Rolling Back Config Changes

1. Revert `cms.config.ts` to the previous version
2. Ensure the `modules` record matches what is actually deployed (tables exist for enabled modules)
3. Run `pnpm build` to verify consistency

---

## Version Compatibility Notes

### Next.js Compatibility

| CMS Version | Next.js | Notes |
|---|---|---|
| 1.0.x | 14.x, 15.x, 16.x | App Router required. Pages Router not supported. |

### Supabase Compatibility

| CMS Version | Supabase JS | Supabase SSR | Notes |
|---|---|---|---|
| 1.0.x | 2.x | 0.5.x+ | Uses `createBrowserClient` and `createServerClient` from `@supabase/ssr` |

### Tailwind CSS Compatibility

| CMS Version | Tailwind | Notes |
|---|---|---|
| 1.0.x | 3.x or 4.x | v4 preferred. shadcn/ui components work with both. |

### Node.js Compatibility

| CMS Version | Node.js | Notes |
|---|---|---|
| 1.0.x | 18.x, 20.x, 22.x | LTS versions recommended |

---

## Upgrade Checklist

Use this checklist when performing an upgrade:

- [ ] Identify new migration files in the reference repo
- [ ] Determine which new migrations apply to enabled modules
- [ ] Copy relevant migration files to the target project
- [ ] Apply migrations with `supabase db push` or `supabase migration up`
- [ ] Check for changes to `cms.config.ts` types (`CmsModuleName`, `CmsConfig`)
- [ ] Update `cms.config.ts` with any new required fields or module entries
- [ ] Diff and update admin page templates if changed
- [ ] Update `src/components/admin/` shell components if changed
- [ ] Update `src/lib/analytics/` if provider adapters changed
- [ ] Update `src/lib/security/` if security utilities changed
- [ ] Update `src/lib/data/` files for modules whose data layer changed
- [ ] Run `pnpm build` to verify no TypeScript or build errors
- [ ] Test admin panel in browser: login, navigate modules, verify data loads
- [ ] Test public pages affected by the upgrade
- [ ] Deploy to staging and verify before production
