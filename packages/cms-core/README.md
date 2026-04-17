# @pandotic/universal-cms

Universal CMS for Next.js + Supabase sites. Modular admin panel, data functions,
middleware, UI primitives, and AI helpers — all consumed via subpath exports so you
only pay for what you import.

## Install

```bash
pnpm add @pandotic/universal-cms
```

Peer deps you're expected to have in your Next.js app:

- `next >= 14`
- `react >= 18` / `react-dom >= 18`
- `@supabase/supabase-js >= 2` and `@supabase/ssr >= 0.5`
- `tailwindcss >= 4`, `class-variance-authority`, `zod`
- `lucide-react >= 0.4` (optional — icons in admin components)
- `@anthropic-ai/sdk >= 0.30` (optional — only for `./ai` helpers)

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# Optional — only if you use ./ai helpers or AI admin chat
ANTHROPIC_API_KEY=sk-ant-...
```

## Supabase migrations

This package **does not** ship SQL migrations inside the npm tarball. Source them
from the `template/supabase/migrations/` directory in the monorepo (migrations
`00001`–`00026`). All migrations are idempotent (`IF NOT EXISTS` / `DROP ...
IF EXISTS` + `CREATE`), so they are safe to apply to a Supabase project that
already contains some overlapping tables.

Easiest path for a new project: copy `template/` as your starter. Easiest path for
an existing site: use the **Pandotic Hub deploy wizard** (`/fleet/deploy`) to open
a PR that copies the needed migrations, `cms.config.ts`, and admin routes into
your repo.

Which migrations you need depends on the CMS modules you've enabled in your
`cms.config.ts`. `@pandotic/universal-cms/config` exports `CORE_MIGRATIONS` and
`MODULE_MIGRATIONS` so your build step can compute the exact list.

## Subpath exports (commonly used)

```ts
// Config + presets
import type { CmsConfig } from "@pandotic/universal-cms/config";

// Admin shell + UI
import { AdminShell } from "@pandotic/universal-cms/components/admin";
import { Card, Button } from "@pandotic/universal-cms/components/ui";

// Auth + middleware
import { requireAdmin } from "@pandotic/universal-cms/middleware";

// Data functions (client-injection pattern)
import { listContentPages } from "@pandotic/universal-cms/data/content";
import { listMedia } from "@pandotic/universal-cms/data/media";

// Hub (cross-property / fleet) — only needed by the Pandotic Hub dashboard
import { listProperties } from "@pandotic/universal-cms/data/hub";
```

The full list of subpath exports is in `package.json` under `exports`.

## Design tenets

- **Client-injection**: every data function takes a `SupabaseClient` as its first
  argument. No global state, no hidden singletons — the caller decides which
  project to talk to.
- **ESM-only** with tree-shakable subpath exports. `splitting: true` in tsup means
  importing one module does not pull in unrelated ones.
- **`development` conditional resolution**: in the monorepo, subpath imports
  resolve to `src/` so you get live TypeScript without rebuilding. Published
  consumers resolve to `dist/`.

## Upgrading

See [`UPGRADE.md`](../../UPGRADE.md) in the monorepo root for the semver policy
and the per-version upgrade checklist.

## Related

- `template/` — working Next.js 16 starter that consumes this package
- `packages/fleet-dashboard/` — Pandotic Hub (cross-property operations dashboard)
- `packages/cms-core/src/cli/README.md` — interactive `setup-admin` wizard for
  adding the admin surface to an existing Next.js project
