# Universal CMS — Project Context for Claude

## 🧭 Queued — Native iOS/Android app architecture (critical, not started)

End-user native apps per consuming site. Runtime is Expo (RN + expo-router);
Capacitor noted only as fallback. Full design lives at
**`docs/plans/2026-05-04-native-app-architecture.md`** — Phases 0–4, ~3–4
weeks, branch `claude/native-app-architecture-g9Mhn` (created but no commits
yet). Pilot is `apps/pandotic-app` against `apps/pandotic-site`.

Scope locked during planning:
- Identity table is **pluggable per site** via
  `cmsConfig.nativeApp.identityTable` (`'profiles'` to extend the admin role
  enum, or `'app_users'` to keep end users in a separate table). Pilot uses
  `'app_users'`.
- Monetization is **entitlements + Stripe webhook only** — IAP /
  RevenueCat / `expo-iap` deferred until a customer needs digital goods. The
  `app_entitlements` table is provider-agnostic so the IAP switch is later
  config, not refactor.
- Foundations land in `template/`: `/api/v1/*` namespace, dual-mode
  (Bearer-or-cookie) auth resolver in cms-core, CORS helper, three new
  migrations (`00042_app_users.sql`, `00043_device_tokens.sql`,
  `00044_app_entitlements.sql`), and a `react-native` conditional export in
  cms-core.
- New publishable package `@pandotic/cms-client` (RN-safe HTTP client,
  ESM+CJS, ships through the existing Changeset pipeline).

Treat this as the next major architectural project after current
stabilization items clear. Do NOT start work until explicitly resumed.

---

## ⚡ Resume Point — Skill library blank-page fix (Apr 29, 2026)

**PR #92** (branch `claude/fix-skill-library-display-mxyCB`, merged) makes
the `/skills` "Sync Manifest" button actually populate the table on the
deployed Hub. Two compounding bugs:

- **Manifest JSON wasn't bundled.** `manifest-sync.ts` located
  `skills-manifest.json` via filesystem walking from `import.meta.url`.
  Next.js doesn't trace that JSON into the serverless bundle, so
  `loadSkillsManifest()` returned `[]` on Netlify and the sync wrote 0
  rows. Worked fine in dev (source files reachable), silently no-op'd
  in prod. Fix: replace the FS walk with static
  `import skillsManifestData from "../../skills-manifest.json"` —
  esbuild/webpack inline the data into the chunk. Verified: built
  `dist/chunk-*.js` now contains all 24 manifest entries.
- **Sync errors were swallowed.** The page's `syncManifest` had
  `catch { /* silent */ }` and never inspected the response, so a 0-row
  result looked identical to a successful sync. Fix: surface
  `created/updated/unchanged` counts in an emerald banner on success and
  the error message in a red banner on failure. Empty-manifest case
  gets an explicit "check that skills-manifest.json is bundled" hint.

`getPackageRoot` / `getSkillContent` are kept for SKILL.md content
hashing — sync still creates rows when content is missing (hash falls
back to `""`).

This resolves the "/skills smoke test" entry that was outstanding from
the Apr 22 session wrap.

---

## ⚡ Resume Point — Stabilization handoff (Apr 23, 2026)

PR #87 merged the platform stabilization tail end (preset picker +
`00521_api_central_bridge.sql` + empty `SKIP_MIGRATIONS`). Four concrete items
remain on the original "stabilize and harden the platform" plan, fully scoped
in **`docs/plans/2026-04-23-stabilization-handoff.md`**:

1. **P1.8 — Stage 1 publish unblock** (gated on user toggling a GitHub repo
   setting per `docs/RELEASE.md`). Until this happens, P2.11 has nothing to
   install.
2. P2.10e — GitHub OAuth flow (~1 day; replace PAT paste + new
   `00523_user_github_tokens.sql`).
3. P2.10f — Richer repo auto-detect (~0.5 day; sniff `cms.config.ts` and
   default the preset picker).
4. P2.11 — CMS Deploy Wizard at `/fleet/deploy` (~1.5 days; depends on Items
   1+2+3).

Suggested order: Item 3 → Item 2 → Item 4. P1.8 is human-gated and lives
outside this critical path.

(The 00521 collision rename — `00521_hub_social_idempotent.sql` →
`00522_hub_social_idempotent.sql` — was completed during repo hygiene cleanup,
along with the parallel `template/` `00025` collision which was renamed to
`00027_api_usage_tracking.sql`.)

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
- ~~`/skills` → no console error; "Sync Manifest" populates rows.~~
  ✅ Resolved by PR #92 (Apr 29). User confirmed sync now populates the
  grid; 24 skills visible.

---

## Session wrap — Platform stabilization + Phase 3 marketing skills (Apr 22, 2026)

Shipped as **PR #83** (merged) + its CI followup in **PR #84**.
8 commits total covering platform stabilization, Phase 3 marketing
skills, and CI hardening — kicked off from a user request for a
stabilization plan, worked phase-by-phase with a QA step after each.

### What shipped

