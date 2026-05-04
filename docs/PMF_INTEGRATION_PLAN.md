# PMF Evaluator → Hub Integration Plan

Status: **Not started.** Captured to close the
`claude/integrate-pmf-app-D5lch` session without losing context.
Pick this up in a future session — nothing in this doc has been
executed.

## Goal

Replace the iframe-embedded PMF Evaluator at
`/tools/pmf-evaluator` with a route group inside the Pandotic Hub
(`packages/fleet-dashboard/`) so PMF runs as a first-class tab —
shared auth, shared layout, shared design system, no postMessage
bridge.

## Three paths considered

| # | Path | Pros | Cons |
|---|---|---|---|
| 1 | **Iframe (status quo)** | Fastest. Free isolation. Independent deploys. | Clunky auth. No shared nav/state. Extra cold start. Bridge protocol must be maintained on both sides. |
| 2 | **Next.js multi-zones** | One URL, one session cookie, two deploys. Lower risk than full merge. | Still two repos to keep in sync. Asset rewrites are fiddly. |
| 3 | **Monorepo merge** ✅ | Tightest integration. Shared auth, layout, RQ/zustand, theme. One deploy. | Requires version reconciliation (Next/React/Tailwind/Supabase). Move file-based session storage. Most upfront work. |

**Decision: path 3 (monorepo merge).** The Hub is the long-term shell;
the iframe path keeps costing every time PMF needs cross-tool state.

## Current state in this repo

### Hub side (`packages/fleet-dashboard/`)

- Mount point: `src/app/tools/pmf-evaluator/page.tsx` — iframe host.
  - Reads `NEXT_PUBLIC_PMF_EVALUATOR_URL`.
  - Sends `INIT_PMF_EVALUATOR` `{ propertyId, propertyName, propertySlug }`.
  - Listens for `PMF_RESULT_READY`.
- Sidebar entry: `src/app/nav/sidebar.tsx`.
- Breadcrumbs + page-help: `src/components/breadcrumbs.tsx`,
  `src/lib/page-help/registry.ts`.
- Env var documented in `.env.example` line 39.

### Secondary bridge (richer protocol)

`apps/dashboard/src/hooks/usePMFBridge.ts` defines the protocol
PMF actually emits today:

- Outbound from Hub: `HUB_CONTEXT` `{ userId, token, propertyId, propertyName, prefill: { productName, tagline, description, domainId } }`.
- Inbound from PMF: `PMF_EVENT` with `event ∈ { ready, evaluation_started, step_completed, report_ready, report_downloaded }`, plus `pmfScore`, `dfsScore`, `verdict`, `recommendation`, `sessionId`, `productName`, `step`.

The merged build must preserve those event semantics as **direct
function calls / store updates**, not postMessage.

### External PMF repo (not in this monorepo)

- Deployed at `pmfdf.netlify.app`.
- Standalone Next.js 16 app (per CLAUDE.md note).
- Has its own auth, layout, and (historically) a file-based session
  store.

## Target environment (Hub stack — what PMF must conform to)

| Concern | Hub version / convention |
|---|---|
| Next.js | `^16.1.6`, App Router, turbopack dev |
| React | `^19.2.3` |
| TypeScript | `^5.0.0` |
| Tailwind | `^4.0.0` via `@tailwindcss/postcss` — **no `tailwind.config.js`**, CSS-based `@theme` |
| Auth | `@supabase/ssr ^0.10.0` + `@supabase/supabase-js ^2.102.1`, cookie session, middleware-enforced |
| Hub Supabase project | `rimbgolutrxpmwsoswhq` |
| State | `zustand ^5.0.0`, `@tanstack/react-query ^5.51.0` (provider at `src/app/providers.tsx`) |
| UI primitives | `lucide-react ^0.408.0`, `clsx`, `tailwind-merge`, `sonner`, `cmdk`, Radix via cms-core |
| AI | `@anthropic-ai/sdk ^0.39.0` |
| Theme | Dark zinc, top-bar `NavShell` in root layout |
| Workspace package | `@pandotic/universal-cms` (cms-core) — already consumed |
| Target mount path | `packages/fleet-dashboard/src/app/(pmf)/tools/pmf-evaluator/...` |

## Phase A — Prep work in the **PMF repo** (do this first)

Branch: `prep-hub-merge` in the standalone PMF repo. PMF must still
build + deploy standalone after this phase; the merge into the Hub is
Phase B.

Deliverables:

1. **Compat report.** For each of the rows in the Hub stack table
   above, state PMF's current version and whether a bump or rewrite is
   required. Tailwind v3 → v4 in particular: list every file using
   `tailwind.config.js` tokens, plugins, or `@apply` chains that
   reference config.
2. **File manifest, grouped by destination:**
   - `app/(pmf)/**` — pages + layouts (note `"use client"` per route).
   - `components/pmf/**` — presentational.
   - `lib/pmf/**` — pure logic, scoring, prompt templates.
   - `app/api/pmf/**` — server routes (method, auth, external calls).
   - **Delete list** — PMF's own auth pages, root layout, marketing
     surfaces, `_app`/`_document` leftovers, standalone middleware.
