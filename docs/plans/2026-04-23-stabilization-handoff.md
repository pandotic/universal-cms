# Platform stabilization — handoff for follow-up session

**One-liner:** Pick up where PR #87 left off. Four real work items remain, plus a
five-minute cosmetic cleanup. One item is gated on a human GitHub-settings
toggle; the other three are concrete development scopes.

**Status:** ready — every item has a known starting point in the codebase or a
linked roadmap doc.

---

## Context

The platform stabilization plan was kicked off as a "give me a prioritized
hardening plan" request. Across PRs #83, #84, and #87 we shipped:

- P0: template `sitemap.ts` no longer crashes the build without env, CI now
  builds fleet-dashboard + template, deleted the stale `packages/api-central`
  duplicate, retired `apps/dashboard` from the active surface.
- P1: a Postgres-service migration validator in CI (`scripts/validate-migrations.sh`)
  that cold-applies all 37 hub migrations cleanly; fixed three latent migration
  bugs surfaced by it; added a Playwright smoke harness for the Hub; fixed a
  `useTeamUser` SSR crash that 500'd `/setup/missing-config`.
- P2: shipped the three remaining Phase 3 marketing skills (Skeptical Reviewer,
  Long-Form Writer, Repurposing Specialist) plus their helpers and
  `register-marketing-agents.ts`. Added the Hub onboarding-wizard module preset
  picker (Phase 3g).
- Migration tech debt: `00521_api_central_bridge.sql` makes `api_secrets` /
  `api_services` available cold-start; the validator's `SKIP_MIGRATIONS` is
  empty.

---

## What's left (priority order)

### 1. ⚠️ Cosmetic — 00521 migration number collision (5 min)

