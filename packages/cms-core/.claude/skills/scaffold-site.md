# Scaffold a New Universal CMS Site

Scaffold a new Next.js project that uses `@pandotic/universal-cms`.

## Steps

1. Create a new directory for the project (ask the user for the project name).
2. Initialize the project with `pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`.
3. Install the CMS package: `pnpm add @pandotic/universal-cms`.
4. Install peer dependencies: `pnpm add @supabase/supabase-js @supabase/ssr zod class-variance-authority lucide-react`.
5. Copy the template files from `packages/cms-core/../../template/` as a reference:
   - `src/cms.config.ts` — Edit `siteName`, `siteUrl`, `siteDescription`, `siteTagline`, and `primaryEntity` for the new site.
   - `src/app/admin/` — All admin pages.
   - `src/app/api/admin/` — All admin API routes.
   - `src/lib/supabase/` — Supabase client helpers (server, client, middleware).
   - `src/middleware.ts` — Next.js middleware for auth.
6. Ask the user which module preset to use (`starter`, `blog`, `directory`, `full`).
7. Update `cms.config.ts` with the chosen preset.
8. Create `.env.local` with placeholder Supabase keys.
9. Run `pnpm dev` to verify the project starts.

## Config Template

```typescript
import { modulesFromPreset, modulePresets } from "@pandotic/universal-cms/config";
import type { CmsConfig } from "@pandotic/universal-cms/config";

export const cmsConfig: CmsConfig = {
  siteName: "PROJECT_NAME",
  siteUrl: "https://PROJECT_DOMAIN",
  siteDescription: "PROJECT_DESCRIPTION",
  siteTagline: "PROJECT_TAGLINE",
  primaryEntity: {
    name: "entities",
    singular: "Entity",
    plural: "Entities",
    slugPrefix: "/directory",
  },
  modules: modulesFromPreset(modulePresets.PRESET),
  roles: ["admin", "editor"],
  adminNav: [
    { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
    { label: "Content", href: "/admin/content-pages", icon: "FileText" },
    { label: "Media", href: "/admin/media", icon: "Image" },
    { label: "Settings", href: "/admin/settings", icon: "Settings" },
  ],
  analytics: { availableProviders: ["ga4", "gtm", "posthog", "custom"] },
  storage: {
    mediaBucket: "media",
    maxFileSizeMb: 10,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "application/pdf"],
  },
};
```
