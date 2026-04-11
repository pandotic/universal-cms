# Universal CMS

A modular, config-driven CMS framework for Next.js + Supabase. Extract your admin panel, data layer, and content management into a reusable package.

## Architecture

```
universal-cms/
├── packages/
│   ├── cms-core/          # @pandotic/universal-cms — the CMS npm package
│   ├── admin-core/        # @universal-cms/admin-core — headless admin logic (RBAC, services, hooks)
│   ├── admin-ui/          # @universal-cms/admin-ui — React admin UI components
│   └── admin-schema/      # @universal-cms/admin-schema — Supabase SQL migrations for admin tables
├── apps/
│   └── dashboard/         # @universal-cms/dashboard — admin hub app (Vite + React)
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

## Admin Dashboard

The admin dashboard (`apps/dashboard/`) is a standalone Vite + React app that dogfoods the admin packages.

```bash
# Setup
cp apps/dashboard/.env.example apps/dashboard/.env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Run admin-schema migrations first (provides user_profiles, user_roles, organizations, etc.)
# Then run apps/dashboard/supabase/migrations/001_connected_apps.sql

# Build packages (order matters)
pnpm --filter @universal-cms/admin-core build
pnpm --filter @universal-cms/admin-ui build

# Start dashboard
pnpm --filter @universal-cms/dashboard dev
```

The dashboard is an **oversight hub** — it shows connected apps with health status and deep-links into each app's own admin UI. It does not remotely control other apps.

### Installing Admin Packages in Other Apps

```bash
# Via git dependency
pnpm add @universal-cms/admin-core@github:pandotic/universal-cms#main --filter your-app
# Or link locally during development
pnpm --filter your-app add @universal-cms/admin-core@workspace:*
```

## Development

```bash
# Typecheck everything
pnpm -r typecheck

# Build admin packages (order matters: admin-core before admin-ui)
pnpm --filter @universal-cms/admin-core build
pnpm --filter @universal-cms/admin-ui build

# Typecheck just cms-core
cd packages/cms-core && pnpm typecheck

# Typecheck just template
cd template && pnpm typecheck

# Typecheck dashboard
pnpm --filter @universal-cms/dashboard type-check
```

## License

MIT
