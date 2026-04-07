# Universal CMS Upgrade Guide

## Version Policy

- **Patch versions** (0.1.x): Bug fixes, no breaking changes.
- **Minor versions** (0.x.0): New modules, features, non-breaking enhancements.
- **Major versions** (x.0.0): Breaking changes to APIs, config, or module interfaces.

New modules added in minor versions do **not** auto-deploy. You must explicitly enable them in your `cms.config.ts`.

## Upgrading

### 1. Update the package

```bash
pnpm update @pandotic/universal-cms
```

### 2. Check for breaking changes

Review the [CHANGELOG](./CHANGELOG.md) for your current version through the target version.

### 3. Run type check

```bash
pnpm typecheck
```

Fix any type errors — the compiler will catch renamed exports, new required fields, etc.

### 4. Run new migrations

If the update includes new modules you want to enable:

```typescript
import { getRequiredMigrations } from "@pandotic/universal-cms/config";
import { cmsConfig } from "./cms.config";

const migrations = getRequiredMigrations(cmsConfig);
// Run any new migration SQL files against your Supabase instance
```

### 5. Verify

```bash
pnpm dev
# Visit /api/admin/health to confirm version and module status
```

## Enabling New Modules

After upgrading to a version that includes a new module:

1. Set the module to `true` in your `cms.config.ts` modules record.
2. Run the module's migration SQL.
3. Add the admin page and API route (use the template as reference).
4. Add navigation entry to `adminNav`.

## Pinning Versions

To prevent automatic minor version bumps:

```json
{
  "@pandotic/universal-cms": "0.2.0"
}
```

Without a caret (`^`), pnpm will not upgrade beyond the exact version.

## Migration from ESGSource

If migrating from the original `dangolden/esgsource` codebase:

1. Install `@pandotic/universal-cms` in your project.
2. Replace direct imports from `@/lib/data/*` with `@pandotic/universal-cms/data/*`.
3. Replace direct imports from `@/lib/security/*` with `@pandotic/universal-cms/security`.
4. Update Supabase client calls — all data functions now take `client: SupabaseClient` as the first parameter (dependency injection).
5. Replace any direct config references with `useCmsConfig()` in components.
6. Run `pnpm typecheck` to catch remaining import issues.
