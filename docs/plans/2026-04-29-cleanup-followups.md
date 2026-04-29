# Repo Hygiene — Residual Cleanup Follow-ups

**Status:** ready for next session. All audit-driven cleanup phases (1–4 + 6) shipped via PR #97 and PR #98. Residual items are branch-list cleanup, two newly-discovered branches, and the deferred audit items.

---

## Context

The Apr 29 repo hygiene audit (`CLEANUP_AUDIT.md` on main) drove a 6-phase cleanup. PR #98 merged Phases 1-4 (api-central deletion, .DS_Store cleanup, doc archival, migration rename, README fix). PR #97 merged Phase 6 (the `claude/prepare-cms-npm-deploy-JeW0c` branch's unmerged content).

Phase 5 (branch deletion + PR #86 close) was **partially completed**:
- ✅ PR #86 closed with explanatory comment
- ✅ 3 archive branches created and pushed (`archive/claude/plan-skill-onboarding-8drJN`, `archive/claude/platform-stabilization-plan-bzGVS`, `archive/claude/fix-repo-loading-multiselect-ov3rU`)
- ❌ The 3 original branches were *not* deleted — the local git proxy returns HTTP 403 on `git push --delete`. The user later confirmed (via UI screenshot) that they're still on the remote.

A subsequent screenshot also surfaced two new branches not seen during the audit: `claude/media-library-and-seo-panels` and `claude/admin-polish-and-marketing-panels`. Both 0 ahead of main, ~14 hrs old at time of screenshot, no PRs.

---

## Plan

### 1. Branch deletion

Branches still on the remote that should be deleted (content preserved at `archive/claude/<same-name>`):

| Branch | Why |
|---|---|
| `claude/platform-stabilization-plan-bzGVS` | Single CLAUDE.md formatting commit, base CLAUDE.md rewritten since (audit §1.2) |
| `claude/fix-repo-loading-multiselect-ov3rU` | Doc-only commit, PR #86 closed (audit §1.4) |
| `claude/plan-skill-onboarding-8drJN` | Content fully on main, verified file-by-file (audit §1.3) |

The `claude/audit-repo-hygiene-dS45f` branch (PR #98 merged) should also be deleted unless this session pushes new work to it.

**Approach.** Try the GitHub MCP first — there's no direct delete-ref tool, so check `mcp__github__delete_file` is not the right one (that deletes file contents, not refs). If the MCP can't do it, ask the user to delete via the GitHub UI. The proxy 403 is environmental, not a permissions issue.

### 2. Two new branches to triage

| Branch | Action |
|---|---|
| `claude/media-library-and-seo-panels` | Check `git rev-list origin/main..origin/<branch>`. If empty, delete. If has commits, treat as audit treated unmerged work (archive + PR or archive + close). |
| `claude/admin-polish-and-marketing-panels` | Same. |

Both showed 0 ahead in the screenshot, suggesting empty/abandoned. Confirm before deleting.

### 3. Deferred audit items (don't auto-execute, flag if new evidence emerges)

| Item | Status / why deferred |
|---|---|
| Live-DB applied state for `00522_hub_social_idempotent.sql` and `00517_team_hub_initiatives.sql` | Needs Supabase SQL editor access (`rimbgolutrxpmwsoswhq`). Code-side rename done; live-DB row updates are manual. |
| Live-DB row update for the `00521 → 00522` rename | Same. The `supabase_migrations.schema_migrations` row needs `UPDATE` to match the new filename if anyone runs `supabase db push` after. |
| SQL drift: `OPS_RUNBOOK.md` + `docs/archive/skill-onboarding/marketing-ops-master-spec.md` vs live `hub_properties` columns | Column-by-column compare; not pure hygiene. |
| Pending changesets (`.changeset/initial-release.md`, `.changeset/skill-library-initial.md`) | Gated on the GitHub repo-setting flip per `docs/RELEASE.md` § Pre-flight (P1.8 in CLAUDE.md). Not a code change. |
| `packages/admin-schema/` | README calls it "legacy reference"; original audit found no code consumers. Confirm with deeper grep before proposing deletion. |
| `CLEANUP_AUDIT.md` at repo root | Historical record. Decide: leave / delete / move to `docs/archive/`. |

---

## Suggested order

1. Confirm archive branches are visible (the user's "Yours" filter may have hidden them).
2. Delete the 3 original superseded branches + `claude/audit-repo-hygiene-dS45f`.
3. Triage the 2 new mystery branches.
4. Decide on `CLEANUP_AUDIT.md`.
5. The remaining deferred items wait for separate sessions (DB access, npm publish unblock, etc.).

---

## Critical files / references

- `CLEANUP_AUDIT.md` (main) — full audit findings backing every decision
- `CLAUDE.md` (main) — Outstanding Work section + Apr 23 stabilization handoff
- `docs/plans/2026-04-23-stabilization-handoff.md` — npm publish flow context
- PR #97 (merged), PR #98 (merged), PR #86 (closed) — audit-driven outcomes
