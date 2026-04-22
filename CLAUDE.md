# Universal CMS — Project Context for Claude

## Session wrap — Hub bug fixes + template build repair (Apr 21, 2026)

Five PRs shipped this session, starting from a user report that
`pandhub.netlify.app` crashed on every page with
"No QueryClient set, use QueryClientProvider to set one".

### What shipped

| PR | Title | Summary |
|---|---|---|
| #73 | fix(hub): lift QueryClientProvider to root layout | Sidebar calls `useTeamUser` (react-query) at the root, but the provider was scoped to `/team-hub/layout.tsx`. Every non-team-hub page crashed. Fix: new `src/app/providers.tsx` wraps `NavShell` in the root layout; `team-hub/layout.tsx` simplified. |
| #74 | fix(template): unblock compilation after chunks 3+4 port | Admin port into cms-core stripped `"use client"` from bundled output. Extended the post-build patcher to tag `dist/components/admin/index.js` and `dist/components/theme/index.js`; split `components/theme` into client (`./components/theme`) + server (`./components/theme/server`) so `ThemeInjector` (an async Server Component) lives separately from `ThemeProvider`/`ThemeToggle`. Bumped template's `@supabase/supabase-js` to `^2.102.1` to match cms-core; excluded the broken-since-inception `template/admin-integrated/` from typecheck. |
| #75 | feat(team-hub): auto-built Fleet review agenda + initiatives model | Rebased the long-lived Phase 2 Team Hub branch. New `hub_initiatives` entity (migration `00517`), `/initiatives` admin pages, `FleetReviewSection` replacing the old Command Center placeholder, pure-function flag derivation in `cms-core/src/data/hub-fleet-review.ts`. Sidebar gains an "Initiatives" link (founders only). |
| #78 | chore + fix(template): delete admin-integrated demo, validate ErrorSeverity route params | Deleted the broken-since-inception `template/admin-integrated/` demo (all its panels live in fleet-dashboard anyway) and fixed the pre-existing `ErrorSeverity`/`ErrorCategory` type coercion in `template/src/app/api/admin/errors/route.ts` using the fleet-dashboard VALID_* + `.includes()` pattern. Template build now typechecks clean. |
| #69 | feat(cms): add company profiles, media-meta overlay, display options, videos | Not opened this session — fixed the `ai-context-drift` CI failure by merging main into the branch and regenerating `AI_CONTEXT.md` + `llms-full.txt` via `pnpm ai-context`. |

### Live state after this session

- `pandhub.netlify.app` loads without the QueryClient error.
- `cms-core` builds cleanly; 66/66 tests pass.
- `template/` compile + typecheck both clean.
- Sidebar now gates both `/team-hub` and `/initiatives` to founders.


## Outstanding Work

### Manual ops to run (PR #75 aftermath)

1. **Apply migration `00517_team_hub_initiatives.sql`** to the Hub Supabase
   project (`rimbgolutrxpmwsoswhq`):
   ```bash
   cd /Users/dangolden/Documents/Github/universal-cms
   git pull origin main
   supabase db push --linked
   ```
2. **Seed initiatives.** Paste
   `packages/fleet-dashboard/supabase/seed-initiatives.sql` into
   https://supabase.com/dashboard/project/rimbgolutrxpmwsoswhq/sql/new and
   run. Idempotent — seeds the 6 original agenda items (ASU GSV, Gaia,
   CJ/McLeod, SCE, Burning Man, education vertical).
3. *(Optional)* dedupe existing team-hub issues/todos using the SQL block
   in `packages/fleet-dashboard/README.md`.

### Watch-for: Version Packages PR (carried over)

When PR #66 merged, the Release workflow should have opened a
"chore: version packages" PR bumping
`@pandotic/universal-cms` + `@pandotic/skill-library` based on pending
changesets. Check:
https://github.com/pandotic/universal-cms/pulls?q=is%3Apr+version+packages
Merging it publishes `0.2.0` to GitHub Packages and unblocks Stage 1 of
the 10-site rollout. Diagnostic in the Release workflow run logs
("Report changesets outputs" step). See `docs/RELEASE.md`
§ Troubleshooting.

### Founder sign-ins (carried over)

Allen / Matt / Scott each need to log into the Hub once so
`public.users.auth_user_id` populates. The `handle_new_user` trigger
does the rest. No SQL needed.

### Optional, documented

- **Granola pg_cron auto-sync** — runbook at `docs/GRANOLA-CRON.md`.
- **Migration history reconciliation** — runbook at
  `docs/MIGRATION-RECONCILIATION.md`. Trigger when Stage 2+ sites report
  drift or when we want to ship a publishable schema.

