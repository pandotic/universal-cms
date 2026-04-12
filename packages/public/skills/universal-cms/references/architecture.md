# Universal CMS Architecture

Condensed architecture reference for the Universal CMS. This document is intended for Claude to quickly understand how the system fits together when scaffolding, debugging, or extending the CMS.

---

## Framework Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend framework | Next.js 16 (App Router) | `app/` directory, server components by default |
| Database + Auth | Supabase (PostgreSQL) | Hosted or local via `supabase start` |
| Styling | Tailwind CSS 4 | With `tailwindcss-animate` for transitions |
| Component library | shadcn/ui | Radix primitives, copy-pasted into `src/components/ui/` |
| Drag and drop | @dnd-kit | Used in media library, content ordering |
| Charts | Recharts | Admin dashboard analytics charts |
| Validation | Zod | API input validation, form schemas |
| Sanitization | isomorphic-dompurify | HTML content sanitization |
| Package manager | pnpm | Workspace-aware monorepo support |

---

## File Structure Overview

```
src/
  app/
    admin/                    # Admin panel (protected)
      layout.tsx              # Auth gate + AdminShell wrapper
      page.tsx                # Dashboard
      error.tsx               # Error boundary
      content-pages/          # One directory per module
      listicles/
      media/
      directory/
      categories/
      frameworks/
      glossary/
      certifications/
      careers-training/
      reviews/
      affiliates/
      analytics/
      forms/
      cta-blocks/
      seo/
      errors/
      activity/
      import/
      users/                  # Always present (core)
      settings/               # Always present (core)
      brand-guide/
    (public pages)/           # Public-facing routes
  components/
    admin/
      AdminShell.tsx          # Layout wrapper: sidebar + main area
      AdminSidebar.tsx        # Navigation driven by cmsConfig.adminNav
      CommandPalette.tsx      # Cmd+K quick navigation
      AdminDashboard.tsx      # Dashboard overview with stats
    ui/                       # shadcn/ui components
  lib/
    cms/
      cms.config.ts           # THE central config file
      index.ts                # Re-exports
    supabase/
      client.ts               # Browser Supabase client factory
      server.ts               # Server Supabase client (uses cookies)
      middleware.ts            # Middleware client for auth refresh
    security/
      rate-limit.ts           # In-memory rate limiter for API routes
      headers.ts              # CSP, HSTS, X-Frame-Options constants
      env-check.ts            # Validates required env vars at startup
      validation.ts           # Zod schemas for common inputs
    analytics/
      AnalyticsProvider.tsx   # React context, initializes providers
      providers.ts            # Adapters: GA4, GTM, PostHog, Rybbit, Meta, LinkedIn, custom
      track.ts                # Server-side tracking utilities
      useTrackEvent.ts        # Client-side React hook
      index.ts                # Barrel exports
    data/
      content-pages.ts        # One file per module (or shared)
      entities.ts
      categories.ts
      ...                     # See module-catalog.md for full list
      index.ts                # Barrel file (only export enabled modules)
    utils.ts                  # cn(), date formatters, slug generators
  middleware.ts               # Root middleware: auth refresh + /admin/* protection + redirects
supabase/
  migrations/
    00001_create_ratings_tables.sql
    00002_create_career_hub_tables.sql
    00003_core_cms_roles_profiles.sql   # ALWAYS required
    ...
    00022_forms_and_leads.sql
```

---

## Module System

Each CMS module follows a consistent pattern:

```
Module = Migration(s) + Data Layer + Admin Page(s) + Optional Public Page(s)
```

### Components of a Module

1. **Migration** (`supabase/migrations/00XXX_*.sql`) -- Creates tables, RLS policies, indexes, and seed data. Some modules share a migration (e.g., `contentPages` and `landingPages` both use `00004_content_pages.sql`). Some modules have no migration (e.g., `brandGuide` stores data in `site_settings`, `imagesSeo` is UI-only).

2. **Data Layer** (`src/lib/data/<module>.ts`) -- Server-side functions that read/write to Supabase. All functions use the server Supabase client. Functions are typed with Zod schemas for input validation.

3. **Admin Page** (`src/app/admin/<module>/`) -- Next.js App Router pages. Server components by default; client interactivity is isolated to specific `"use client"` components within the page tree.

4. **Public Page** (optional, `src/app/<route>/`) -- Public-facing pages that display module data. Not all modules have public pages (e.g., `errorLog`, `activityLog` are admin-only).

### Enabling/Disabling Modules

Modules are toggled via the `modules` record in `cms.config.ts`:

```ts
modules: {
  contentPages: true,
  landingPages: true,
  directory: false,   // Disabled -- admin page won't show, migration not needed
  ...
}
```

The `AdminSidebar` reads `cmsConfig.adminNav` and filters items by their `module` field -- items whose module is disabled are hidden automatically.

---

## Config-Driven Architecture

The entire CMS is parameterized through a single file: `src/lib/cms/cms.config.ts`.

### What the Config Controls

