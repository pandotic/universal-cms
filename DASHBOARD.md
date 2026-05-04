# Dashboard & Hub Architecture

This document describes the **current** architecture of the Universal CMS / Pandotic Hub system. For session-by-session change history see `CLAUDE.md`. For the forward plan see `ROADMAP.md`.

---

## The Three Admin Tiers

The platform delivers three distinct admin interfaces, all built on shared primitives in `@pandotic/universal-cms` (`packages/cms-core/`).

### 1. Marketing Website CMS (per-site)

Per-site content management — articles, landing pages, media, SEO, reviews, forms, business entities, companies, videos. Driven by a site's `cms.config.ts` selecting from 31 `CmsModuleName` modules. Consumed by every Pandotic marketing site.

### 2. App Admin (per-app)

Per-app SaaS administration — user management, organizations, feature flags, audit log, RBAC. Originally extracted from HomeDoc; now part of `@pandotic/universal-cms` and consumed by individual apps via the same package.

### 3. Pandotic Hub (cross-property)

Top-level mission control across **all** sites and apps. Lives in `packages/fleet-dashboard/` (`@pandotic/fleet-dashboard`), deployed to Netlify as `pandhub.netlify.app`. Includes property registry, groups, agents, social content pipeline, marketing-ops modules, and the Team Hub (weekly ops meetings, issues, to-dos, Granola transcripts).

The Hub has its own Supabase project (`rimbgolutrxpmwsoswhq` — "Pandotic Hub") and uses the `hub_` table prefix to avoid collision with per-site tables.

---

## Repo Structure

```
universal-cms/
├── packages/
│   ├── cms-core/          # @pandotic/universal-cms (publishable npm package)
│   ├── fleet-dashboard/   # @pandotic/fleet-dashboard (Pandotic Hub, Next.js 16)
│   ├── skill-library/     # @pandotic/skill-library (marketing skills + deploy adapters)
├── apps/
│   ├── pandotic-site/     # @pandotic/pandotic-site (marketing site)
│   └── dashboard/         # @universal-cms/dashboard (legacy Vite admin — do not extend)
├── template/              # Starter Next.js 16 app consuming cms-core
├── docs/                  # Architecture, runbooks, plans, archive
└── scripts/               # AI-context generator, migration validator
```

Workspace managed by pnpm; only `packages/*`, `apps/*`, and `template` are workspace members.

---

## Property Registry

Every managed site or app is a **property** (`hub_properties`) with:

| Concept | Notes |
|---|---|
| `name`, `slug`, `url` | Display + routing |
| `property_type` | `site` or `app` |
| `preset`, `enabled_modules` | Snapshot of the site's `cms.config.ts` |
| `supabase_project_ref`, `supabase_url` | Property's own Supabase project (Hub does not hold the connection) |
| `status` | `active` / `paused` / `archived` / `error` |
| `health_status` | `healthy` / `degraded` / `down` / `unknown` |
| `metadata` jsonb | Hosting provider, deploy info, custom fields |

Schema is authoritative in `packages/fleet-dashboard/supabase/migrations/00100_hub_properties.sql`. Subsequent migrations extend it (marketing categorization, hosting fields, denormalized counts).

A single product often registers two properties: one `site` (marketing) and one `app` (SaaS platform).

### Hub vs property data boundary

The Hub does not hold multiple Supabase connections. Cross-property data flows via:
- **Webhooks** — properties POST deploy/health/error events to Hub endpoints (e.g. `/api/webhooks/agent-run`)
- **Per-property fetchers** — when needed, the consuming property implements a small interface and the Hub triggers it

---

## Groups & Access Control

Properties are organized into `hub_groups` (B2B clients, internal portfolios). Hub roles:

| Role | Scope |
|---|---|
| `super_admin` | Full CRUD across all groups |
| `group_admin` | CRUD within assigned groups |
| `member` | Read + limited write within assigned groups |
| `viewer` | Read-only within assigned groups |

Access chain: `hub_user_group_access.group_id → hub_group_properties.group_id → hub_properties`. RLS enforces this at the Postgres level.

Schemas: `00101_hub_groups`, `00102_hub_users`.

---

## Agent Workflows (Phase 3)

`hub_agents` defines automated tasks per property (SEO audit, broken-link check, dependency updates, etc.). `hub_agent_runs` tracks execution history. The Hub stores definitions and history; **runners execute externally** and POST back via `/api/webhooks/agent-run`.

API surface: `/api/agents`, `/api/agents/[id]`, `/api/agents/[id]/runs`. UI at `/agents`, `/agents/[id]`, `/properties/[slug]/agents`.

