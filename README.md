# Universal CMS

A modular, config-driven CMS framework for Next.js + Supabase. Extract your admin panel, data layer, and content management into a reusable package.

## Architecture

```
universal-cms/
├── packages/
│   ├── cms-core/          # @pandotic/universal-cms — the CMS npm package
│   ├── fleet-dashboard/   # @pandotic/fleet-dashboard — Pandotic Hub (Next.js 16)
│   ├── skill-library/     # @pandotic/skill-library — marketing skills + deployment adapters
│   └── admin-schema/      # @universal-cms/admin-schema — legacy admin SQL migrations (reference)
├── apps/
│   ├── pandotic-site/     # @pandotic/pandotic-site — marketing site (Next.js)
│   └── dashboard/         # @universal-cms/dashboard — legacy Vite admin (superseded by fleet-dashboard)
├── template/              # Starter Next.js 16 app (uses cms-core)
└── docs/                  # Documentation
```

### Admin System (Three-Tier Model)

The admin packages implement a three-tier permission model:

| Tier | Role | Scope |
|------|------|-------|
| Platform Admin | `platform_admin` | Full system access across all orgs and entities |
| Group Admin | `org_admin` | Manages a specific organization and its members |
| Entity Admin | `entity_admin` | Manages specific entities they own or are assigned |

**Entity Adapter Pattern**: Apps define an `EntityAdapter` to tell the admin system what their domain entity is (e.g., "Home" in HomeDoc, "Concert" in ConcertBucket). The admin-ui components render list/detail views based on this adapter.

```typescript
import type { EntityAdapter } from '@universal-cms/admin-core';

const myAdapter: EntityAdapter = {
  entityName: 'Widget',
  entityNamePlural: 'Widgets',
  tableName: 'widgets',
  ownerColumn: 'user_id',
  displayColumn: 'title',
  fields: [
    { key: 'title', label: 'Title', type: 'text', showInList: true, showInDetail: true, isPrimary: true },
    { key: 'status', label: 'Status', type: 'select', showInList: true, showInDetail: true,
      options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] },
  ],
};
```

## Quick Start

> **Standing up a new site that consumes the published package?**
> See [`docs/CONSUMER_ONBOARDING.md`](./docs/CONSUMER_ONBOARDING.md) for
> the greenfield runbook (PAT setup, `.npmrc`, Supabase, Netlify).
> The steps below are for working **inside this monorepo**.

### 1. Clone and install

```bash
git clone https://github.com/pandotic/universal-cms.git my-cms
cd my-cms
pnpm install
```

### 2. Configure Supabase

Copy the env template and fill in your Supabase credentials:

```bash
cp template/.env.example template/.env.local
```

### 3. Run migrations

Apply the SQL migrations to your Supabase project (via the Supabase dashboard or CLI):

```bash
cd template
npx supabase db push
```

### 4. Customize your config

Edit `template/src/cms.config.ts` to set your site name, enable/disable modules, and configure navigation.

### 5. Start developing

```bash
cd template
pnpm dev
```

Visit `http://localhost:3000/admin` to see the admin panel.

## Key Concepts

### Config-Driven Modules

Every CMS feature is a **module** that can be enabled/disabled in `cms.config.ts`:

```typescript
import { modulesFromPreset, modulePresets } from "@pandotic/universal-cms/config";

export const cmsConfig: CmsConfig = {
  siteName: "My Site",
  modules: modulesFromPreset(modulePresets.blog), // or .directory, .full
  // ...
};
```

### Supabase Client Injection

All data functions accept a `SupabaseClient` as their first parameter — no global state:

```typescript
import { getAllContentPages } from "@pandotic/universal-cms/data/content";
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const pages = await getAllContentPages(supabase);
```

### Module Presets

| Preset | Modules | Use Case |
|--------|---------|----------|
| `appMarketing` | 7 | SaaS landing pages |
| `blog` | 10 | Content/blog site |
| `directory` | 17 | Directory/marketplace |
| `full` | 31 | Everything enabled |

## Package Exports

```typescript
// Config & types
import { CmsConfig, modulesFromPreset } from "@pandotic/universal-cms/config";
import type { ContentPage, MediaItem } from "@pandotic/universal-cms/types";

// Data layer (17 modules)
import { getAllContentPages } from "@pandotic/universal-cms/data/content";
import { getAllMedia } from "@pandotic/universal-cms/data/media";
import { getAllSettings } from "@pandotic/universal-cms/data/settings";
// ... and more

// Components
import { AdminShell, CmsProvider } from "@pandotic/universal-cms/components/admin";
import { Button, Card, Table } from "@pandotic/universal-cms/components/ui";
import { ThemeProvider, ThemeToggle } from "@pandotic/universal-cms/components/theme";

// AI
import { getCmsTools, getSystemPrompt } from "@pandotic/universal-cms/ai";

// Utilities
import { cn } from "@pandotic/universal-cms/utils";
import { rateLimit, validateInput } from "@pandotic/universal-cms/security";
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS v4, semantic color tokens
- **UI:** shadcn/ui components (bundled)
- **AI:** Anthropic Claude (optional)
- **Language:** TypeScript (strict)

## Admin Dashboards

Two admin surfaces ship in this repo:

- **Pandotic Hub** (`packages/fleet-dashboard/`) — the active cross-property mission control. Next.js 16, deployed on Netlify. This is what founders use day-to-day.
- **Legacy Vite dashboard** (`apps/dashboard/`) — an older oversight hub, kept for reference. Superseded by fleet-dashboard; do not extend.

Per-site marketing/app admin lives in `@pandotic/universal-cms` (cms-core) and is rendered inside each consuming site's `/admin` route.

## Development

```bash
# Install
pnpm install

# Typecheck everything
pnpm -r typecheck

# Tests (66 in cms-core)
pnpm test

# Build the publishable packages
pnpm build

# Build the Hub + template (what CI also runs)
pnpm --filter @pandotic/fleet-dashboard build
pnpm --filter universal-cms-template build
```

## License

MIT