3. **Data + storage inventory:**
   - Every Supabase table PMF reads/writes, with DDL. These become
     Hub migrations under `packages/cms-core/supabase/migrations/`
     starting at prefix `00518_`. RLS convention: authenticated read,
     `super_admin` / `group_admin` write, scoped by `property_id`
     where applicable.
   - Replace any file-system / session-store usage (file-based
     session store has been observed historically) with Supabase
     table or zustand-persisted slice.
   - External API calls (Anthropic, etc.) — env var names the Hub
     must add.
4. **Bridge-to-direct rewrite plan.** Enumerate every postMessage
   send/receive site. For each, specify the replacement: Hub hook,
   server action, or zustand store update.
   - `HubContextPayload` (`userId`, `token`, `propertyId`,
     `propertyName`, `prefill`) → server-resolved prop or
     `useHubUser()` / selected-property hook call.
   - `PMF_EVENT` outbound → either a callback prop, a zustand action,
     or a Supabase write — pick per event.
5. **Env var delta.** Vars PMF needs that the Hub lacks. Use
   `NEXT_PUBLIC_` only for client-read values.
6. **Dependency delta.** Diff PMF's `package.json` against the Hub's.
   For each conflict (react, supabase, tailwind, tanstack, zustand
   majors): "drop (use Hub's)" or "must upgrade PMF code to match Hub".
7. **`MIGRATION_MANIFEST.md`** at PMF repo root summarizing items 1–6.

In-place changes on `prep-hub-merge` so PMF still ships solo:

- Upgrade to Next 16 / React 19 / Tailwind v4 / Supabase SSR.
- Reorganize source so paths mirror the target layout
  (`src/app/(pmf)/...`, `src/components/pmf/...`,
  `src/lib/pmf/...`, `src/app/api/pmf/...`).
- Replace the PMF-side bridge with a thin adapter behind
  `useHubContext()`. Standalone build stubs it from `window.parent`
  postMessage (today's behavior). Merged build resolves it from
  Hub session/context.

## Phase B — Merge into the Hub (later session)

Branch off `main` in this repo, e.g. `feat/pmf-merge`.

1. `cp -r` from PMF's `prep-hub-merge` branch into
   `packages/fleet-dashboard/src/app/(pmf)/...`,
   `packages/fleet-dashboard/src/components/pmf/...`,
   `packages/fleet-dashboard/src/lib/pmf/...`,
   `packages/fleet-dashboard/src/app/api/pmf/...`.
2. Fix import paths (`@/...` → Hub's tsconfig aliases).
3. Wire `useHubContext()` to the Hub's real session
   (`@supabase/ssr` server client + selected-property store).
4. Apply Hub Supabase migrations from item 3 of Phase A.
5. Add env vars from item 5 to `.env.example` and Netlify.
6. Replace the iframe page at
   `src/app/tools/pmf-evaluator/page.tsx` with a redirect (or just
   remove and let `(pmf)/tools/pmf-evaluator` own the route — the
   route group is invisible in URLs).
7. Update sidebar, breadcrumbs, page-help registry. Keep gating
   identical to the iframe version.
8. Delete `apps/dashboard/src/hooks/usePMFBridge.ts` and the
   sibling `apps/dashboard/src/pages/PMFEvaluatorPage.tsx` if
   `apps/dashboard/` is otherwise unused. Confirm before deleting —
   that app is a separate Vite oversight dashboard.
9. Drop `NEXT_PUBLIC_PMF_EVALUATOR_URL` from `.env.example`.
10. Smoke test: load `/tools/pmf-evaluator` as a non-founder and a
    founder; run a full evaluation; confirm `report_ready` writes to
    Supabase; confirm theme + nav shell render.

## Risks / open questions

- **PMF's session storage.** If it's file-based, decide table vs.
  zustand-persist before Phase A item 3 — the answer changes the
  migration set.
- **Anthropic SDK version.** Hub is on `^0.39.0`. If PMF is newer,
  align in Phase A so the Hub doesn't have two majors.
- **`apps/dashboard/`.** Separate Vite oversight dashboard, not the
  Hub. Don't conflate. Its own PMF iframe page is independent and
  may or may not be retired alongside this work.
- **PMF deployment continuity.** `pmfdf.netlify.app` should keep
  building off `main` until Phase B merges. Phase A is in-place so
  this is preserved.
- **Versioning.** Hub does not currently publish PMF code; nothing
  in cms-core ships PMF.

## Files referenced

- `packages/fleet-dashboard/src/app/tools/pmf-evaluator/page.tsx`
- `packages/fleet-dashboard/src/app/nav/sidebar.tsx`
- `packages/fleet-dashboard/src/components/breadcrumbs.tsx`
- `packages/fleet-dashboard/src/lib/page-help/registry.ts`
- `packages/fleet-dashboard/.env.example` (line 39)
- `packages/fleet-dashboard/package.json`
- `apps/dashboard/src/hooks/usePMFBridge.ts`
- `apps/dashboard/src/pages/PMFEvaluatorPage.tsx`
- `apps/dashboard/.env.example` (line 3)
- `CLAUDE.md` — see "PMF Evaluator Micro-App Integration (Future)"
