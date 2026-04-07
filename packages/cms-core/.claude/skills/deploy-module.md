# Deploy a Module to a Project Site

Enable a CMS module in an existing project that uses `@pandotic/universal-cms`.

## Pre-flight

1. Ask the user which module(s) to deploy and to which project.
2. Verify the project is using `@pandotic/universal-cms` (check `package.json`).
3. Check the current CMS version — the module must exist in the installed version.

## Steps

### 1. Update CMS Version (if needed)
- If the module was added in a newer version, update the package:
  ```bash
  pnpm update @pandotic/universal-cms
  ```
- Review the changelog for any breaking changes.

### 2. Enable the Module
- Open `src/cms.config.ts` and set the module to `true` in the modules config.
- If using a preset, switch to a custom config or a preset that includes the module.

### 3. Run Migrations
- Get the migration SQL from the module registry:
  ```typescript
  import { MODULE_MIGRATIONS } from "@pandotic/universal-cms/config";
  // MODULE_MIGRATIONS.<moduleName> contains the SQL file paths
  ```
- Run the migration SQL against the project's Supabase instance.
- Verify tables were created in the Supabase dashboard.

### 4. Add Admin Pages
- Create `src/app/admin/<module>/page.tsx` using the template as reference.
- Import data functions from the appropriate subpath:
  ```typescript
  import { fetchItems } from "@pandotic/universal-cms/data/<module>";
  ```

### 5. Add API Routes
- Create `src/app/api/admin/<module>/route.ts`.
- Use the auth middleware pattern:
  ```typescript
  import { requireAdmin, apiError } from "@pandotic/universal-cms/middleware";
  ```

### 6. Update Admin Navigation
- Add the module's admin page to `adminNav` in `cms.config.ts`.

### 7. Verify
- Run `pnpm dev` and navigate to the new admin page.
- Verify data operations work (create, read, update, delete).
- Check the health endpoint (`/api/admin/health`) shows the module as enabled.

## Rollback
If something goes wrong:
1. Set the module back to `false` in `cms.config.ts`.
2. The admin pages can be deleted — data in Supabase is preserved.
3. Do NOT drop migration tables unless explicitly requested.
