# Branch Backlog Cleanup — Workstream C from PR #81

**One-liner:** After the PR #81 rebase surfaced `main`'s current state,
only one of the five originally flagged stale branches is still live —
`claude/improve-website-ux-f77go`. The rest are already merged or archived.

**Status:** Mostly obsolete. Kept for audit trail.

## What happened

The PR #81 opening survey (run before we rebased onto `main`) flagged
five feature branches as "ahead of main with no PRs":

| Originally flagged | Reality after checking main |
|---|---|
| `claude/close-session-2026-04-21-hub-fixes` | Merged as **PR #77** (already on main) |
| `claude/improve-website-ux-f77go` | **Still open**, still ~147 LOC of pandotic-site typography tweaks |
| `claude/pandotic-team-hub-KMsMW` | Content landed via **PR #75**; preserved at `refs/heads/archive/claude/pandotic-team-hub-KMsMW` |
| `claude/add-error-logging-8u1mK` | Superseded by PR #54 (error-logging v2); preserved at `refs/heads/archive/claude/add-error-logging-8u1mK` |
| `claude/plan-skill-onboarding-8drJN` | Content all landed via later PRs (playbooks types, marketing-ops migrations, roadmap); preserved at `refs/heads/archive/claude/plan-skill-onboarding-8drJN` |

The rebase-with-conflict-resolution plan for the three "conflict
branches" in Workstream C is moot. They're in archive/ refs and can be
restored if needed via:
```
git checkout -b <original-name> archive/<original-name>
```

## Remaining actionable work

### `claude/improve-website-ux-f77go`

- 3+ days idle as of Apr 21.
- Scope: pandotic-site typography tweaks, distinct from PR #48.
- Decision: rebase + PR if the tweaks are still wanted, or delete.
- No known conflicts (scoped to `apps/pandotic-site/`).
- Suggested workflow: `git fetch origin && git rebase origin/main` on
  the branch, then open a PR with a short summary of what typography
  changed and why.

## Not in scope

- `claude/fix-issues-dark-mode-Xs1md` — **this branch**, merged via PR #81.
- Archived branches — leave alone. Already listed in the main CLAUDE.md
  under "Archive branches preserving deleted work".
- Version Packages PR (carried over from earlier sessions) — tracked
  separately in CLAUDE.md under "Watch-for: Version Packages PR".
