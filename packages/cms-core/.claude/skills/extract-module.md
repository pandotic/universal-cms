# Extract a Module from a Project into Universal CMS Core

Extract a feature/module from a project repo into `@pandotic/universal-cms` so it can be shared across all sites.

## Pre-flight

1. Ask the user which module to extract and from which project repo.
2. Identify the module's data layer, API routes, admin pages, and components in the source project.

## Steps

### 1. Data Layer
- Copy the data functions into `packages/cms-core/src/data/<module-name>.ts`.
- Ensure every function takes `client: SupabaseClient` as its first parameter (dependency injection pattern).
- Remove any project-specific imports; use only `@supabase/supabase-js` types.
- Export all functions from the file.

### 2. Types
- Add any new TypeScript types to `packages/cms-core/src/types/index.ts`.
- If the module introduces a new database table, add the type definition.

### 3. Config
- Add the module name to the `CmsModuleName` union in `packages/cms-core/src/config.ts`.
- Add migration SQL files to `MODULE_MIGRATIONS` mapping.
- Add the module to relevant `modulePresets` (usually `full`, sometimes `directory` or `blog`).

### 4. Registry
- Add a `ModuleInfo` entry to `packages/cms-core/src/registry.ts` with label, description, category, migrations, dataExport, and adminPath.

### 5. Migrations
- Copy or create SQL migration files in `packages/cms-core/src/migrations/`.
- Ensure they are idempotent (use `IF NOT EXISTS`).

### 6. Admin Components (if applicable)
- Extract reusable admin components to `packages/cms-core/src/components/admin/`.
- Ensure they use `useCmsConfig()` for configuration, not direct imports.
- Add `"use client"` directive where needed.

### 7. Subpath Exports
- Add the new data export to `package.json` exports map.
- Add the entry point to `tsup.config.ts`.

### 8. Template
- Add example admin page to `template/src/app/admin/<module>/page.tsx`.
- Add example API route to `template/src/app/api/admin/<module>/route.ts`.

### 9. Changeset
- Create a changeset: `pnpm changeset` describing the new module.
- This ensures the next release includes the module.

### 10. Verify
- Run `pnpm -r typecheck` to ensure no type errors.
- Run `pnpm -r build` to verify the build succeeds.
