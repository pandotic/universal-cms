# Publishing & Consuming `@pandotic/universal-cms`

The CMS package is published to **GitHub Packages** under the `@pandotic` scope
at `https://npm.pkg.github.com`. It is not on public npm.

## How releases work

1. Make changes in `packages/cms-core/`.
2. Add a changeset: `pnpm changeset` — describe the change and pick a bump
   (patch / minor / major). Commit the generated file in `.changeset/`.
3. Open a PR to `main`. CI runs tests + build.
4. Merge to `main`. The **Release** workflow (`.github/workflows/release.yml`)
   either opens a "Version Packages" PR (if changesets are pending) or
   publishes to GitHub Packages (if a Version Packages PR just merged).

Publishing is automatic — no local `npm publish` needed. The workflow uses the
built-in `GITHUB_TOKEN` with `packages: write` permission, so no extra secrets
to configure.

## How each consumer site installs it

Each of the 10 sites needs **two things** before `pnpm add @pandotic/universal-cms`
works:

### 1. `.npmrc` at the repo root

```ini
@pandotic:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Commit this file. It tells pnpm that anything scoped `@pandotic/*` comes from
GitHub Packages, and reads the auth token from the `NODE_AUTH_TOKEN` env var.

### 2. `NODE_AUTH_TOKEN` environment variable

- **Locally**: create a GitHub **Personal Access Token (classic)** with the
  `read:packages` scope. Export it:
  ```bash
  export NODE_AUTH_TOKEN=ghp_...
  ```
  Or add to `~/.zshrc` / `.env.local` (gitignored).

- **Netlify**: in Site settings → Environment variables, add
  `NODE_AUTH_TOKEN` = your PAT (or a fine-grained token with
  `Packages: Read` on the `pandotic` org).

- **GitHub Actions on the consumer repo**: use the built-in `${{ secrets.GITHUB_TOKEN }}`
  if the token has `packages: read` permission, otherwise create a PAT secret.

### 3. Install

```bash
pnpm add @pandotic/universal-cms@^0.1
```

Pinning to exact version (`"@pandotic/universal-cms": "0.1.0"` without caret) is
recommended for production sites so upgrades are deliberate.

## Upgrading a consumer site

```bash
pnpm up @pandotic/universal-cms@latest
# or to a specific version
pnpm up @pandotic/universal-cms@0.2.0
```

After upgrading:
1. Check the release notes / CHANGELOG for new or changed migrations.
2. Apply any new migrations to your Supabase project (they are idempotent, so
   re-applying older ones is safe).
3. Run `pnpm typecheck` and `pnpm build` locally before pushing.
4. The Pandotic Hub's `hub_package_deployments` table will reflect the new
   installed version once the site's `/api/admin/health` is hit.

## Troubleshooting

- **`401 Unauthorized` on install** — your `NODE_AUTH_TOKEN` is missing or
  lacks `read:packages` on the `pandotic` org. Regenerate with the correct
  scope.
- **`404 Not Found`** on a package version — check the GitHub Packages page at
  https://github.com/pandotic/universal-cms/pkgs/npm/universal-cms to confirm
  the version was published.
- **Local dev inside the monorepo** — consumer sites inside this workspace keep
  using `workspace:*` and resolve to `src/` via the `development` conditional
  export. GitHub Packages only matters for external repos.
