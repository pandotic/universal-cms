# @pandotic/universal-cms — Extraction Roadmap

## What's Done

- **Config types** (`src/config.ts`): All 31 `CmsModuleName` values, `CmsRole`, `CmsNavItem`, `CmsNavGroup`, `CmsConfig` interface, module-to-migration mapping, 4 module presets (`appMarketing`, `blog`, `directory`, `full`), and helper functions (`modulesFromPreset`, `isModuleEnabled`, `getRequiredMigrations`).
- **Security module** (`src/security/`): Rate limiting (`createRateLimiter`, pre-configured `authLimiter` and `adminApiLimiter`), environment variable validation (`validateEnv`, `validateEnvOrThrow`), CSP and security headers, and generic `validateBody` using Zod schemas.
- **Type definitions** (`src/types/`): Generic CMS types shared across all sites — `ContentPage`, `MediaItem`, `Review`, `SiteSetting`, `ActivityLogEntry`, `ErrorLogEntry`, `AnalyticsProviderConfig`, `EntityRatings`, `SourceMetrics`, and supporting union types.

## What Needs Extraction

### Data Layer (35+ files)

The data access files in `src/lib/data/` currently import the Supabase client directly:

```ts
// Current (site-coupled):
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function getAllContentPages(): Promise<ContentPage[]> {
  const supabase = await getSupabaseAdmin();
  // ...
}
```

Each file needs refactoring to accept the Supabase client as a parameter:

```ts
// Target (package-safe):
import type { SupabaseClient } from "@supabase/supabase-js";

export function getAllContentPages(supabase: SupabaseClient): Promise<ContentPage[]> {
  // ...
}
```

**Files requiring this refactoring:**

- `content-pages.ts` — CRUD for content pages
- `media.ts` — media library operations
- `reviews.ts` — review moderation and listing
- `site-settings.ts` — key/value site settings with caching
- `activity-log.ts` — activity log writes and queries
- `error-log.ts` — error log writes and queries
- `affiliates.ts` — affiliate link management
- `click-analytics.ts` — click tracking and analytics
- `categories.ts` — category CRUD
- `frameworks.ts` — framework CRUD
- `glossary.ts` — glossary term CRUD
- `certifications.ts` — certification CRUD
- `entities.ts` — directory entity CRUD and search
- `listicles.ts` — listicle management
- `seo-keywords.ts` — SEO keyword tracking
- `links.ts` — link checker and redirects
- `internal-links.ts` — internal link suggestions
- `forms.ts` — form builder and lead capture
- `cta-blocks.ts` — CTA block management
- `merchants.ts` — merchant management
- `ratings.ts` — third-party rating aggregation
- `career-hub.ts` — career/training content
- `bulk-import.ts` — CSV/JSON bulk import logic
- And additional helper/query files

### Admin Components

The admin UI components in `src/components/admin/` are currently hardcoded to ESGsource:

- Sidebar navigation references ESGsource branding and routes
- Dashboard widgets assume specific modules are enabled
- Form components use ESGsource-specific field configurations
- Layout components import site-specific config directly

**Refactoring plan:**
1. Accept `CmsConfig` as a prop or via React context
2. Make navigation dynamically driven by `config.adminNav`
3. Extract a `<CmsProvider config={...}>` wrapper component
4. Make all admin routes configurable via the config object

### Analytics Layer

The analytics integration (`src/lib/analytics/`) is mostly provider-agnostic already. Once the data layer refactoring is complete, these files can be extracted with minimal changes:

- Analytics event tracking
- Provider initialization (GA4, GTM, Meta Pixel, PostHog, Rybbit, etc.)
- Admin analytics dashboard data fetching

## Steps to Publish to npm

1. **Complete data layer refactoring** — client injection for all data access files
2. **Extract admin components** — make them configurable via `CmsConfig`
3. **Add build step** — configure `tsup` or `tsc` to produce ESM + CJS bundles with `.d.ts` files
4. **Add package exports map** — update `exports` field to point at `dist/` instead of `src/`
5. **Write tests** — unit tests for data functions, security utilities, and config helpers
6. **Add changesets** — configure `@changesets/cli` for versioning
7. **Publish** — `npm publish --access public` under the `@pandotic` scope
8. **CI pipeline** — GitHub Actions for lint, test, build, publish on tag

## How to Convert ESGsource to Use the Package

1. Install the package:
   ```bash
   npm install @pandotic/universal-cms
   ```

2. Replace local imports with package imports:
   ```ts
   // Before:
   import type { CmsConfig } from "@/lib/cms/cms.config";
   import { validateBody } from "@/lib/security/validation";

   // After:
   import type { CmsConfig } from "@pandotic/universal-cms/config";
   import { validateBody } from "@pandotic/universal-cms/security";
   ```

3. Keep site-specific config in `src/lib/cms/cms.config.ts` but import types from the package:
   ```ts
   import type { CmsConfig } from "@pandotic/universal-cms/config";

   export const cmsConfig: CmsConfig = {
     siteName: "ESGsource",
     // ... site-specific values
   };
   ```

