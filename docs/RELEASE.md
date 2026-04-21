# Release Runbook — publishing to GitHub Packages

Target registry: `https://npm.pkg.github.com` (private, org-scoped).
Publishable packages (workspace):

- `@pandotic/universal-cms` (cms-core)
- `@pandotic/skill-library`

Internal-only (not published): `@pandotic/fleet-dashboard`, `@pandotic/pandotic-site`, `@universal-cms/admin-schema`.

---

## How the pipeline is supposed to work

1. A PR lands on `main` containing one or more files in `.changeset/`.
2. `.github/workflows/release.yml` runs on push to main.
3. `changesets/action@v1` detects pending changesets → opens a **"chore: version packages"** PR that:
   - Bumps `version` in each package's `package.json`.
   - Updates `CHANGELOG.md` per package.
   - Deletes the consumed `.changeset/*.md` files.
4. You review + merge the Version Packages PR.
5. That merge re-triggers `release.yml`. No pending changesets this time → action runs `pnpm release` → `pnpm build && changeset publish` → tarball goes to GitHub Packages.
6. `createGithubReleases: true` creates a GitHub Release per package version for visibility.

---

## 🚨 Pre-flight: repo setting that's almost certainly blocking you

GitHub **disables bot-authored PRs by default** on repos. If the Version Packages PR never shows up even with a perfectly-configured workflow, this is why.

### Fix (one-time, user action)

1. Go to **Settings → Actions → General** on the repo:
   https://github.com/pandotic/universal-cms/settings/actions

2. Scroll to **"Workflow permissions"**.

3. Confirm **"Read and write permissions"** is selected (vs "Read repository contents and packages").

4. Check **✅ Allow GitHub Actions to create and approve pull requests**.

5. Save.

The workflow itself already has the correct `permissions:` block (`contents: write`, `pull-requests: write`, `packages: write`) — but org/repo-level settings gate the action. Both need to agree.

---

## Consumer setup (for sites installing `@pandotic/universal-cms`)

New sites need a `.npmrc` in the project root + a `NODE_AUTH_TOKEN` env var pointing at a GitHub PAT that has `read:packages` scope.

```ini
# .npmrc
@pandotic:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

- **Local dev:** set `NODE_AUTH_TOKEN` in your shell profile.
- **Netlify:** set the env var in site settings.
- **GitHub Actions (for other repos):** use the built-in `GITHUB_TOKEN` via `registry-url: https://npm.pkg.github.com` in `setup-node`.

See `PUBLISHING.md` for full details.

---

## Troubleshooting after merging a PR

### Workflow didn't run at all

- Check Actions tab → Release workflow exists and is enabled.
- Push may have been from a protected-branch rule that skips workflows.

### Workflow ran but no Version PR appeared

Most likely: bot-PR creation is disabled (see Pre-flight above). Check the `Report changesets outputs` step at the end of the workflow run:

- `hasChangesets=true` + no `pullRequestNumber` → settings/permissions issue.
- `hasChangesets=false` → no pending changesets to release (someone may have already consumed them).

### Version PR opened but `pnpm release` failed

Typical causes:

- `pnpm build` fails (a workspace dep is broken). Fix locally, commit, rerun.
- Publish auth fails with 401/403: the token lacks `packages: write` scope. Confirm the workflow's `permissions:` block has `packages: write`.
- Package already exists at that version: a prior publish succeeded partially. Bump the version manually or use `changeset version` again.

### A package published to npmjs.org instead of GitHub Packages

Check the package's `publishConfig.registry` in its `package.json`. It should be `https://npm.pkg.github.com`. Both `@pandotic/universal-cms` and `@pandotic/skill-library` have this set.

---

## Creating a new changeset (for future changes)

From the repo root:

```bash
pnpm changeset
```

Walks you through:
1. Which packages changed.
2. Major / minor / patch bump for each.
3. A summary describing the change (ends up in CHANGELOG.md).

Commits to `.changeset/<random>.md`. When that PR merges to main, the release workflow takes over.