### Archive branches preserving deleted work

Three archive branches preserve the commit history of stale branches
already deleted via GitHub UI. They live at `refs/heads/archive/…` on
origin and are safe to leave alone indefinitely. If anything needs
restoring: `git checkout -b <original-name> archive/<original-name>`
and push.
- `archive/claude/pandotic-team-hub-KMsMW` (original content landed via
  the rebased Phase 2 branch that merged as PR #75).
- `archive/claude/add-error-logging-8u1mK` (original content superseded
  by PR #54, error-logging v2).
- `archive/claude/plan-skill-onboarding-8drJN` (original content —
  playbooks types, marketing-ops migrations, roadmap — all landed on
  main via later PRs; renames absorbed during chunk 2 renumbering).

### Remaining branches to triage

- `claude/improve-website-ux-f77go` (3+ days idle) — has ~147 LOC of
  pandotic-site typography tweaks distinct from PR #48. Rebase + PR if
  wanted, else delete.
- `claude/fix-issues-dark-mode-Xs1md` — parallel-session active work
  (team-hub dark-mode polish, skills schema reconcile). Leave alone;
  that session needs to rebase onto current main before PR.

### Unblocked — ready for Stage 1

Once the Version Packages PR merges and the initial publish succeeds,
Stage 1 greenfield pilot needs:
- A new empty repo.
- `.npmrc` in the consumer repo pointing at `https://npm.pkg.github.com`
  (snippet in `PUBLISHING.md` / `docs/RELEASE.md`).
- `NODE_AUTH_TOKEN` env var set locally + in Netlify.

---

## Local Development Environment

**Owner:** Dan Golden (`dangolden`)
**Local GitHub repos directory:** `/Users/dangolden/Documents/Github/`
**This repo locally:** `/Users/dangolden/Documents/Github/universal-cms/`

When providing terminal commands for the user to run locally, always use `/Users/dangolden/Documents/Github/` as the base path for git repos. Do NOT use `~/universal-cms` or `~/repos/` — those don't exist.

## Project Overview

Monorepo (`pnpm workspaces`) with three packages:

- **`packages/cms-core`** (`@pandotic/universal-cms`) — Publishable npm package. Universal CMS for Next.js + Supabase sites. Contains types, data functions, UI components, middleware, AI helpers. All data functions use client-injection pattern: `fn(supabase: SupabaseClient, ...args)`.
- **`packages/fleet-dashboard`** (`@pandotic/fleet-dashboard`) — **Pandotic Hub** — cross-property operations dashboard. Next.js 16 App Router, deployed on Netlify. Dark zinc theme, top-bar nav layout. Also hosts **Team Hub** at `/team-hub/*` (weekly ops meetings, issues, to-dos, Granola transcripts) — see `src/app/team-hub/`, `src/components/team-hub/`, `src/hooks/team-hub/`.
- **`template/`** — Starter template for new sites consuming `@pandotic/universal-cms`.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript 5.7+
- Supabase (auth + DB + RLS), `@supabase/ssr` for cookie-based auth
- Tailwind CSS v4, Radix UI primitives
- tsup for ESM-only builds with DTS generation (35+ entry points)
- Vitest for testing (43 tests in cms-core)

## Architecture

Three admin layers (per DASHBOARD.md):
1. **Marketing Website CMS** (per-site) — modules in cms-core
2. **App Admin** (per-app SaaS admin) — reusable modules in cms-core, extracted from HomeDoc
3. **Hub Dashboard** (Pandotic Hub) — cross-property mission control in fleet-dashboard

Hub has its own Supabase project (`rimbgolutrxpmwsoswhq` — "Pandotic Hub").

## Key Patterns

- **Subpath exports** with conditional resolution: `import` → `dist/`, `development` → `src/`
- **Client-injection**: Every data function takes `SupabaseClient` as first param — no global state
- **Hub migrations** use `00100_` prefix to avoid collision with per-site migrations (00001-00025)
- **RLS everywhere**: authenticated reads, role-based writes (super_admin, group_admin, member, viewer)

## Completed Phases

### Phase 1: Foundation (Auth + Property Registry + Property Linking) ✅
- Supabase auth in fleet-dashboard (middleware, login page, user-nav)
- Hub types in cms-core: `HubProperty`, `HubUser`, `HubActivityLogEntry`, `HubGroup`, etc.
- Hub data in cms-core: `data/hub-properties`, `data/hub-users`, `data/hub-activity`
- Hub auth middleware: `requireHubRole(client, request, allowedRoles)`
- Migrations: `00100_hub_properties`, `00102_hub_users`, `00103_hub_activity_log`
- Properties pages: `/properties`, `/properties/[slug]`
- Fleet status API reads from DB + `fleet.config.ts` fallback

### Phase 2: Groups & Access Control ✅
- Migration: `00101_hub_groups` — `hub_groups`, `hub_group_properties`, FK on `hub_user_group_access`
- RLS: group-scoped access (super_admin sees all, group members see their groups)
- Data: `data/hub-groups` — group CRUD, property-group assignments, user-group membership
- Pages: `/groups`, `/groups/[slug]` (with property/member management), `/users` (role editing)
- API routes: `/api/groups`, `/api/groups/[id]`, `/api/groups/[id]/properties`, `/api/groups/[id]/members`, `/api/users`
- Updated `listProperties` to filter by `groupId`

### Phase 1.5: App Admin from HomeDoc ✅
- Already extracted in a separate session

## Audit Results (April 10, 2026)

**Full audit completed** — see `AUDIT_REPORT.md` for comprehensive findings.

**Key Results:**
- ✅ All 43 tests passing
- ✅ Both packages build successfully (cms-core + fleet-dashboard)
- ✅ 4 SQL migrations verified as syntactically correct
- ✅ 51 package exports properly configured
- ✅ 10 API routes verified with proper auth checks
- ✅ All data functions follow client-injection pattern
- ✅ No critical security issues found

**Build Issue Fixed:**
- 🔴 Missing `lucide-react` dependency in fleet-dashboard → **Fixed and committed**
- The APICentral component imports 16 icons from lucide-react, but dependency was not declared

**Production Readiness:**
- Phases 1, 1.5, and 2 are **ready for production deployment**
- Supabase migrations need to be applied to Hub project (`rimbgolutrxpmwsoswhq`)
- All code follows established patterns and best practices

## Supabase Migrations — Applied ✅

All migrations have been applied to the Pandotic Hub Supabase project (`rimbgolutrxpmwsoswhq`):
1. `00100_hub_properties.sql` ✅
2. `00101_hub_groups.sql` ✅
3. `00102_hub_users.sql` ✅
4. `00103_hub_activity_log.sql` ✅
5. `00107_projects.sql` ✅ — `projects` + `project_sections` tables (dropped pre-existing empty `projects` table with wrong schema first)

## Pandotic Site (`apps/pandotic-site`)

- Separate Netlify site ("pandoticsite") with base directory `apps/pandotic-site`
- **Netlify build command in UI** may override `apps/pandotic-site/netlify.toml` — if deploys fail with "Module not found" for cms-core imports, check the Netlify UI build command matches the toml or is cleared
- The `package.json` `build` script includes `pnpm --filter @pandotic/universal-cms build` as a safeguard so cms-core is always built first regardless of what Netlify command runs
- The `netlify.toml` uses `--filter @pandotic/universal-cms build && --filter @pandotic/pandotic-site build` to build cms-core first

## Remaining Phases — TODO for Next Sessions

### Phase 3: Agent Workflows
Configure and monitor automated tasks (SEO audit, broken links, dependency updates) per property.

**Migration:** `00104_agents.sql`
- `hub_agents` table: id, name, slug, description, agent_type (enum: seo_audit, broken_links, dependency_update, custom), config (jsonb), enabled (boolean), schedule (cron expression text), property_id (FK to hub_properties), created_by (FK to hub_users), created_at, updated_at
- `hub_agent_runs` table: id, agent_id (FK to hub_agents), status (enum: pending, running, completed, failed, cancelled), started_at, completed_at, result (jsonb), error_message (text), triggered_by (enum: schedule, manual, webhook), property_id (FK), created_at
- Indexes on agent_id + created_at, property_id, status
- RLS: authenticated read all, super_admin/group_admin write

**Types:** `packages/cms-core/src/types/agent.ts`
- `AgentType` = "seo_audit" | "broken_links" | "dependency_update" | "content_freshness" | "ssl_monitor" | "custom"
- `AgentRunStatus` = "pending" | "running" | "completed" | "failed" | "cancelled"
- `AgentTrigger` = "schedule" | "manual" | "webhook"
- `HubAgent` interface: id, name, slug, description, agent_type, config, enabled, schedule, property_id, created_by, created_at, updated_at
- `HubAgentRun` interface: id, agent_id, status, started_at, completed_at, result, error_message, triggered_by, property_id, created_at

**Data:** `packages/cms-core/src/data/hub-agents.ts`
- `listAgents(client, filters?)` — filter by property_id, agent_type, enabled
- `getAgentById(client, id)`, `getAgentBySlug(client, slug)`
- `createAgent(client, agent)`, `updateAgent(client, id, updates)`, `deleteAgent(client, id)`
- `listAgentRuns(client, agentId, filters?)` — with pagination, status filter
- `createAgentRun(client, run)`, `updateAgentRun(client, id, updates)`
- `getLatestRun(client, agentId)`

**Pages in fleet-dashboard:**
- `/agents` — list all agents across properties, with status indicators (last run status, schedule, enabled/disabled)
- `/agents/[id]` — agent detail: config editor, run history, manual trigger button
- `/properties/[slug]/agents` — property-scoped agent list

**API routes:**
- `/api/agents` — GET (list), POST (create)
- `/api/agents/[id]` — GET, PUT, DELETE
- `/api/agents/[id]/runs` — GET (list runs), POST (trigger manual run)
- `/api/webhooks/agent-run` — POST (external executors report run status, authenticated via API key)

**Exports to add:**
- `packages/cms-core/package.json`: `"./types/agent"`, `"./data/hub-agents"`
- `packages/cms-core/tsup.config.ts`: matching entries

**Note:** Hub manages agent state only; actual execution happens in consuming projects or external runners.

### Phase 4: Social Content
Brand voice management and social content creation per property.

**Migration:** `00105_social_content.sql`
- `hub_brand_voice_briefs` table: id, property_id (FK to hub_properties), name, platform (text), tone (text[]), audience (text), key_messages (text[]), dos (text[]), donts (text[]), example_posts (jsonb), metadata (jsonb), created_by (FK to hub_users), created_at, updated_at
- `hub_social_content` table: id, property_id (FK), brief_id (FK to hub_brand_voice_briefs, nullable), platform (enum: twitter, linkedin, instagram, facebook, tiktok, youtube, other), content_type (enum: post, thread, story, reel, article), title (text), body (text), media_urls (text[]), hashtags (text[]), status (enum: draft, review, approved, published, archived), scheduled_for (timestamptz), published_at (timestamptz), metadata (jsonb), created_by (FK), created_at, updated_at
- Indexes on property_id, platform, status, brief_id
- RLS: authenticated read, super_admin/group_admin write

**Types:** `packages/cms-core/src/types/social.ts`
- `SocialPlatform` = "twitter" | "linkedin" | "instagram" | "facebook" | "tiktok" | "youtube" | "other"
- `SocialContentType` = "post" | "thread" | "story" | "reel" | "article"
- `SocialContentStatus` = "draft" | "review" | "approved" | "published" | "archived"
- `BrandVoiceBrief` interface
- `SocialContentItem` interface

**Data:** `packages/cms-core/src/data/hub-social.ts`
- Brief CRUD: `listBriefs`, `getBriefById`, `createBrief`, `updateBrief`, `deleteBrief`
- Content CRUD: `listSocialContent(client, filters?)`, `getSocialContentById`, `createSocialContent`, `updateSocialContent`, `deleteSocialContent`
- Filters: by property_id, platform, status, brief_id

**Pages in fleet-dashboard:**
- `/social` — overview dashboard: content counts by status, recent activity
- `/social/content` — content list with filters (platform, status), create/edit forms
- `/social/brand-voice` — list of brand voice briefs by property
- `/social/brand-voice/[propertySlug]` — edit brief for a specific property
- `/social/generate` — AI-assisted content generation (future, uses Claude API with brand voice brief as context)

**API routes:**
- `/api/social/briefs` — GET, POST
- `/api/social/briefs/[id]` — GET, PUT, DELETE
- `/api/social/content` — GET, POST
- `/api/social/content/[id]` — GET, PUT, DELETE

**Exports to add:**
- `packages/cms-core/package.json`: `"./types/social"`, `"./data/hub-social"`
- `packages/cms-core/tsup.config.ts`: matching entries

**Note:** No direct social media API posting; manual content management with future AI generation via Claude API.

## PMF Evaluator Micro-App Integration (Future)
The PMF Evaluator (standalone Next.js 16 app on Netlify) will be embedded in the Hub via iframe at `/tools/pmf-evaluator`. Communication via `window.postMessage`. Separate Netlify deployment, independent deploy cycles. See conversation history for full integration spec.

## Build & Test Commands
```bash
pnpm --filter @pandotic/universal-cms build    # Build cms-core
pnpm --filter @pandotic/fleet-dashboard build  # Build fleet-dashboard
pnpm test                                       # Run all tests (43 in cms-core)
```