4. Update data layer calls to pass the Supabase client:
   ```ts
   import { getAllContentPages } from "@pandotic/universal-cms/data/content";
   import { getSupabaseAdmin } from "@/lib/supabase/server";

   const supabase = await getSupabaseAdmin();
   const pages = await getAllContentPages(supabase);
   ```

---

## Hub Dashboard — Future Phases

> The App Admin foundation is complete (admin-core, admin-ui, admin-schema, apps/dashboard).
> These phases build out the full Hub vision from `DASHBOARD.md` incrementally.
> SQL schemas for all tables are already defined in DASHBOARD.md — copy into migrations when starting a phase.
> All hub tables use `hub_` prefix. Migrations start at `00100_` to avoid collision with per-site migrations.

### Phase A: Hub Properties (replaces `connected_apps`)

Migrate `connected_apps` to the richer `hub_properties` table.

- **Table**: `hub_properties` (DASHBOARD.md SQL: `00100_hub_properties`)
- **Adds over connected_apps**: `property_type` (site|app), `slug`, `preset`, `enabled_modules[]`, `status` (active/paused/archived/error), `ssl_valid`, `ssl_expires_at`, `last_deploy_at`, `metadata` jsonb
- **Dashboard**: new entity adapter, property detail page, property grid with type badges, migration script from connected_apps

### Phase B: Groups & Scoped Access

Organize properties into portfolios for B2B clients and internal teams.

- **Tables**: `hub_groups`, `hub_group_properties` (DASHBOARD.md SQL: `00101_hub_groups`)
- **Dashboard**: group management panel, group dashboard view, group-level aggregated stats

### Phase C: Hub Users & RBAC Upgrade

Hub-level roles (`super_admin`, `group_admin`, `member`, `viewer`) for multi-property access.

- **Tables**: `hub_users`, `hub_user_group_access` (DASHBOARD.md SQL: `00102_hub_users`)
- **Dashboard**: hub user management, group access assignment, RLS via user_group_access chain

### Phase D: Hub Activity Log

Cross-property activity tracking at the Hub level.

- **Table**: `hub_activity_log` (DASHBOARD.md SQL: `00103_hub_activity_log`)
- **Dashboard**: hub-wide activity feed, per-property activity, filter by user/property/group

### Phase E: Claude Agent Workflows

AI agents that run automated tasks (SEO audit, broken links, image optimization, dependency updates, etc.).

- **Tables**: `hub_agents`, `hub_agent_runs` (DASHBOARD.md SQL: `00104_agents`)
- **Dashboard**: agent management, run history, manual trigger, agent status on property cards
- **Note**: Hub manages state only; execution happens in consuming projects via edge functions/cron

### Phase F: Social Media Content & Briefs

Generate social content from published articles with brand voice consistency.

- **Tables**: `hub_brand_voice_briefs`, `hub_social_content` (DASHBOARD.md SQL: `00105_social_content`)
- **Dashboard**: brand voice editor, content generator, content calendar, content list
- **Note**: No direct API posting — content for copy/paste into Buffer, Hootsuite, or native platforms

### Phase G: AppConfig Module System

Parallel to CmsConfig — a module system for SaaS app admin (userManagement, subscriptions, billing, notifications, featureFlags, supportTickets, appAnalytics, dataExport, webhooks, apiKeys).

### Phase H: Cross-Property Analytics & Integration

`PropertyDataFetcher` interface, webhook events (deploy, health, errors), package exports under `@pandotic/universal-cms/types/hub`, `/data/hub`, `/components/hub`.

### Starting a New Phase

1. Read this section and `DASHBOARD.md` for full context (SQL schemas are ready to copy)
2. Create migrations in `apps/dashboard/supabase/migrations/`
3. Create entity adapters in `apps/dashboard/src/adapters/` (follow `connectedApp.ts` pattern)
4. Add tabs/pages to the dashboard
5. Build admin-core services if needed (parameterized Supabase client pattern)

---

## Migration CLI Tool

Planned CLI commands for project scaffolding and migration management:

### `npx universal-cms init`

Interactive setup wizard:
- Choose a module preset (appMarketing, blog, directory, full) or custom
- Generate `cms.config.ts` with selected modules
- Copy required SQL migrations to `supabase/migrations/`
- Create starter admin layout and routes

### `npx universal-cms add <module>`

Add a module to an existing project:
- Validate the module name against `CmsModuleName`
- Copy any required migrations not already present
- Update `cms.config.ts` to enable the module
- Print next steps (e.g., "Run `supabase db push` to apply migrations")

### `npx universal-cms sync-migrations`

Sync migration files with the package version:
- Compare local migrations against package migrations
- Show diff of any changed files
- Copy new/updated migrations with confirmation
- Never delete local migrations

### `npx universal-cms check`

Validate a project's configuration:
- Verify all enabled modules have their required migrations
- Check environment variables are set
- Validate `cms.config.ts` against the `CmsConfig` schema
- Report any missing dependencies