| Section | Purpose |
|---|---|
| `siteName`, `siteUrl`, `siteDescription`, `siteTagline` | Site identity, used in meta tags and admin UI |
| `primaryEntity` | The main entity type for directory sites (name, singular, plural, slugPrefix) |
| `modules` | `Record<CmsModuleName, boolean>` -- toggles each module on/off |
| `roles` | Available CMS roles (`admin`, `editor`, `moderator`) |
| `adminNav` | Sidebar navigation structure -- groups and items with module gating |
| `analytics.availableProviders` | Which analytics providers are configurable in admin settings |
| `storage` | Media bucket name, max file size, allowed MIME types |

### Helper Functions

- `isModuleEnabled(module)` -- checks if a module is enabled
- `getRequiredMigrations()` -- returns deduplicated sorted list of migrations for all enabled modules
- `modulesFromPreset(preset)` -- builds a `modules` record from a preset configuration
- `MODULE_MIGRATIONS` -- maps each module name to its required migration file(s)
- `MODULE_PRESETS` -- four preset configurations (App Marketing, Blog, Directory, Full Platform)
- `CORE_MIGRATIONS` -- migrations that are always required (`00003`, `00006`)

---

## Data Flow

### Read Path (Public)

```
Browser GET → Next.js Server Component → data layer function → Supabase (anon key, RLS enforced) → Response
```

### Write Path (Admin)

```
Browser POST → Next.js API Route → requireAdmin() middleware → data layer function → Supabase (service role or authed client) → Response
```

### requireAdmin() Gate

Every admin mutation goes through `requireAdmin()` which:

1. Reads the session from the Supabase auth cookie
2. Verifies the user exists
3. Checks the user's `profiles` table for an admin/editor/moderator role
4. Returns 401/403 if unauthorized
5. Returns the authenticated Supabase client if authorized

---

## RLS Security Model

All tables use Row Level Security (RLS). The core pattern:

### has_role() Function

Created by migration `00003_core_cms_roles_profiles.sql`:

```sql
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = required_role
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Typical RLS Policies

```sql
-- Public read access for published content
CREATE POLICY "Public can read published" ON content_pages
  FOR SELECT USING (status = 'published');

-- Admin full access
CREATE POLICY "Admins have full access" ON content_pages
  FOR ALL USING (has_role('admin'));

-- Editors can insert and update
CREATE POLICY "Editors can manage" ON content_pages
  FOR ALL USING (has_role('editor') OR has_role('admin'));
```

### Security Rules

- Never bypass RLS in client code
- The `service_role` key is only used server-side in API routes behind `requireAdmin()`
- The `anon` key is used for public reads (subject to RLS)
- Admin routes are protected at two levels: middleware (auth check) and RLS (database-level)

---

## Analytics System

### Architecture

The analytics system is provider-agnostic and configured at runtime via the admin settings page.

```
AnalyticsContextProvider (React Context)
  ├── Reads config from site_settings table
  ├── Initializes configured providers
  └── Tracks page views on route change

Supported Providers:
  ├── GA4 (Google Analytics 4)
  ├── GTM (Google Tag Manager)
  ├── PostHog
  ├── Rybbit
  ├── Meta Pixel
  ├── LinkedIn Insight
  └── Custom (arbitrary script injection)
```

### Configuration Flow

1. Admin sets provider IDs in `/admin/settings` (stored in `site_settings` table)
2. `AnalyticsContextProvider` fetches config on app load
3. Provider adapters (`providers.ts`) initialize scripts and expose a common interface
4. `track.ts` and `useTrackEvent.ts` provide server-side and client-side tracking APIs

### Usage

```tsx
// In root layout
<AnalyticsContextProvider>{children}</AnalyticsContextProvider>

// In components
const { trackEvent } = useTrackEvent();
trackEvent("click", { target: "cta_button" });
```

---

## Admin Shell

### Components

1. **AdminShell** (`AdminShell.tsx`) -- wraps all admin pages. Provides the sidebar, top bar, and main content area. Handles responsive layout.

2. **AdminSidebar** (`AdminSidebar.tsx`) -- renders navigation groups and items from `cmsConfig.adminNav`. Items with a `module` field are hidden if that module is disabled. Highlights the active route.

3. **CommandPalette** (`CommandPalette.tsx`) -- Cmd+K / Ctrl+K overlay. Provides fuzzy search over admin nav items for quick navigation. Mounted in the admin layout.

4. **AdminDashboard** (`AdminDashboard.tsx`) -- the admin home page. Shows summary stats (content count, recent activity, etc.) and quick-action cards.

### Admin Layout Structure

```tsx
// src/app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
```

The `AdminShell` handles:
- Auth verification (redirects to login if not authenticated)
- Role verification (shows 403 if user lacks admin/editor role)
- Sidebar rendering with module-aware navigation
- Command palette mounting
- Responsive collapse for mobile

---

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Optional:
```
NEXT_PUBLIC_SITE_URL=https://example.com
```

The `env-check.ts` utility validates these at startup and throws descriptive errors if missing.
