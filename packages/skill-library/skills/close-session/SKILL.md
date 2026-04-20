---
name: close-session
version: "1.0.0"
description: Cleanly close a Claude Code session by committing any remaining work, preserving context and unimplemented plans, updating CLAUDE.md with outstanding items, and pushing to the remote branch. Use when the user wants to wrap up a session, invoked via /close-session. Ensures no work or context is lost before a PR is opened.
---

# Close Session

Wrap up the current Claude Code session cleanly so no work, plan, or context is lost. This runs before the user creates a PR or hands the branch off.

## Workflow

Work through these steps in order. Build a TodoWrite list at the start if any step requires multiple sub-tasks.

### 1. Audit current state

Run these in parallel:
- `git status --short` — list uncommitted files
- `git branch --show-current` — confirm we're on the expected branch (not main/master)
- `git log --oneline origin/main..HEAD` — list commits ahead of main (if origin/main exists; otherwise skip)
- `git stash list` — check for stashed work

**Guard rails:**
- If the current branch is `main` or `master`, STOP and ask the user before committing anything.
- If there are stashed changes, mention them to the user — do not drop them.

### 2. Preserve unimplemented plans as Markdown files

Before committing, scan the conversation for any **detailed plan, design, or research** that was produced but not implemented in code. If found, save each as a separate doc under `docs/plans/` (create the directory if needed). Examples:
- A step-by-step implementation plan the user agreed to but didn't execute
- API contract research / schema notes
- Architectural decisions or tradeoff analysis
- Phased rollout proposals

Filename format: `docs/plans/YYYY-MM-DD-<slug>.md` (use today's date). Each file should include:
- A one-line summary at the top
- Context (why this came up, what's blocked, what's next)
- The plan itself
- Related files / line numbers
- Status (blocked / ready / deferred)

**Skip this step if no substantive plans were produced** — don't create filler docs.

### 3. Update CLAUDE.md with outstanding work

Read the project's `CLAUDE.md` (if it exists). Add or update an "Outstanding Work" section with:
- Any new blockers discovered this session
- Status changes to existing blockers
- New TODOs / hardening items
- References to any `docs/plans/*.md` files saved in step 2

Keep entries concise and actionable. Don't duplicate content that's already in the file — update existing sections in place when relevant.

If `CLAUDE.md` doesn't exist, **ask the user** before creating one (some projects intentionally don't have them).

### 4. Commit remaining changes

For any uncommitted files:
- Group related changes into logical commits (don't lump unrelated work into one commit)
- Write descriptive commit messages following the repo's existing style (check `git log --oneline -5`)
- Use the standard commit trailer format used by this environment
- Never use `-A` / `.` for staging — add files by name to avoid pulling in secrets or cruft
- Never use `--no-verify` or skip hooks

If nothing is uncommitted, skip to step 5.

### 5. Push to the remote branch

- `git push -u origin <current-branch>` (use `-u` so tracking is set)
- On network failure, retry up to 4x with exponential backoff (2s, 4s, 8s, 16s)
- Never force-push unless the user explicitly asks

### 6. Do NOT create a PR

The user will create the PR themselves. Only create one if they explicitly ask during the session.

### 7. Final summary

Produce a concise wrap-up for the user with:

**Session summary**
- What was completed this session
- What was committed in this close-session step (file count + brief reasoning)
- Files created under `docs/plans/` (if any)
- CLAUDE.md sections updated (if any)

**Remaining / blocked**
- Anything still TODO, with references to the CLAUDE.md section or plan file
- Any blockers (waiting on keys, approvals, external deps)

**Next steps**
- Suggest the user open a PR when ready
- Flag anything they should verify manually (e.g., test a UI change in a browser)
- Mention stashed changes if any were found in step 1

Keep this summary under ~200 words. It's the last thing the user reads before the session ends.

## Guardrails

- **Never commit** files that look like secrets: `.env*`, `*credentials*`, `*.pem`, `*.key`, `id_rsa*`, anything in a `secrets/` folder. Warn the user if they're staged and skip them.
- **Never delete** files, branches, or stashes during close-session.
- **Never amend** prior commits — always create new ones.
- **Never push to main/master** — if the branch is main, stop and ask.
- **Don't fabricate plans** — only save docs for plans that genuinely came up in the conversation. Empty stub files are worse than nothing.
