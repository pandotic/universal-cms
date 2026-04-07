# Getting Started

## Prerequisites

- Node.js 18+
- pnpm 9+
- A Supabase project (free tier works)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/pandotic/universal-cms.git my-cms
cd my-cms
pnpm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project. Copy the following from your project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure environment

```bash
cp template/.env.example template/.env.local
```

Edit `template/.env.local` with your Supabase credentials.

### 4. Run database migrations

Apply the SQL migrations to your Supabase project. You can do this via the Supabase SQL editor (paste each file) or via the CLI:

```bash
cd template
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The migrations create all necessary tables: content pages, media, reviews, activity log, error log, settings, and more.

### 5. Configure your CMS

Edit `template/src/cms.config.ts`:

```typescript
import { modulesFromPreset, modulePresets, type CmsConfig } from "@pandotic/universal-cms/config";

export const cmsConfig: CmsConfig = {
  siteName: "Your Site Name",
  siteUrl: "https://yoursite.com",
  siteDescription: "A brief description of your site",
  siteTagline: "Your tagline",

  primaryEntity: {
    name: "entities",
    singular: "Company",
    plural: "Companies",
    slugPrefix: "/directory",
  },

  // Choose a preset or customize
  modules: modulesFromPreset(modulePresets.directory),

  roles: ["admin", "editor"],

  adminNav: [
    // Configure your sidebar navigation
  ],

  analytics: {
    availableProviders: ["ga4", "posthog"],
  },

  storage: {
    mediaBucket: "media",
    maxFileSizeMb: 10,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
};
```

### 6. Start the dev server

```bash
cd template
pnpm dev
```

Visit `http://localhost:3000/admin` to see your admin panel.

## Creating Admin Pages

Each admin page follows this pattern:

```tsx
// template/src/app/admin/my-section/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, Button } from "@pandotic/universal-cms/components/ui";

export default function MySectionPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/my-section")
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Render your UI
}
```

## Creating API Routes

Each API route creates a Supabase client and passes it to data functions:

```typescript
// template/src/app/api/admin/my-section/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getMyData } from "@pandotic/universal-cms/data/my-module";

export async function GET() {
  try {
    const supabase = await createAdminClient();
    const data = await getMyData(supabase);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

## Adding a New Module

1. Create the SQL migration in `template/supabase/migrations/`
2. Add the data functions to `packages/cms-core/src/data/`
3. Add the admin page in `template/src/app/admin/`
4. Add the API route in `template/src/app/api/admin/`
5. Add the module to `CmsModuleName` in `packages/cms-core/src/config.ts`
6. Enable it in your `cms.config.ts`
7. Add navigation in your `adminNav` config

## Theming

The CMS uses semantic color tokens via CSS custom properties:

- `bg-surface`, `bg-surface-secondary`, `bg-surface-tertiary`
- `text-foreground`, `text-foreground-secondary`, `text-foreground-tertiary`
- `border-border`, `border-border-strong`

Customize colors in `template/src/app/globals.css` under `:root` and `.dark`.

Admin theme overrides can be managed via the Settings page (stored in `site_settings` table).
