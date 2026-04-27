# Universal CMS — Project Context for Claude

## ⚡ Resume Point — Phase 3 + Phase 4 reconciles shipped (Apr 27, 2026)

Three PRs landed this session, all on the same drift theme — Hub-side
features (types/data/UI) had been built across earlier branches but the
backing migrations were marked applied via `migration repair` without
actually running on the live Hub DB.

| PR | Title | What shipped |
|---|---|---|
| #81 | team-hub dedupe + /skills reconcile | Partial unique indexes on issues/todos for `status='open'` (`00518`); 23505 toast handling in DumpModal; `00519` reconcile that finally adds `hub_skills.scope` + `manifest_id` + `content_path` + `component_ids` and creates `hub_skill_versions`. |
| #84 | phase 3 agent workflows reconcile | `00520` idempotent reconcile for `hub_agents` + `hub_agent_runs` (enum→text conversion via `information_schema` detection, with explicit `DROP DEFAULT` / `SET DEFAULT 'pending'::text` and exception-swallowing `DROP TYPE` to handle the enum-default dependency trap). 14 data layer tests. |
| #85 | phase 4 social content reconcile | `00521` consolidates four source migrations (00105 base, 00106 trigger, 00111 voice modeling + visual identity, 00112 `hub_social_content` → `hub_content_pipeline` rename). 15 data layer tests. |

**Test count**: 66 → 98 in `cms-core`.

**Live Hub DB state**: PRs #81 + #84 had their SQL applied during the
session (took 3 iterations on `00520` to handle the enum-default trap).
**`00521` from PR #85 has NOT been applied yet** — paste it into the
Supabase SQL editor before the Phase 4 UI is exercised.

### Drift pattern playbook

If any other below-500 migration is suspected to be in the same state
(marked applied via repair, not actually run), the recipe is:

1. Forward-only idempotent migration in the 005xx series.
2. `CREATE TABLE IF NOT EXISTS` with target (post-final-migration) column types.
3. `ADD COLUMN IF NOT EXISTS` for every column added by intermediate migrations.
4. For enum→text conversions: detect via
   `information_schema.columns WHERE data_type = 'USER-DEFINED'`,
   unconditionally `DROP DEFAULT` if the column has one, `ALTER TYPE`,
   then `SET DEFAULT 'value'::text` with explicit cast.
5. `DROP TYPE` wrapped in
   `EXCEPTION WHEN undefined_object OR dependent_objects_still_exist THEN NULL`
   so zombies don't abort the rest of the migration.
6. `DROP POLICY IF EXISTS` for both old and new policy names before
   `CREATE POLICY` (handles renames).

---

## ⚡ Resume Point — Team Hub dedupe + /skills reconcile (Apr 22, 2026)

**PR #81** (branch `claude/fix-issues-dark-mode-Xs1md`) fixes the two bugs
flagged that morning:

- **Team Hub duplicate issues.** New migration `00518_team_hub_unique_open.sql`
  adds partial unique indexes on `issues` / `todos` keyed to
  `(lower(btrim(title/description)), submitter_id/owner_id) WHERE status='open'`.
  Resolved / dropped rows don't block reopens. Hooks catch Postgres 23505
  and surface "Already on the open list" info toasts instead of silently
  failing.
- **`/skills` console error.** Root cause was schema drift —
  `00107_hub_skill_versions.sql` was marked applied via `migration repair`
  but never actually ran against the live Hub DB, so `hub_skills` was
  missing `scope` / `manifest_id` / `content_path` / `component_ids` and
  the `hub_skill_versions` table didn't exist. `listSkills()` filtered on
  a non-existent column → 500. Forward-only idempotent reconcile in
  `00519_hub_skills_scope_reconcile.sql`.
- **SQL applied** to the Hub project (`rimbgolutrxpmwsoswhq`) via the
  Supabase SQL editor — dedupe + both migrations ran cleanly.

### Outstanding from this session — Branch backlog

Only **`claude/improve-website-ux-f77go`** remains as a real cleanup
candidate (pandotic-site typography tweaks, noted in the Apr 21 session
wrap below). The other branches I initially flagged
(`pandotic-team-hub-KMsMW`, `add-error-logging-8u1mK`,
`plan-skill-onboarding-8drJN`) were all already archived via PR #75 +
superseders — see the "Archive branches" section below. Updated plan at
**`docs/plans/2026-04-22-branch-backlog-cleanup.md`**.

### Smoke tests still to do manually

- Submit the same issue twice rapidly in `/team-hub` → second submit
  should show "Already on the open issues list" and not create a twin row.
- `/skills` → no console error; "Sync Manifest" populates rows with
  `scope='fleet'` and `manifest_id` set.

---

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

## Phases 3 & 4 — Shipped Apr 27, 2026

### Phase 3: Agent Workflows ✅
Per-property automated tasks (SEO audit, broken links, dependency
updates, etc.). Hub stores definitions + run history; external runners
execute and report back via `/api/webhooks/agent-run`. Shipped via
PR #84 (`00520_hub_agents_idempotent.sql` applied to live Hub DB).
- Tables: `hub_agents`, `hub_agent_runs`
- Types/data: `cms-core/src/types/agent.ts`, `cms-core/src/data/hub-agents.ts`
- API: `/api/agents`, `/api/agents/[id]`, `/api/agents/[id]/runs`, `/api/webhooks/agent-run`
- UI: `/agents`, `/agents/[id]`, `/properties/[slug]/agents`

### Phase 4: Social Content ✅
Brand voice briefs + multi-channel content pipeline per property.
Shipped via PR #85 — but **`00521_hub_social_idempotent.sql` not yet
applied to live Hub DB**, run it via the Supabase SQL editor before
exercising the `/social` UI.
- Tables: `hub_brand_voice_briefs`, `hub_content_pipeline` (renamed from `hub_social_content`)
- Types/data: `cms-core/src/types/social.ts`, `cms-core/src/data/hub-social.ts`
- API: `/api/social/briefs`, `/api/social/content`, `/api/social/generate`, `/api/social/stats`
- UI: `/social`, `/social/content`, `/social/brand-voice`, `/social/generate`

## PMF Evaluator Micro-App Integration (Future)
The PMF Evaluator (standalone Next.js 16 app on Netlify) will be embedded in the Hub via iframe at `/tools/pmf-evaluator`. Communication via `window.postMessage`. Separate Netlify deployment, independent deploy cycles. See conversation history for full integration spec.

## Build & Test Commands
```bash
pnpm --filter @pandotic/universal-cms build    # Build cms-core
pnpm --filter @pandotic/fleet-dashboard build  # Build fleet-dashboard
pnpm test                                       # Run all tests (43 in cms-core)
```