| Commits | Theme | Notes |
|---|---|---|
| `bf50278` | P0 stabilization | `template/sitemap.ts` → `force-dynamic` + env guard. CI gained fleet-dashboard + template build coverage. Deleted stale `packages/api-central/` duplicate. README stopped referencing deleted `admin-core`/`admin-ui` packages. Added root `build:all` + `verify` scripts. |
| `9d1b3e5` | P1 hardening | `scripts/validate-migrations.sh` + CI postgres-service job — cold-applies all 30 hub migrations. Surfaced 3 real bugs along the way: 00112 invalid `ALTER FUNCTION IF EXISTS` syntax (wrapped in DO block); 00112 + 00116 dropped enum types without dropping column defaults (DROP DEFAULT before DROP TYPE). New Playwright smoke harness for the Hub exercising the missing-config redirect flow. Surfaced + fixed `useTeamUser` SSR crash. |
| `d4ff115` → `9fac61c` | Marketing Ops Phase 3 (4 commits) | Skeptical Reviewer, Long-Form Writer, Repurposing Specialist skills + helpers + `register-marketing-agents.ts`. All 5 Phase 3 skills now registered. |
| `150d234` | CI fix | Reordered validate job to build before typecheck (downstream subpaths resolve via `dist/`). Added 6GB heap to e2e's pnpm build step. |
| PR #84 (`150212c`, `13fe5ae`) | 00116 followup | Parallel session iterated further on the hub_agent_runs enum→text conversion — unconditional DROP DEFAULT + SET DEFAULT 'pending'::text + DROP TYPE wrapped in exception handler. |

### Live state after this session

- cms-core tests 66/66 pass.
- Full workspace typechecks clean (`pnpm -r typecheck`).
- `pnpm build:all` from a cleaned dist completes end-to-end.
- CI jobs: `validate` × 2 node versions, `migrations` (cold-applies 30),
  `e2e` (Playwright smokes), `ai-context-drift`.
- 3 new marketing skills live in `packages/skill-library/skills/marketing-*`.

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

### Phase 3 marketing skills — validation sequence (unblocked)

All 5 skills shipped via PR #83. To validate end-to-end on SPEED:

1. **Manual prereq** — seed SPEED's brand voice brief (SQL or Hub UI).
   Every content-producing skill refuses without one.
2. Run `pnpm --filter @pandotic/fleet-dashboard register-marketing-agents`
   once to upsert `hub_agents` rows for SPEED covering all 5 skills.
3. Validation flow: `/build-brand-profile speed` →
   `/marketing-plan speed` →
   `/write-longform speed --topic "…" --keyword "…"` →
   `/skeptical-review {id}` → UI approve → `/repurpose {id}` →
   `/skeptical-review` each child.
4. Success criterion: steps 3–4 complete without manual SQL fixups.

### Stabilization followups (next session)

- **P1.8 — Stage 1 publish unblock.** Flip the "Allow GitHub Actions to
  create and approve pull requests" repo setting per `docs/RELEASE.md`
  § Pre-flight. Gated on user action.
- **P2.10 — Hub Phase 3e–g onboarding** per
  `docs/FLEET_DASHBOARD_ROADMAP.md`: GitHub OAuth (replace PAT paste),
  repo auto-detect, module preset picker.
- **P2.11 — Phase 4 CMS Deploy Wizard** (`/fleet/deploy`).
- **Migration cold-apply tech debt.** 00502 / 00504 / 00508 allowlisted
  in `scripts/validate-migrations.sh` under `SKIP_MIGRATIONS`. Production
  unaffected; fix requires splitting RLS policies into post-table
  migrations.

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
   run.

### Hub `schema_migrations` tracker drift — RESOLVED (May 4, 2026)

Reconciled via `INSERT … ON CONFLICT DO NOTHING` against
`supabase_migrations.schema_migrations` on project `rimbgolutrxpmwsoswhq`.
All six missing versions (`00517`–`00522`) now registered. Database
state was verified ahead of the insert — every migration's representative
objects (tables, columns, indexes, status type) confirmed present, so the
empty `statements` arrays accurately reflect "applied out-of-band via SQL
editor." `supabase db push --linked` / `db pull --linked` should now
proceed without the "remote versions not found" error.

Plan doc retained at `docs/plans/2026-04-30-migration-tracker-reconcile.md`
for reference if the same drift pattern reappears.

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

Two archive branches preserve the commit history of stale branches
already deleted via GitHub UI. They live at `refs/heads/archive/…` on
origin and are safe to leave alone indefinitely. If anything needs
restoring: `git checkout -b <original-name> archive/<original-name>`
and push.
- `archive/claude/pandotic-team-hub-KMsMW` (original content landed via
  the rebased Phase 2 branch that merged as PR #75).
- `archive/claude/add-error-logging-8u1mK` (original content superseded
  by PR #54, error-logging v2).

Note: `claude/plan-skill-onboarding-8drJN`, `claude/platform-stabilization-plan-bzGVS`,
and `claude/fix-repo-loading-multiselect-ov3rU` were deleted directly via the
GitHub UI (Apr 29) without archive refs — content of all three was already on
main before deletion.

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
