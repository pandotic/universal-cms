# Upgrade a Site to a New Universal CMS Version

Upgrade a project using `@pandotic/universal-cms` to the latest version.

## Pre-flight

1. Check the current CMS version in the project's `package.json`.
2. Check the latest available version: `pnpm view @pandotic/universal-cms version`.
3. Read the changelog for breaking changes between current and target versions.

## Steps

### 1. Update the Package
```bash
pnpm update @pandotic/universal-cms
```

### 2. Check for Breaking Changes
- Review the CHANGELOG.md in the universal-cms repo.
- Look for any renamed exports, changed function signatures, or removed modules.
- If there are breaking changes, apply the migration steps listed in the changelog.

### 3. Run Type Check
```bash
pnpm typecheck
```
- Fix any type errors introduced by the update.
- Common issues: renamed types, new required config fields, changed function parameters.

### 4. Run Migrations (if new modules were added)
- Check if any new migrations are required:
  ```typescript
  import { getRequiredMigrations } from "@pandotic/universal-cms/config";
  ```
- Run any new SQL migrations against the Supabase instance.

### 5. Review Config
- Check if `CmsConfig` has new required fields.
- Update `src/cms.config.ts` if needed.

### 6. Test
- Run `pnpm dev` and verify the admin panel loads.
- Test any modules that were affected by the update.
- Check the health endpoint: `GET /api/admin/health`.

### 7. Update Lock File
```bash
pnpm install
```
- Commit the updated `pnpm-lock.yaml`.

## Version Pinning
- By default, projects pin to a specific minor version via `pnpm-lock.yaml`.
- New modules added in newer versions do NOT auto-deploy — they require explicit opt-in in `cms.config.ts`.
- To pin to exact version: use `"@pandotic/universal-cms": "0.2.0"` (no caret).
