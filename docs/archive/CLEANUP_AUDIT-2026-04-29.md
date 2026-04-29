# Repository Hygiene Audit

**Date:** 2026-04-29
**Branch:** `claude/audit-repo-hygiene-dS45f`
**Scope:** `pandotic/universal-cms` (single repo). The user mentioned "many repos" — this audit covers **branches** within this repo, since the GitHub MCP scope only exposes `pandotic/universal-cms`. If there are sibling repos elsewhere, they were not audited here.
**Mode:** Investigation only. No commits, pushes, or migrations made.

---

## 1. Branches & PRs

### 1.1 Working tree

| Item | State |
|---|---|
| Working tree | Clean |
| Stashes | None |
| Untracked | None (only ignored `node_modules/` dirs) |
| Current branch | `claude/audit-repo-hygiene-dS45f` (at `443dad3`, same SHA as `origin/main`) |
| **Local `main`** | **At `3c08160`, behind `origin/main` by 15 commits** (PRs #87, #88, #89, #90, #91 plus CI/ai-context commits not pulled locally) |

### 1.2 Remote branches

GitHub shows **7 branches** total. All non-main branches are listed below with `ahead`/`behind` counts vs `origin/main` and the unique-commit summary.

| Branch | Ahead | Behind | Last commit | Has open PR? | Status |
|---|---:|---:|---|---|---|
| `main` | — | — | `443dad3` Apr 28 | — | tip |
| `archive/claude/add-error-logging-8u1mK` | 1 | 115 | `9aee661` Apr 19 — `feat(errors): auto-capture + batch triage UI…` | No (PR #52 was **closed, not merged**) | **Archive of superseded work.** CLAUDE.md says content was reshipped via "PR #54, error-logging v2." Pure history-preservation branch. |
| `archive/claude/pandotic-team-hub-KMsMW` | 2 | 77 | `69a2cd5` Apr 20 — Team Hub Phase 2 docs/code | No | **Archive of superseded work.** CLAUDE.md says content "landed via the rebased Phase 2 branch that merged as PR #75." Pure history-preservation. |
| `claude/fix-repo-loading-multiselect-ov3rU` | 1 | 31 | `aa33be4` Apr 22 — `docs(claude-md): record PR #82` | **PR #86 OPEN** | Doc-only commit (24 lines added to CLAUDE.md) describing a feature that already shipped via merged PR #82. CLAUDE.md has since been heavily rewritten and no longer contains any "Resume Point — Fleet onboard multi-select" section. Effectively superseded. |
| `claude/plan-skill-onboarding-8drJN` | 5 | 160 | `9cc43e9` Apr 17 — marketing-ops roadmap docs | No | **5 unique commits, 6,003 line additions across 52 files** — but content has *already landed on main*. See "verification" below. CLAUDE.md (Apr 22 wrap) lists this as already archived under `archive/claude/plan-skill-onboarding-8drJN`, but **no such archive branch exists on the remote** — the original branch is still live. |
| `claude/platform-stabilization-plan-bzGVS` | 1 | 29 | `41452e3` Apr 22 — CLAUDE.md formatting only | No | Single commit, 153 lines changed in CLAUDE.md only (formatting). Main's CLAUDE.md has been rewritten 5+ times since. Superseded. |
| `claude/prepare-cms-npm-deploy-JeW0c` | 1 | 15 | `d9f183a` Apr 27 — `chore(release): unblock npm publish + greenfield consumer onboarding` | No | **Genuinely unmerged work, most recent of the unmerged branches.** Adds: `docs/CONSUMER_ONBOARDING.md` (+146), trims `docs/ADMIN_UI_INTEGRATION_GUIDE.md` (-861/+5), adds `template/.env.example` (+5), `template/.npmrc` (+2), fixes `packages/cms-core/src/__tests__/hub-social.test.ts` (4 lines). Not mentioned in CLAUDE.md. |

### 1.3 Verification: `claude/plan-skill-onboarding-8drJN` is already on main

Of the 7 marketing-ops migrations on this branch, comparing file SHAs vs `origin/main`:

| Migration | On branch | On main | Match? |
|---|---|---|---|
| `00111_brand_voice_and_assets` | ✓ | ✓ | identical |
| `00112_unified_content_pipeline` | ✓ | ✓ | **DIFFERS** (main has newer version) |
| `00113_brand_setup_checklist` | ✓ | ✓ | identical |
| `00114_qa_autopilot` | ✓ | ✓ | identical |
| `00115_link_building` | ✓ | ✓ | identical |
| `00116_agent_type_migration` | ✓ | ✓ | **DIFFERS** (main has PR #84 hardened version) |
| `00117_marketing_operations` | ✓ | ✓ | identical |

Spot-checked sibling code files (`marketing-ops/page.tsx`, `hub-content-pipeline.ts`, `qa-reviews/route.ts`) — all present on main.

**Branch carries no genuinely unique content.** The 2 differing migrations only differ because main has the newer hardened versions.

### 1.4 Open PR detail — PR #86

| Field | Value |
|---|---|
| Title | `docs(claude-md): record PR #82 — fleet onboard repo pagination + multi-select` |
| Head | `claude/fix-repo-loading-multiselect-ov3rU` @ `aa33be4` |
| Base | `main` @ `3c08160` (currently 31 commits behind tip) |
| Created / updated | 2026-04-23 03:07 / 03:08 — **6 days idle** |
| Mergeable state | `unknown` (no rebase has been attempted since base moved) |
| Diff | 1 file, +24 / -1 (CLAUDE.md only) |
| Combined commit status | `success` (both Netlify deploy previews) |
| Check runs | 11 total. **1 failure: `validate (22)`** (Apr 23, before later CI hardening landed on main). `migrations`, `e2e`, `ai-context-drift`, `validate (20)` all OK at the time. `validate (20)` cancelled. |
| Comments | 2 |

The failed check predates several CI fixes that have since landed on main; a rebase would likely change its status.

### 1.5 Stale CLAUDE.md branch references

CLAUDE.md still mentions branches that **no longer exist on the remote**:

| Reference in CLAUDE.md | Reality |
|---|---|
| "claude/improve-website-ux-f77go (3+ days idle)" — listed under "Remaining branches to triage" | Branch deleted from remote (PR #76 closed, content shipped via PR #48). Doc is stale. |
| "archive/claude/plan-skill-onboarding-8drJN" — listed under "Archive branches preserving deleted work" | No archive branch exists. The live `claude/plan-skill-onboarding-8drJN` (without `archive/`) still exists. Either the archive was never created, or the archive branch was deleted and the original is the leftover. |

---

## 2. SQL Migrations

There are **three migration trees** in this repo:

| Tree | Path | Purpose |
|---|---|---|
| Hub (live) | `packages/fleet-dashboard/supabase/migrations/` | Pandotic Hub, project `rimbgolutrxpmwsoswhq` |
| Per-site template | `template/supabase/migrations/` | Starter Next.js app schema |
| Legacy reference | `reference/supabase/migrations/` | Read-only history (note: `reference/` is in `.gitignore` but tracked — see §3) |
| Standalone apps | `apps/dashboard/supabase/migrations/` (1 file) and `apps/pandotic-site/supabase/migrations/` (1 file) | Per-app schemas |
| Legacy admin-schema | `packages/admin-schema/migrations/` (3 files) + `rls/` (2) + `seed/` (1) | "Reference" only per README |
| Top-level | `api-central/sql/setup.sql` | Dead — see §3 |

### 2.1 Filename collisions on main

| Path | Collision |
|---|---|
| `packages/fleet-dashboard/supabase/migrations/` | **`00521_api_central_bridge.sql`** + **`00521_hub_social_idempotent.sql`** — two files at number `00521`. Already known (CLAUDE.md "Resume Point — Stabilization handoff" calls it out). PR #85 + PR #87 collided on the same number. Ordering between them is determined by lexical sort of the suffix (`api_central_bridge` < `hub_social_idempotent`). Validator is green; cosmetic but real. |
| `template/supabase/migrations/` | **`00025_api_usage_tracking.sql`** + **`00025_projects.sql`** — two files at number `00025`. Not flagged anywhere in CLAUDE.md or docs. |

### 2.2 Validator state — `scripts/validate-migrations.sh`

| Setting | Value |
|---|---|
| `SKIP_MIGRATIONS` | empty (per CLAUDE.md, was just emptied via `00521_api_central_bridge.sql`) |
| `PRE_APPLY` (forward-reference workarounds) | 4 entries: `00102_hub_users.sql`, `00100_hub_properties.sql`, `00505_hub_skills.sql`, `00521_api_central_bridge.sql` |

The `PRE_APPLY` list is technically a smell — it documents 4 migrations that have forward references the lexical ordering can't honor. Production unaffected, but cold-apply ordering is fragile.

### 2.3 Files vs applied state — manual ops bridge

`packages/fleet-dashboard/supabase/manual/` contains SQL/runbooks the migrations don't run automatically:

| File | Purpose |
|---|---|
| `chunk-1-ops.sql` | Manual ops |
| `dedupe-team-hub.sql` | Manual dedupe (one-off) |
| `schedule-granola-sync.sql` | pg_cron job setup (per `docs/GRANOLA-CRON.md`) |
| `chunk-2-runbook.md` | Runbook (markdown in a `manual/` dir is unusual) |

`OPS_RUNBOOK.md` (root) lists more "manual Supabase ops the code expects to have been run." Per CLAUDE.md, `00521_hub_social_idempotent.sql` was **not yet applied to the live Hub DB** as of the Apr 27 wrap. No tool in this audit can verify what's actually in `supabase_migrations.schema_migrations` on the live DB — we have no DB credentials in this session.

### 2.4 Code refs vs migration tables

Cross-checked all `from('hub_*')` references in `packages/fleet-dashboard/src` and `packages/cms-core/src` against `CREATE TABLE` statements in the Hub migration tree:

- **All 12 distinct `hub_*` tables referenced from code exist as `CREATE TABLE` in migrations.** No orphan code references.
- 25 `hub_*` tables exist in migrations that the simple grep didn't find references to in code. This is mostly noise from naming (e.g. `hub_skill_versions` is referenced via aliases) plus tables consumed by skill-library / scripts / API routes I didn't grep. **Don't conclude anything from this list without a deeper audit.** Notable ones worth confirming have callers: `hub_initiatives`, `hub_press_releases`, `hub_research_studies`, `hub_podcasts`, `hub_influencers`, `hub_marketing_services`, `hub_featured_inbound_submissions`, `hub_featured_outbound_pitches`.

### 2.5 Archive sub-dir

`packages/fleet-dashboard/supabase/migrations/archive/_consolidated_00110-00117.sql` — 1,025-line concatenation of migrations 00110→00117 documented as "Apply via Supabase SQL editor against project rimbgolutrxpmwsoswhq". Conceptually fine, but worth confirming it's still needed (the individual migrations are all present alongside).

### 2.6 Embedded SQL in non-migration files (the user's "chat session SQL")

Files containing `CREATE TABLE` / `ALTER TABLE` blocks **outside** the migration trees:

| File | What it contains | Risk |
|---|---|---|
| `DASHBOARD.md` (root, last touched Apr 12) | 6+ `CREATE TABLE IF NOT EXISTS hub_*` blocks (hub_properties, hub_groups, hub_users, hub_user_group_access, hub_activity_log, hub_agents) — appears to be the original Phase-1 design doc | Drift risk — it's the *design* version, real migration may have diverged |
| `OPS_RUNBOOK.md` (root, Apr 20) | `CREATE TABLE` for `public.feature_flags`, `public.user_roles` + `ALTER TABLE … ENABLE ROW LEVEL SECURITY`. Marked as "manual ops" | These are the ops the code expects but migrations don't run. Drift risk if the live tables don't match. |
| `AI_CONTEXT.md` (root, Apr 21) | `CREATE TABLE` references | Likely auto-regenerated by `pnpm ai-context`; verify with the script. |
| `docs/FLEET_DASHBOARD_ROADMAP.md` | Proposed `hub_property_milestones` schema (line 291) | Roadmap proposal, not yet shipped — fine. |
| `docs/plans/2026-04-23-stabilization-handoff.md` | SQL fragments | Plan doc — fine. |
| `docs/archive/skill-onboarding/marketing-ops-master-spec.md` | Long block of `ALTER TABLE hub_properties ADD COLUMN …` for marketing categorization, hosting fields, marketing flags, denormalized counts | **High drift risk** — large schema change spec sitting in `docs/archive/`. Some of these columns may or may not have shipped via the actual migrations. Worth a column-by-column compare. |
| `apps/dashboard/README.md` | SQL examples for the legacy Vite dashboard | Legacy, low risk. |
| `api-central/PORTABLE_PROMPT.md` | Full `sql/setup.sql` body — literally an AI-prompt-style "drop-in module" spec for recreating API Central in another project | Dead code (see §3). |
| `packages/skill-library/skills/universal-cms/references/upgrade-guide.md` | Skill-library doc | Likely intended. |
| `packages/skill-library/skills/voyage-ai/references/rag-patterns.md` | Skill-library doc | Likely intended. |

---

## 3. File organization

### 3.1 Root-level `api-central/` — dead duplicate

`api-central/` at the repo root contains 11 files (~3,057 lines on initial upload), notably:

| File | Status |
|---|---|
| `api-central/src/APICentral.tsx` (1,634 lines) | **Not imported anywhere.** The active component is `packages/fleet-dashboard/src/components/APICentral.tsx` (1,659 lines). Diff shows they have diverged. |
| `api-central/sql/setup.sql` | Differs from `packages/fleet-dashboard/sql/api-central-setup.sql` by exactly **1 line** (a comment). The fleet-dashboard one is the active one. |
| `api-central/PORTABLE_PROMPT.md` | AI-prompt-style spec to recreate the API Central feature in another project — not part of the build. |
| `api-central/backend/*.ts` | Netlify Functions style — repo uses Next.js API routes instead. Not in the workspace. |

`api-central/` is **not** in `pnpm-workspace.yaml` (which lists only `packages/*`, `apps/*`, `template`). It has no inbound imports anywhere I could find. CLAUDE.md ("P0 stabilization" entry) says they "Deleted stale `packages/api-central/` duplicate" — they deleted the package, but the **root-level `api-central/` was never deleted**.

### 3.2 Stale top-level planning/audit docs

The repo root has 17 markdown files. Several are dated planning/audit snapshots that have been superseded by the live state in CLAUDE.md, but never deleted.

| File | Last commit | Notes |
|---|---|---|
| `AUDIT_REPORT.md` | Apr 13, "comprehensive audit of April 10" | Claims "4 SQL migrations verified" — main now has 30+. References `claude/audit-stability-fixes-BuKhL` (deleted). |
| `IMPLEMENTATION_STATUS.md` | Apr 13 | Same lineage as `AUDIT_REPORT.md`. References `claude/audit-stability-fixes-BuKhL`. |
| `QA_HARDENING_REPORT.md` | Apr 13 | Phase-3-4 QA snapshot. |
| `ADMIN_INTEGRATION_PLAN.md` | Apr 13 | Refers to `@pandotic/admin-ui`, `@pandotic/admin-core` — packages CLAUDE.md says were **deleted** in chunk 4. Stale architecture vision. |
| `MARKETING_OPS_PHASE_3_PLAN.md` | Apr 18 | Phase 3 done per CLAUDE.md. |
| `MARKETING_OPS_PHASE_3_NEXT_STEPS.md` | Apr 22 | Phase 3 shipped via PR #83. |
| `MARKETING_OPS_ROADMAP.md` | Apr 17 | Schema/UI shipped. |
| `DASHBOARD.md` | Apr 12 | 31KB design doc. Contains design-time SQL (§2.6) that may have drifted from migrations. |
| `ROADMAP.md` | Apr 12 | "Extraction Roadmap" — references work that was completed and superseded by chunks 1-7. |
| `UPGRADE.md` | Apr 12 | Generic upgrade doc; OK if currently accurate. |
| `PUBLISHING.md` | Apr 16 | Active — referenced by RELEASE.md. |
| `OPS_RUNBOOK.md` | Apr 20 | Active — manual ops runbook. |
| `AI_CONTEXT.md` | Apr 21 | Auto-generated; check generator script keeps it fresh. |
| `llms-full.txt` / `llms.txt` | Apr 28 / Apr 26 | Auto-generated. |
| `README.md` | Active | Still references `@universal-cms/admin-core` (line 34) — **stale, those packages were deleted**. Also calls `apps/dashboard/` "legacy Vite admin (superseded by fleet-dashboard); do not extend." |
| `CLAUDE.md` | Active (Apr 28) | Authoritative project context. |

**Pattern:** every "session/phase" planning doc that gets shipped is preserved as a top-level snapshot rather than moved to `docs/archive/` or deleted.

### 3.3 `reference/` is gitignored but tracked

`.gitignore` line 5 is `reference/`. But `git ls-files reference/` returns ~80 tracked files (full Next.js app + 24 SQL migrations + docs-source). Once a file is tracked, gitignore is a no-op. Either it should be untracked + gitignored, or the gitignore line should go. As-is it's misleading.

### 3.4 `apps/dashboard/` — intentionally legacy

`apps/dashboard/` is React 18 + Vite (the rest of the repo is React 19 + Next.js 15/16). README.md at root and CLAUDE.md confirm this is intentional ("legacy oversight hub, kept for reference, do not extend"). Listed for visibility, not action.

### 3.5 `packages/admin-schema/` — "reference only"

README.md describes it as "legacy admin SQL migrations (reference)". Workspace package (`@universal-cms/admin-schema`), but no consumers found in code grep. Worth confirming with you whether it can be moved/deleted.

### 3.6 Tracked OS artifacts

| File | Tracked? |
|---|---|
| `./.DS_Store` | yes |
| `./packages/.DS_Store` | yes |

Not in `.gitignore`.

### 3.7 Misplaced files / duplicates

| Item | Notes |
|---|---|
| `packages/fleet-dashboard/supabase/manual/chunk-2-runbook.md` | A `.md` file in a SQL `manual/` directory. Probably belongs in `docs/`. |
| `packages/fleet-dashboard/sql/api-central-setup.sql` vs `api-central/sql/setup.sql` | 1-comment-line diff (see §3.1). |
| `api-central/src/APICentral.tsx` vs `packages/fleet-dashboard/src/components/APICentral.tsx` | 1,634 vs 1,659 lines — diverged duplicate (see §3.1). |
| `ADMIN_INTEGRATION_PLAN.md` vs `docs/ADMIN_UI_INTEGRATION_GUIDE.md` | Two admin-integration docs at different scopes. The root one is the stale "architecture vision"; the `docs/` one is the active integration guide. |
| Tests | All in `packages/cms-core/src/__tests__/` — correct location, no misplaced tests. |
| Scripts | `scripts/generate-ai-context.ts` and `scripts/validate-migrations.sh` — correctly placed. None misplaced inside `src/` dirs. |

### 3.8 Build artifacts

No `dist/` directories tracked. ✓

---

## 4. Other suspicious things

### 4.1 Pending changesets that may not have published

`.changeset/initial-release.md` and `.changeset/skill-library-initial.md` both declare `minor` bumps for `@pandotic/universal-cms` and `@pandotic/skill-library`. Both packages are still at `0.1.0`. CLAUDE.md ("Watch-for: Version Packages PR (carried over)") explicitly flags that this is unresolved — the Release workflow should have opened a "chore: version packages" PR but apparently didn't, blocking the npm publish. Stage 1 rollout is gated on this. Worth confirming whether the changesets are still wanted as-is.

### 4.2 README contradicts CLAUDE.md on packages

`README.md` line 31-34 still references `@universal-cms/admin-core` and admin-ui with example code:

```
import type { EntityAdapter } from '@universal-cms/admin-core';
```

Per CLAUDE.md ("P0 stabilization"), `admin-core` and `admin-ui` packages were **deleted** in chunk 4. Anyone reading the README will hit a dead import.

### 4.3 PR #91 (the most recent merged) flipped the tip; local main is 15 commits behind

Just an observation: the audit branch was cut from `origin/main`'s current tip, which is *ahead* of local `main`. Local main is at PR #85's merge commit. Won't affect anything as long as we always work from `origin/main`.

### 4.4 CLAUDE.md "Outstanding Work" section may be partially stale

CLAUDE.md still lists items that may have been resolved by subsequent PRs:

- "Manual ops to run (PR #75 aftermath)" — instructs `supabase db push --linked` for `00517_team_hub_initiatives.sql`. This migration is in the migration tree on main; whether it was applied to the live DB is unverified from this session.
- "Watch-for: Version Packages PR" — see §4.1.
- "Founder sign-ins" — Allen / Matt / Scott; status unverified.

None are bugs in the repo, but the CLAUDE.md outstanding list has accumulated items.

### 4.5 `docs/archive/` carries onboarding specs with embedded schema

`docs/archive/skill-onboarding/` (8 files) contains `.skill` files, marketing-ops specs, and `.json` task files preserved from earlier sessions. The marketing-ops master spec (§2.6) has a sizable `ALTER TABLE hub_properties` block that may or may not match current schema. Archive material is normally fine — flagging because it contains schema specs that someone might mistake for current truth.

### 4.6 Two top-level archive branches exist on remote, but a third is undocumented

CLAUDE.md "Archive branches preserving deleted work" lists 3 archive branches. Remote has 2 of them (`archive/claude/add-error-logging-8u1mK`, `archive/claude/pandotic-team-hub-KMsMW`). The third (`archive/claude/plan-skill-onboarding-8drJN`) doesn't exist; instead the **non-archive** `claude/plan-skill-onboarding-8drJN` is still around. See §1.5.

---

## 5. Ambiguities I want to flag

These don't block the audit, but you'll need to make calls in the cleanup session:

| Ambiguity | Why it matters |
|---|---|
| `claude/prepare-cms-npm-deploy-JeW0c` (Apr 27) — last unmerged branch with genuinely unique content (`CONSUMER_ONBOARDING.md`, `.npmrc`, etc.). Not in CLAUDE.md, no PR. | Is this work wanted? Should it be PR'd, cherry-picked, or dropped? It's coupled to §4.1 (npm publish unblock). |
| PR #86 — pure docs commit referencing a feature already shipped. CLAUDE.md has been rewritten and no longer contains the resume-point text it would add. | Close PR + delete branch, or rebase + re-author? |
| `claude/plan-skill-onboarding-8drJN` — content fully on main, branch exists and is *not* prefixed `archive/`. | Delete outright, or rename to `archive/…` to match the documented pattern? |
| `claude/platform-stabilization-plan-bzGVS` — single CLAUDE.md formatting commit, base CLAUDE.md has been rewritten. | Delete? |
| Two archive branches (`add-error-logging`, `pandotic-team-hub`) — deliberately preserved. | Confirm you want to keep them as long-term refs vs. tag and delete. |
| Filename collision `00521_*` (known) and `00025_*` (template, **not** documented). | Rename strategy: bump the later file to next free number? CLAUDE.md already proposes renaming `00521_hub_social_idempotent` → `00522_*`. |
| `OPS_RUNBOOK.md` + `docs/archive/skill-onboarding/marketing-ops-master-spec.md` SQL fragments | Are these design records (keep, mark "design only") or live ops the live DB lacks (apply)? |
| `reference/` gitignored-but-tracked | Untrack + add to gitignore properly, or remove from gitignore? |
| Top-level `api-central/` (3,000+ lines, no inbound imports) | Delete outright — already superseded by the in-tree fleet-dashboard copy? |
| Stale top-level docs (§3.2) | Delete vs move to `docs/archive/`? |

---

## 6. Quick stats

| Metric | Count |
|---|---|
| Remote branches | 7 (1 main, 2 archive, 4 working) |
| Open PRs | 1 (#86) |
| Branches with unique content not on main | 1 (`claude/prepare-cms-npm-deploy-JeW0c`) |
| Branches that are effectively superseded | 5 (everything except main and `prepare-cms-npm-deploy`) |
| Migration filename collisions on main | 2 (`00521`, template `00025`) |
| Top-level dead duplicates (`api-central/`) | ~3,000 LOC |
| Top-level stale planning docs | ~7 (snapshots from Apr 10-22) |
| Tracked `.DS_Store` files | 2 |
| Pending changesets unpublished | 2 |

---

*End of audit. No changes were made to the repo. The current branch (`claude/audit-repo-hygiene-dS45f`) contains only this report.*