Schema: `00104_agents.sql`, hardened by `00520_hub_agents_idempotent.sql` (PR #84 reconciled the agent_type enum→text drift).

---

## Social Content Pipeline (Phase 4)

`hub_brand_voice_briefs` (one per property) captures tone, audience, themes, do/don't, examples. `hub_content_pipeline` (renamed from `hub_social_content`) holds drafted/scheduled content across channels.

API surface: `/api/social/briefs`, `/api/social/content`, `/api/social/generate`, `/api/social/stats`. UI at `/social`, `/social/content`, `/social/brand-voice`, `/social/generate`.

Schema: `00105_social_content.sql`, generalized into `00112_unified_content_pipeline.sql`. The idempotent reconcile `00522_hub_social_idempotent.sql` may not yet be applied to the live Hub DB — see `CLAUDE.md` Outstanding Work.

---

## Marketing Ops Modules

Built on top of the Hub, these add per-brand orchestration layered on properties:

- **Brand voice + assets** (`00111_brand_voice_and_assets`)
- **Brand setup checklist** (`00113_brand_setup_checklist`)
- **QA reviews + auto-pilot** (`00114_qa_autopilot`)
- **Link building** (`00115_link_building`)
- **Marketing operations** — press, influencers, podcasts, research (`00117_marketing_operations`)
- **Playbooks** — reusable templates with step tracking (`00110_playbooks`)

All five Phase 3 marketing skills (Brand Profile Builder, Marketing Director, Long-Form Writer, Skeptical Reviewer, Repurposing Specialist) ship in `packages/skill-library/skills/marketing-*` and register against properties via `register-marketing-agents.ts`.

---

## Team Hub

Weekly ops meetings and team workflow live at `/team-hub/*`:

- Meeting agenda assembled from open issues, todos, recent activity (`FleetReviewSection`, `useFleetReview`)
- Issues + todos with partial-unique indexes preventing duplicate opens (`00518_team_hub_unique_open.sql`)
- Granola transcript ingestion (manual paste; pg_cron auto-sync optional per `docs/GRANOLA-CRON.md`)
- Initiatives tracking (`00517_team_hub_initiatives.sql`)
- Founders-only sidebar gating

Lives under `packages/fleet-dashboard/src/app/team-hub/`, `src/components/team-hub/`, `src/hooks/team-hub/`.

---

## Migrations

| Tree | Path |
|---|---|
| Hub (live, project `rimbgolutrxpmwsoswhq`) | `packages/fleet-dashboard/supabase/migrations/` |
| Per-site template | `template/supabase/migrations/` |
| Legacy reference | `reference/supabase/migrations/` (read-only history) |
| Standalone apps | `apps/dashboard/supabase/migrations/`, `apps/pandotic-site/supabase/migrations/` |

The Hub tree spans `00100`–`00521`. Numbers `00100`–`00117` are the original Phase 1–4 + marketing-ops set; `00500`–`00521` are subsequent reconciliations and bridges.

Migration changes are validated cold against a vanilla Postgres on every PR via `scripts/validate-migrations.sh` (CI job `migrations`). The script pre-applies a small list of forward-referenced migrations to make lexical ordering work — see comments in the script.

**Manual ops** that the migrations don't run automatically (e.g. `pg_cron` schedules, post-hoc dedupes) live in `packages/fleet-dashboard/supabase/manual/` and are documented in `OPS_RUNBOOK.md`.

---

## Package Exports

`@pandotic/universal-cms` ships ~80 subpath exports (`./config`, `./types/*`, `./data/*`, `./components/admin`, `./components/theme`, `./components/theme/server`, `./security`, `./middleware`, `./error-logging`, `./admin/*`, `./promptkit/*`, etc.) built with `tsup` to ESM + DTS. Subpath resolution uses conditional exports: `import` → `dist/`, `development` → `src/`.

All data functions follow the client-injection pattern:

```ts
function listProperties(
  supabase: SupabaseClient,
  filters?: { type?: PropertyType; status?: PropertyStatus; groupId?: string }
): Promise<HubProperty[]>;
```

No global Supabase state; the consumer always passes its own client.

---

## Deployment

| Property | Where |
|---|---|
| Pandotic Hub (`pandhub.netlify.app`) | Netlify, builds from `packages/fleet-dashboard/` |
| Pandotic site (`pandotic.com`) | Netlify, builds from `apps/pandotic-site/` |
| Per-site CMS consumers | Each consumer's own deployment, installs `@pandotic/universal-cms` from GitHub Packages |
| `@pandotic/universal-cms` package | GitHub Packages npm registry (Stage 1 publish gated on a manual GitHub repo setting per `docs/RELEASE.md`) |

---

## Where to find more

- `CLAUDE.md` — session history, outstanding work, resume points
- `ROADMAP.md` — what's next
- `docs/architecture.md`, `docs/getting-started.md`, `docs/module-catalog.md` — package consumer docs
- `docs/FLEET_DASHBOARD_ROADMAP.md` — Hub-specific forward plan
- `docs/RELEASE.md` — npm publish flow
- `docs/MIGRATION-RECONCILIATION.md` — when the schema drifts and needs reconciling
- `OPS_RUNBOOK.md` — manual Supabase ops the migrations don't cover
- `docs/archive/` — older planning docs preserved for context
