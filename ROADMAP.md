# Roadmap

Forward plan for the Universal CMS / Pandotic Hub platform. For session-by-session detail of what shipped, see `CLAUDE.md`. For the architecture this is built on, see `DASHBOARD.md`.

This document answers three questions: **What's done. What's next. What's blocked.**

---

## What's done (as of Apr 2026)

| Phase | Summary |
|---|---|
| **1 — Foundation** | Auth, property registry (`hub_properties`), property linking, fleet status, hub middleware. |
| **1.5 — App Admin** | Extracted from HomeDoc into `@pandotic/universal-cms` (admin shell, RBAC, audit log, feature flags). |
| **2 — Groups & Access Control** | `hub_groups`, group-scoped RLS, user/role management UI. |
| **3 — Agent Workflows** | `hub_agents` + `hub_agent_runs`, webhook callback flow, per-property agent UI. Five marketing skills (Brand Profile Builder, Marketing Director, Long-Form Writer, Skeptical Reviewer, Repurposing Specialist) registered. |
| **4 — Social Content** | Brand voice briefs, multi-channel content pipeline, generation flow, brand-voice editor. |
| **Marketing Ops** | Brand voice + assets, brand setup checklist, QA reviews + auto-pilot, link building, marketing operations (press / influencers / podcasts / research), playbooks. |
| **Team Hub** | Weekly ops meetings, issues + todos with dedupe, Granola transcripts, initiatives tracking, fleet review agenda. |
| **Platform stabilization** | CI gained migration cold-apply, fleet-dashboard + template build coverage; root `build:all` + `verify` scripts; module preset picker in `/fleet/onboard`. |

---

## What's next

### P1.8 — Stage 1 publish unblock (gated on user)

Flip the "Allow GitHub Actions to create and approve pull requests" repo setting per `docs/RELEASE.md` § Pre-flight. Once flipped, the Release workflow will open a "chore: version packages" PR that bumps `@pandotic/universal-cms` and `@pandotic/skill-library` to `0.2.0` based on the pending changesets. Merging that PR publishes to GitHub Packages and unblocks the 10-site rollout.

Until this is done, all downstream consumer work (P2.11) has nothing to install.

### P2.10e — GitHub OAuth flow

Replace the PAT paste in `/fleet/onboard` with an OAuth flow. Adds a new `00522_user_github_tokens.sql` migration. Estimate: ~1 day.

### P2.10f — Richer repo auto-detect

Sniff `cms.config.ts` from the chosen repo and pre-select the matching module preset in the onboarding wizard. Estimate: ~0.5 day.

### P2.11 — CMS Deploy Wizard at `/fleet/deploy`

End-to-end "create a new Pandotic site" flow: pick preset → create repo → install package → seed content → first deploy. Depends on P1.8 (publish), P2.10e (OAuth), P2.10f (detection). Estimate: ~1.5 days.

Suggested order: P2.10f → P2.10e → P2.11. P1.8 is human-gated and runs in parallel. (The `00521`/`00522` migration-number collision was resolved during repo hygiene cleanup.)

### Phase 3 marketing skills — validation sequence (unblocked)

All 5 skills shipped via PR #83. Validation flow on SPEED:

1. Seed brand voice brief (SQL or Hub UI).
2. `pnpm --filter @pandotic/fleet-dashboard register-marketing-agents` (one-time).
3. `/build-brand-profile speed` → `/marketing-plan speed` → `/write-longform speed --topic … --keyword …` → `/skeptical-review {id}` → UI approve → `/repurpose {id}` → `/skeptical-review` each child.

Success = steps 3–4 complete without manual SQL fixups.

---

## Blocked / deferred

| Item | Why |
|---|---|
| **Stage 1 npm publish** | Gated on the GitHub repo-setting flip above. |
| **Live-DB applied state** for `00522_hub_social_idempotent.sql` and `00517_team_hub_initiatives.sql` | Apply via Supabase SQL editor when convenient; not gating any code work. |
| **Migration cold-apply tech debt** | Three migrations have forward references that the validator pre-applies (see `scripts/validate-migrations.sh` `PRE_APPLY` list). Production unaffected; cleanup requires splitting RLS policies into post-table migrations. |
| **Founder Hub sign-ins** | Allen / Matt / Scott each need to log into the Hub once so `public.users.auth_user_id` populates via the `handle_new_user` trigger. No code work. |

---

## Optional, documented

- **Granola pg_cron auto-sync** — runbook at `docs/GRANOLA-CRON.md`
- **Migration history reconciliation** — runbook at `docs/MIGRATION-RECONCILIATION.md`. Trigger when downstream sites report drift or when a publishable schema is being prepared.
- **PMF Evaluator integration** — embedded standalone Next.js app at `/tools/pmf-evaluator`, communicates via `window.postMessage`. Spec lives in conversation history; no committed plan yet.

---

## Where the detail lives

- `CLAUDE.md` — session history, exact PRs, currently-open work
- `docs/FLEET_DASHBOARD_ROADMAP.md` — Hub-specific forward plan
- `docs/plans/2026-04-23-stabilization-handoff.md` — current stabilization handoff
- `docs/RELEASE.md` — npm publish flow + pre-flight checklist
- `docs/archive/` — older planning docs (snapshots from Apr 2026)