**Problem.** Both PR #85 and PR #87 introduced a `00521_*.sql`:
- `00521_api_central_bridge.sql` (PR #87, this branch's work)
- `00521_hub_social_idempotent.sql` (PR #85, parallel session)

Both landed on main. Validator is green (37 cold-apply, 0 failures) because
the two files don't conflict semantically and lexical ordering by full filename
is deterministic, but the number collision is a smell.

**Fix.** Rename `00521_hub_social_idempotent.sql` → `00522_hub_social_idempotent.sql`.
The api_central bridge has a hard ordering requirement (must run before 00504's
FK references resolve in the validator's pre-apply path), so it should keep the
lower number. Update `scripts/validate-migrations.sh` only if the rename
changes which file the `PRE_APPLY` array points at (it does not — only
`00521_api_central_bridge.sql` is pre-applied).

**QA.** Re-run the validator end-to-end with a fresh Postgres. Should still
report `applied 37, skipped 4 (pre-applied), failed 0`.

**Caveat.** Renaming a migration that's already been applied to the live Hub
(`rimbgolutrxpmwsoswhq`) creates a checksum/history mismatch. Two options:
1. Document in the commit that the rename only affects cold-apply, and the
   live Hub's `supabase_migrations.schema_migrations` table will need a manual
   `UPDATE` to reflect the new filename if anyone ever runs `supabase db push`
   against it.
2. Skip the rename — it's a smell, not a bug. If you decide it's not worth
   the production-history hassle, drop this item.

I lean toward option 1 (it's a real ergonomic win for cold-apply ordering).

---

### 2. 🔴 P1.8 — Stage 1 publish unblock (gated on user action)

**Problem.** `@pandotic/universal-cms` and `@pandotic/skill-library` haven't
published `0.2.0` to GitHub Packages. The Release workflow runs on every push
to main but never opens the "chore: version packages" PR that would bump and
publish, because GitHub disables bot-PR creation by default.

**Fix.** This is **not a Claude-doable task**. The user has to:

1. Go to https://github.com/pandotic/universal-cms/settings/actions
2. Under "Workflow permissions": confirm "Read and write permissions" is on.
3. Check ✅ "Allow GitHub Actions to create and approve pull requests".
4. Save.

Then push any commit to main. The Release workflow will detect pending
changesets in `.changeset/`, open a Version Packages PR, and merging that PR
publishes both packages. See `docs/RELEASE.md` § Pre-flight + § Troubleshooting
for the full diagnostic flow.

**Status.** Until this happens, P2.11 (CMS Deploy Wizard) cannot ship anything
useful — it depends on consumers being able to install `@pandotic/universal-cms`
from the registry.

---

### 3. 🟡 P2.10e — GitHub OAuth flow (~1 day)

**Problem.** `/fleet/onboard` Step 2 today asks the user to paste a Personal
Access Token, which:
- Is friction for non-technical operators.
- Stores the token in `localStorage` (browser-side, not encrypted at rest).
- Has no rotation or revocation flow.

**Goal.** Add a "Connect GitHub" button that initiates OAuth, exchanges the
code for a token, encrypts and stores it server-side per `hub_users`, and
makes future onboarding wizard runs skip the connect step if a token already
exists.

**Plan.**
- New migration `00522_user_github_tokens.sql` (or `00523` if you take item 1):
  - `ALTER TABLE hub_users ADD COLUMN github_access_token bytea` — pgcrypto-
    encrypted at write time using a server-side secret.
  - `ALTER TABLE hub_users ADD COLUMN github_username text`.
  - `ALTER TABLE hub_users ADD COLUMN github_token_scopes text[]`.
  - `ALTER TABLE hub_users ADD COLUMN github_token_updated_at timestamptz`.
- New API route `packages/fleet-dashboard/src/app/api/auth/github/route.ts`:
  - `GET` → redirects to GitHub OAuth authorize URL with state nonce.
  - `GET ?code=…&state=…` (callback variant) → exchanges code for token,
    encrypts, stores on `hub_users`, redirects back to `/fleet/onboard`.
- Wire onboarding wizard: replace Step 2's PAT input with a "Connect GitHub"
  button. If `hub_users.github_access_token` is non-null, skip Step 2 entirely
  and proceed to repo list.
- New helper in `packages/fleet-dashboard/src/lib/`: `getGithubTokenForUser(supabase, userId)`
  that decrypts and returns the token for use in API routes.
- Update `/api/github/repos` and `/api/github/detect` to use the stored token
  instead of accepting `?token=`.

**Files to touch.**
- `packages/fleet-dashboard/supabase/migrations/00522_user_github_tokens.sql` (new)
- `packages/fleet-dashboard/src/app/api/auth/github/route.ts` (new)
- `packages/fleet-dashboard/src/app/fleet/onboard/page.tsx` (replace PAT input)
- `packages/fleet-dashboard/src/app/api/github/repos/route.ts` (read from DB)
- `packages/fleet-dashboard/src/app/api/github/detect/route.ts` (read from DB)
- `packages/fleet-dashboard/src/lib/github-token.ts` (new helper)

**Env vars (new).**
- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `GITHUB_TOKEN_ENCRYPTION_KEY` (256-bit key for pgcrypto)

**QA.** Manual flow: fresh user with no token → click Connect → GitHub OAuth
prompt → callback → token stored → reload onboarding → Step 2 skipped → repo
list loads using the stored token.

**Reference.** `docs/FLEET_DASHBOARD_ROADMAP.md` § Phase 3e for the original
roadmap entry.

---

### 4. 🟡 P2.10f — Richer repo auto-detect (~0.5 day)

**Problem.** `/api/github/detect` currently sniffs `package.json` for the
`@pandotic/universal-cms` dependency and that's it. The preset picker shipped
in PR #87 sits on top of this but defaults to "None / use detected" because
no preset signal comes through.

**Goal.** When `cms.config.ts` exists in the repo, fetch it via GitHub
Contents API, parse the `cmsConfig.modules` block, infer the closest preset
by Jaccard overlap, and return it.

**Plan.**
- Extend `DetectResult` (in `/api/github/detect/route.ts` and the consuming
  page) with `detectedPreset: keyof typeof modulePresets | null` and
  `detectedModules: string[]`.
- Add a `cms.config.ts` fetch + a tolerant regex-based extractor for the
  `modules:` object (don't fully parse TypeScript — just pull the keys).
  Hand-rolled extractor is safer than a TS parser for a CI-time hot path.
- In `/fleet/onboard/page.tsx`: when `detectedPreset` is non-null and the user
  hasn't manually picked a preset yet, default `preset` state to it.

**Files to touch.**
- `packages/fleet-dashboard/src/app/api/github/detect/route.ts`
- `packages/fleet-dashboard/src/app/fleet/onboard/page.tsx`

**QA.** Test against three real repos:
- One with `@pandotic/universal-cms` + `cms.config.ts` modules matching `blog` → detects `blog`.
- One with `@pandotic/universal-cms` but no `cms.config.ts` → detects `null` preset, modules empty.
- One without the package → `hasCms: false`, no preset detection.

**Reference.** `docs/FLEET_DASHBOARD_ROADMAP.md` § Phase 3f.

---

### 5. 🟡 P2.11 — CMS Deploy Wizard at `/fleet/deploy` (~1.5 days)

**Problem.** Adding `@pandotic/universal-cms` to a greenfield property today
is a manual process: clone repo, install, scaffold `cms.config.ts`, run
migrations, push. Nothing in the Hub helps.

**Blocked on P1.8.** Until the package publishes, the wizard's deploy step
has nothing to install.

**Goal.** A 3-step wizard (mirrors `/fleet/onboard` shape) that takes a
property where `cms_installed = false` AND `platform_type = 'nextjs_supabase'`
and ships a PR to the property's GitHub repo adding cms-core as a dependency
with a chosen preset.

**Plan (3 steps).**
- Step 1: Select target. List eligible properties from `hub_properties` filter:
  `cms_installed = false`, `platform_type = 'nextjs_supabase'`,
  `github_repo IS NOT NULL`.
- Step 2: Configure. Reuse the same module preset picker from the onboarding
  wizard. Pick a Supabase project ref (or "I'll wire it manually").
- Step 3: Apply. Hits `/api/cms/deploy` which:
  1. Reads the user's GitHub token (depends on P2.10e shipping first; until
     then, fall back to a PAT input on Step 3).
  2. Generates the PR contents:
     - `package.json` patch — add `@pandotic/universal-cms@^0.2.0`.
     - `.npmrc` patch — add the GitHub Packages registry line.
     - `src/cms.config.ts` (new) — populated from the picked preset.
     - `src/lib/supabase/server.ts` (new) — boilerplate from
       `template/src/lib/supabase/server.ts`.
     - `src/middleware.ts` (new or patched) — boilerplate.
  3. Opens a PR via Octokit with all of the above.
  4. Updates `hub_properties.cms_installed = true` (or pending until PR merges
     — pick one and document).

**Files to touch.**
- `packages/fleet-dashboard/src/app/fleet/deploy/page.tsx` (new)
- `packages/fleet-dashboard/src/app/api/cms/deploy/route.ts` (new)
- `packages/fleet-dashboard/src/lib/cms-deploy/pr-builder.ts` (new — generates PR contents)
- Reuse `packages/skill-library/src/deploy/github-pr.ts` patterns for the Octokit
  shape — that file is the closest existing "create PR via API" implementation.

**QA.** End-to-end against a sandbox property with a real GitHub repo. Verify:
- PR opens with the expected file changes.
- PR title + body are descriptive.
- After merge, `pnpm install` succeeds in the consumer repo (depends on P1.8
  publish working).

**Reference.** `docs/FLEET_DASHBOARD_ROADMAP.md` § Phase 4.

---

### 6. 🟢 Manual ops carried over

These are user-side ops, not Claude-doable.

1. Apply migrations to Hub Supabase (`rimbgolutrxpmwsoswhq`):
   - `00517_team_hub_initiatives.sql`
   - `00521_api_central_bridge.sql`
2. Seed initiatives via `packages/fleet-dashboard/supabase/seed-initiatives.sql`.
3. Founder sign-ins — Allen / Matt / Scott each log into the Hub once so
   `public.users.auth_user_id` populates via the `handle_new_user` trigger.

---

## Suggested execution order for the next session

1. **Item 1** (00521 collision rename) — five minutes, gets out of the way.
2. **Item 4** (richer auto-detect) — half day, no new env vars, no production
   ops needed. Pure dev work.
3. **Item 3** (GitHub OAuth) — full day, needs new env vars set + OAuth app
   created on github.com.
4. **Item 5** (CMS Deploy Wizard) — last, because it depends on Items 2+3
   shipping AND on P1.8 publish working.

If P1.8 hasn't been done by the time you reach Item 5, you can still build
the wizard against the workspace-link version of the package — but the
end-to-end QA against a greenfield repo can't be done until publish lands.
