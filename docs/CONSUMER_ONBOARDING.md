# Consumer Onboarding — greenfield site on `@pandotic/universal-cms`

This walks you from **empty directory → running Next.js site backed by
the published `@pandotic/universal-cms` package**. It is the canonical
"first site" runbook for the Stage 1 rollout.

For the publisher side (releases, changesets, the version-bump workflow),
see [`PUBLISHING.md`](../PUBLISHING.md) and [`docs/RELEASE.md`](./RELEASE.md).

---

## Prerequisites

- Node 20+ and pnpm 9+ (`corepack enable` works).
- A GitHub account with read access to the `pandotic` org.
- A Supabase account.
- The latest published version of the package — confirm at
  https://github.com/pandotic/universal-cms/pkgs/npm/universal-cms

## 1. Create the GitHub Personal Access Token

GitHub Packages requires auth even for read-only installs.

1. Go to https://github.com/settings/tokens/new?scopes=read:packages
2. Name it (e.g. "pandotic packages — local"), set expiry, generate.
3. Copy the `ghp_...` token.
4. Export it in your shell rc:

   ```bash
   echo 'export NODE_AUTH_TOKEN=ghp_...' >> ~/.zshrc
   source ~/.zshrc
   ```

## 2. Bootstrap from `template/`

The template lives inside the monorepo; copy it out:

```bash
git clone --depth 1 https://github.com/pandotic/universal-cms.git /tmp/ucms
cp -R /tmp/ucms/template my-new-site
rm -rf /tmp/ucms my-new-site/node_modules
cd my-new-site
git init && git add . && git commit -m "chore: bootstrap from universal-cms template"
```

In `my-new-site/package.json`, replace the workspace dep with the
published version:

```diff
-    "@pandotic/universal-cms": "workspace:*",
+    "@pandotic/universal-cms": "^0.2.0",
```

(Pin to the exact version in production. Check the Packages page above
for the current `latest`.)

## 3. Install dependencies

The template ships a `.npmrc` that points `@pandotic/*` at GitHub
Packages and reads `${NODE_AUTH_TOKEN}` — no extra config needed.

```bash
pnpm install
```

If you see `401 Unauthorized` or `404 Not Found`, your token isn't
exported in this shell — re-source your rc, or pass it inline:
`NODE_AUTH_TOKEN=ghp_... pnpm install`.

## 4. Provision Supabase + apply migrations

1. Create a new Supabase project at https://supabase.com/dashboard.
2. Project settings → API → copy `URL`, `anon` key, `service_role` key.
3. Copy the env template and fill in:

   ```bash
   cp .env.example .env.local
   # Fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   # SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY (for /admin AI chat)
   ```

4. Link the Supabase CLI and push the per-site schema:

   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```

   This applies all migrations under `supabase/migrations/` (00001…). They
   are idempotent — safe to re-run.

## 5. Run locally

```bash
pnpm dev
```

Smoke checks:

- `http://localhost:3000/` — public homepage renders.
- `http://localhost:3000/admin` — login page. Create a user via Supabase
  Auth dashboard, sign in, then in the Supabase SQL editor:

  ```sql
  update public.users
     set role = 'super_admin'
   where auth_user_id = '<your auth user uuid>';
  ```

  Reload `/admin` — full admin shell loads.

## 6. Deploy to Netlify

The template includes `netlify.toml` ready to go.

1. Create a Netlify site from the new GitHub repo.
2. Site settings → Environment variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `NODE_AUTH_TOKEN` — the **same PAT** from step 1, or a fine-grained
     token scoped to `Packages: Read` on the `pandotic` org.
3. Trigger a deploy. `pnpm install` will resolve `@pandotic/*` from
   GitHub Packages using the env token.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npm install` 404 on `@pandotic/universal-cms` | `.npmrc` missing or `NODE_AUTH_TOKEN` not exported in the install shell. Verify with `echo $NODE_AUTH_TOKEN`. |
| `npm install` 401 | PAT lacks `read:packages` scope or has expired. Regenerate. |
| `supabase db push` errors on a table that already exists | Migrations are idempotent for new schemas, but if you have a pre-existing schema with conflicting tables, drop them first or apply migrations selectively via the Supabase SQL editor. |
| `/admin` returns 401 after login | Confirm `public.users` has a row with `auth_user_id` matching your Supabase auth user, and `role` is set to `super_admin`. The `handle_new_user` trigger should populate this on first sign-in. |
| Netlify build fails resolving `@pandotic/*` | `NODE_AUTH_TOKEN` env var not set in Netlify Site Settings. |

## What this guide doesn't cover (yet)

- **Adapting an existing Next.js site** to consume the package — that's
  follow-up after Stage 1 proves the greenfield flow.
- **Picking a module preset** (`appMarketing`, `blog`, `directory`,
  `full`) — see `docs/module-catalog.md` for module descriptions; default
  preset works for most marketing sites.
- **Hub registration** — registering the new site with the Pandotic Hub
  for cross-property dashboards. See `packages/fleet-dashboard/README.md`
  once a property record exists.
