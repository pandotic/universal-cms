# Universal CMS — Project Context for Claude

## ⚡ Resume Point — Team Hub port (as of April 20, 2026, session close)

**Team Hub merged into Pandotic Hub** as `/team-hub/*` route tree. Branch
`claude/pandotic-team-hub-KMsMW` is ready to PR and merge. Full plan at
`/root/.claude/plans/pandotic-team-hub-glowing-robin.md`.

### What landed on the branch (4 commits)

- `742075b` — magic-link auth + DumpModal owner/due_date fix + attendees on
  past meetings + sidebar entry (pre-port).
- `6e5f46f` — **full port** of `packages/team-hub` → `packages/fleet-dashboard`:
  - Routes at `app/team-hub/{page.tsx, issues, todos, meetings, meetings/[id]}`.
  - Components under `components/team-hub/{dump, issues, meeting, todos, ui}`.
  - Hooks under `hooks/team-hub/` — `useAuth` replaced with `useTeamUser`
    that reads the Hub's existing Supabase session.
  - Migrations renumbered `00120_team_hub_initial.sql` through
    `00123_team_hub_auth.sql`. Idempotent (IF NOT EXISTS / OR REPLACE /
    ON CONFLICT DO NOTHING). Auth trigger softened — non-@pandotic sign-ups
    no longer hard-rejected; they just don't get a `users` row.
  - Edge functions `dump-classify`, `process-transcript`, `fetch-granola`
    moved to `packages/fleet-dashboard/supabase/functions/`.
  - Theme scoped via `[data-team-hub].dark` so team-hub CSS vars don't leak.
  - TanStack Query provider scoped to `app/team-hub/layout.tsx`.
  - `packages/team-hub/` directory deleted.
