# Universal CMS

A modular, config-driven CMS framework for Next.js + Supabase. Extract your admin panel, data layer, and content management into a reusable package.

## Architecture

```
universal-cms/
├── packages/cms-core/     # @pandotic/universal-cms — the npm package
│   └── src/
│       ├── ai/            # AI chat (Anthropic SDK)
│       ├── components/    # Admin shell, UI library, theme
│       ├── config.ts      # Module system, presets, types
│       ├── data/          # 17 data modules (Supabase queries)
│       ├── security/      # Rate limiting, validation, headers
│       ├── types/         # Shared TypeScript types
│       └── utils/         # cn(), contrast, colors
├── template/              # Starter Next.js 16 app
│   ├── src/app/admin/     # Admin pages
│   ├── src/app/api/       # API routes
│   └── supabase/          # SQL migrations (24 files)
└── docs/                  # Documentation
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

## Development

```bash
# Typecheck everything
pnpm -r typecheck

# Typecheck just cms-core
cd packages/cms-core && pnpm typecheck

# Typecheck just template
cd template && pnpm typecheck
```

## License

MIT