- `978d507` — drop deleted team-hub entries from pnpm-lock.
- `881df9a` — cast QueryClientProvider to bypass @tanstack/react-query v5 +
  @types/react 19 children typing mismatch (see
  https://github.com/TanStack/query/issues/6444). Netlify build now green.

### Ops already done on Hub Supabase (`rimbgolutrxpmwsoswhq`)

- ✅ `supabase migration repair --status applied 00105…00117, 00500…00502`
  to unblock the CLI past the pre-existing drift (20+ Hub migrations were
  applied manually / via dashboard and never recorded in
  `supabase_migrations.schema_migrations`).
- ✅ `supabase db push` — team-hub migrations `00120–00123` now applied.
- ✅ `supabase functions deploy dump-classify process-transcript fetch-granola`.
- ✅ `ANTHROPIC_API_KEY` secret confirmed present.

### 🚨 Ops still to do (after merging this PR)

1. **Seed the original agenda.** Paste
   `packages/fleet-dashboard/supabase/seed-team-hub.sql` into
   https://supabase.com/dashboard/project/rimbgolutrxpmwsoswhq/sql/new
   and run. Idempotent (`ON CONFLICT DO NOTHING`).
2. **Back-fill `auth_user_id` on the 4 founders.** The `handle_new_user`
   trigger only fires on *new* Supabase sign-ups. Allen/Matt/Dan/Scott
   presumably already signed into the Hub pre-migration, so their
   `auth_user_id` is still NULL until we run this once in the SQL editor:
   ```sql
   UPDATE public.users u
      SET auth_user_id = a.id
     FROM auth.users a
    WHERE LOWER(u.email) = LOWER(a.email)
      AND u.auth_user_id IS NULL;
   ```
   Without this, `/team-hub` shows the "Team Hub is for founders" panel to
   the actual founders because `useTeamUser` can't resolve their row.
3. **Smoke test** `/team-hub` in the browser:
   - Agenda loads with the seed items.
   - Dump bar Cmd-K → "Dan: prep Burning Man demo" → lands on Dan.
   - Resolving an issue writes `completed_by` correctly.
   - `/team-hub/meetings/[id]` renders archived meetings.
   - Non-founder Hub users see the access-denied panel (tested by signing
     in as any `@pandotic-site.com` or other non-founder email, if any exist).

### Follow-ups worth picking up in a future session (not blocking)

- **Granola auto-sync.** `fetch-granola` is manual-trigger today. Schedule it
  via Supabase pg_cron so transcripts show up on `/team-hub/meetings/[id]`
  without a click.
- **Meeting summary on past-meetings list.** `/team-hub/meetings` shows
  date + chair + rating + counts. The AI extraction writes a summary per
  meeting; surface the first sentence as a one-liner on each row.
- **Hide sidebar "Team Hub" entry for non-founders.** Cheap UX win —
  gate in `app/nav/sidebar.tsx` by checking whether the user has a
  `public.users` row (via a small server-side helper).
- **Migration history cleanup.** The Hub Supabase project has 20+ migrations
  applied manually that were repaired as "applied" to unblock this work.
  At some point, reconcile the history table with the actual schema — run
  `supabase db pull` against a staging copy, diff against the committed
  migrations, either delete stale migration files or capture the true
  schema as a new baseline.
- **Pre-existing fleet-dashboard build blockers.** `src/app/{groups,users,
  properties}/page.tsx`, `src/lib/adapters/*`, and `src/lib/middleware/
  admin-rbac.ts` still import from `@universal-cms/admin-core` and
  `@universal-cms/admin-ui` — vestigial deps flagged back in PR #39. They
  only build because Netlify builds those workspace packages first. If
  someone removes those packages, these consumers break. Decide: either
  port the references into cms-core or formally keep admin-core/admin-ui
  alive.

---

## ⚡ Older Resume Point — Stage 0 of 10-site rollout (April 17, 2026)

**Stage 0 of the 10-site rollout is DONE and merged to main** (PR #39, commit
`ec94847`). Full plan lives at
`/root/.claude/plans/i-need-to-start-hazy-quokka.md`.

### What landed in PR #39 (`feat(stage-0): idempotent migrations + GH Packages publish wiring`)

- All 27 `template/supabase/migrations/*.sql` are now idempotent (IF NOT EXISTS
  / DROP-IF-EXISTS+CREATE / ON CONFLICT). Safe to apply to a DB that already
  has overlapping schema.
- `hub-admin` + `types/admin` added to `@pandotic/universal-cms` exports in both
  `package.json` and `tsup.config.ts`.
- Removed vestigial `@universal-cms/admin-core` and `@universal-cms/admin-ui`
  workspace deps from `cms-core` (zero actual imports; would've broken external
  `pnpm install`).
- `publishConfig` points `@pandotic/universal-cms` at
  `https://npm.pkg.github.com` with `access: restricted`.
- `.github/workflows/release.yml` rewired to target GitHub Packages using the
  built-in `GITHUB_TOKEN` (no extra secrets).
- New `packages/cms-core/README.md` for external consumers.
- New `PUBLISHING.md` covering publish flow + per-consumer `.npmrc` +
  `NODE_AUTH_TOKEN` setup (local / Netlify / Actions).
- `packages/fleet-dashboard/.env.example` completed (SERVICE_ROLE_KEY,
  APP_PASSWORD, optional AGENT_WEBHOOK_SECRET / ANTHROPIC_API_KEY / GitHub OAuth).

### 🚨 Unresolved at session close — check FIRST next session

1. **Release workflow did not open a "Version Packages" PR.** After merging
   PR #39, the changesets action should have opened a PR bumping
   `@pandotic/universal-cms` based on `.changeset/initial-release.md`. As of
   session close, no such PR exists. Investigate at
   https://github.com/pandotic/universal-cms/actions/workflows/release.yml —
   look for errors about `packages: write` permission, changesets action
   failures, or GITHUB_TOKEN / NODE_AUTH_TOKEN auth. Fix before anything else
   can move forward.

2. **Parallel-session PRs #40 and #41 both introduce migration `00110_*.sql`**
   — they will collide. Needs renumbering on one of them before either merges.
   - PR #40 `claude/plan-skill-onboarding-8drJN` — 00110–00117 + cms-core data
   - PR #41 `claude/redesign-navigation-saas-B7hZT` — 00110_playbooks.sql

### When publish is unblocked → Stage 1

1. Publish `@pandotic/universal-cms@0.1.0` to GitHub Packages (fix step 1 above,
   merge the Version Packages PR).
2. Stage 1 greenfield pilot — new empty repo consuming the package. A ready-to-
   paste prompt for the new site's Claude Code session is in the chat
   transcript of this session (asks that session to scaffold Next.js 16 +
   `.npmrc` + `.env.example` + `src/cms.config.ts` + `src/middleware.ts` stubs,
   leave `supabase/migrations/` empty for us to fill, don't install the
   package until it's published).
3. Register pilot in Hub via `/properties` → Create; verify version sync at
   `/fleet`.
4. Only then proceed to Stage 2 (first of the 10 production sites).

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
