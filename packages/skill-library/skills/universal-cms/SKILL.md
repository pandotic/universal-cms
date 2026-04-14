---
name: universal-cms
version: 1.0.0
description: Scaffold a production-ready CMS with admin panel, analytics, and content management for any Next.js + Supabase site
category: fullstack
triggers:
  - cms
  - admin panel
  - content management
  - supabase cms
companions: []
---

# Universal CMS Scaffolding Skill

You are an expert at scaffolding and maintaining the Universal CMS -- a modular, config-driven content management system built on Next.js (App Router) and Supabase. The CMS powers admin panels, analytics dashboards, content pages, directory/marketplace sites, and more.

The reference implementation lives in the ESGsource repository. When porting to a new project you copy the relevant files, adjust `cms.config.ts`, and run the required migrations.

---

## When to Use

Activate this skill when the user wants to:

- Add a CMS or admin panel to a Next.js project
- Set up content pages, media library, or landing page management
- Add analytics tracking (GA4, GTM, PostHog, Rybbit, Meta Pixel, etc.)
- Create a directory or marketplace site with entities, categories, reviews
- Port the Universal CMS to a brand-new project
- Enable or disable CMS modules on an existing installation
- Troubleshoot CMS configuration, migrations, or admin pages

---

## Prerequisites

Before scaffolding, confirm the target project has:

1. **Next.js 14+** with App Router (`app/` directory)
2. **Supabase project** -- either local (`supabase start`) or hosted on supabase.com
3. **TypeScript** enabled
4. **Tailwind CSS** installed (v3 or v4)
5. **pnpm** as package manager (npm/yarn work but pnpm is expected)

---

## Scaffolding Workflow

Follow these steps in order. Do NOT skip steps.

### Step 1: Ask Configuration

Before writing any code, ask the user which **preset** to use:

| Preset | Description | Modules |
|---|---|---|
| **App Marketing Site** | Landing pages, blog, media, basic SEO | contentPages, landingPages, mediaLibrary, brandGuide, forms, ctaManager, seo, redirects, errorLog |
| **Blog / Content Site** | Articles, SEO tools, link management | contentPages, landingPages, mediaLibrary, listicles, brandGuide, forms, ctaManager, seo, redirects, linkChecker, internalLinks, imagesSeo, errorLog, activityLog |
| **Directory / Marketplace** | Entities, reviews, affiliates, full SEO | contentPages, landingPages, mediaLibrary, listicles, brandGuide, directory, categories, frameworks, glossary, certifications, reviews, affiliates, clickAnalytics, merchants, ratings, compareTools, forms, ctaManager, seo, redirects, linkChecker, internalLinks, imagesSeo, errorLog, activityLog, bulkImport |
| **Full Platform** | All 31 modules enabled | Every module |
| **Custom** | User picks individual modules | User-selected |

Also ask for **site-specific configuration**:

- `siteName` -- display name (e.g. "My SaaS App")
- `siteUrl` -- production URL (e.g. "https://example.com")
- `siteDescription` -- one-line description for meta tags
- `primaryEntity.name` -- the main entity type if using directory module (e.g. "tools", "companies", "products")
- `primaryEntity.slugPrefix` -- URL prefix for entity pages (e.g. "/directory", "/tools")

### Step 2: Install Dependencies

Run in the target project:

```bash
pnpm add @supabase/ssr @supabase/supabase-js recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities isomorphic-dompurify zod
pnpm add -D tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
```

Future (when npm package is published):
```bash
pnpm add @pandotic/universal-cms
```

### Step 3: Copy Core Files

Copy these files from the ESGsource reference repo (`/home/user/esgsource/`), adapting imports and config values:

#### 3a. CMS Config
- `src/lib/cms/cms.config.ts` -- copy and update with the site-specific values from Step 1. Set each module's boolean in the `modules` record based on the chosen preset. Update `siteName`, `siteUrl`, `siteDescription`, `primaryEntity`, and `adminNav` to match.
- `src/lib/cms/index.ts` -- re-exports for convenience.

#### 3b. Supabase Clients
- `src/lib/supabase/client.ts` -- browser client factory
- `src/lib/supabase/server.ts` -- server client factory (uses cookies)
- `src/lib/supabase/middleware.ts` -- middleware client for auth refresh

#### 3c. Auth Middleware
- `src/middleware.ts` -- refreshes Supabase auth on every request, protects `/admin/*` routes

#### 3d. Security Utilities
- `src/lib/security/rate-limit.ts` -- in-memory rate limiter for API routes
- `src/lib/security/headers.ts` -- security header constants (CSP, HSTS, etc.)
- `src/lib/security/env-check.ts` -- validates required env vars at startup
- `src/lib/security/validation.ts` -- zod schemas for common inputs

#### 3e. Admin Shell Components
- `src/components/admin/AdminShell.tsx` -- main layout wrapper for admin pages
- `src/components/admin/AdminSidebar.tsx` -- sidebar navigation driven by `cmsConfig.adminNav`
- `src/components/admin/CommandPalette.tsx` -- Cmd+K command palette for quick navigation
- `src/components/admin/AdminDashboard.tsx` -- dashboard overview page

#### 3f. Admin Layout and Entry
- `src/app/admin/layout.tsx` -- admin root layout with auth gate and shell
- `src/app/admin/page.tsx` -- admin dashboard page
- `src/app/admin/error.tsx` -- admin error boundary

#### 3g. Analytics Layer
Copy the entire `src/lib/analytics/` directory:
- `AnalyticsProvider.tsx` -- React context provider, initializes configured providers
- `providers.ts` -- provider adapters (GA4, GTM, PostHog, Rybbit, Meta Pixel, LinkedIn, custom)
- `track.ts` -- server-side tracking utilities
- `useTrackEvent.ts` -- React hook for client-side event tracking
- `index.ts` -- barrel exports

#### 3h. Data Access Layer
Copy files from `src/lib/data/` matching enabled modules:
- `content-pages.ts` -- contentPages, landingPages
- `media.ts` -- mediaLibrary
- `listicles.ts` -- listicles
- `entities.ts` -- directory
- `categories.ts`, `category-content.ts` -- categories
- `frameworks.ts` -- frameworks
- `glossary.ts` -- glossary
- `certifications.ts` -- certifications
- `careers.ts`, `careers-supabase.ts`, `careers-client.ts` -- careerHub
- `ratings.ts` -- ratings
- `click-analytics.ts` -- clickAnalytics
- `affiliates.ts` -- affiliates
- `forms.ts` -- forms
- `cta-blocks.ts` -- ctaManager
- `internal-links.ts` -- internalLinks
- `link-checker.ts` -- linkChecker
- `error-log.ts` -- errorLog
- `activity-log.ts` -- activityLog
- `brand-guide.ts` -- brandGuide
- `assessment.ts` -- assessmentTool, resourcesPage
- `index.ts` -- barrel file (update to only export enabled modules)

#### 3i. Utilities
- `src/lib/utils.ts` -- cn() helper, date formatters, slug generators

### Step 4: Apply Migrations

Copy migration files from `supabase/migrations/` to the target project. Only include migrations required by enabled modules.

**Core migrations (always required):**
- `00003_core_cms_roles_profiles.sql` -- auth roles, profiles table, has_role() function
- `00006_site_settings.sql` -- key-value site settings table

**Module-specific migrations (only if module is enabled):**

| Module(s) | Migration File |
|---|---|
| contentPages, landingPages | `00004_content_pages.sql` |
| mediaLibrary | `00005_media_library.sql` |
| activityLog | `00007_activity_log.sql` |
| clickAnalytics | `00008_click_analytics.sql` |
| listicles | `00009_listicles.sql` |
| reviews | `00010_reviews.sql` |
| certifications | `00011_certifications.sql` |
| affiliates | `00012_affiliates.sql` |
| merchants | `00013_merchants.sql` |
| directory, categories, frameworks, glossary | `00014_core_taxonomy_tables.sql` |
| careerHub | `00002_create_career_hub_tables.sql`, `00015_seed_career_hub.sql` |
| assessmentTool, resourcesPage | `00016_assessment_resources_config_tables.sql`, `00017_seed_assessment_resources_config.sql` |
| errorLog | `00018_error_log.sql` |
| seo | `00019_seo_keyword_fields.sql` |
| redirects, linkChecker | `00020_links_redirects.sql` |
| internalLinks | `00021_internal_links.sql` |
| forms, ctaManager | `00022_forms_and_leads.sql` |
| ratings | `00001_create_ratings_tables.sql` |

Run migrations with:
```bash
supabase db push          # for hosted Supabase
# or
supabase migration up     # for local development
```

### Step 5: Scaffold Admin Pages

Copy admin page directories from `src/app/admin/` for enabled modules only. The reference admin pages are:

| Admin Page | Module |
|---|---|
| `content-pages/` | contentPages |
| `listicles/` | listicles |
| `media/` | mediaLibrary |
| `brand-guide/` | brandGuide |
| `directory/` | directory |
| `categories/` | categories |
| `frameworks/` | frameworks |
| `glossary/` | glossary |
| `certifications/` | certifications |
| `careers-training/` | careerHub |
| `reviews/` | reviews |
| `affiliates/` | affiliates |
| `analytics/` | clickAnalytics |
| `forms/` | forms |
| `cta-blocks/` | ctaManager |
| `seo/` | seo, linkChecker, internalLinks, redirects, imagesSeo |
| `errors/` | errorLog |
| `activity/` | activityLog |
| `import/` | bulkImport |
| `users/` | always (core) |
| `settings/` | always (core) |

### Step 6: Update CMS Config

Edit `cms.config.ts` with the final site values:

1. Set `siteName`, `siteUrl`, `siteDescription`, `siteTagline`
2. Set `primaryEntity` with correct name, singular, plural, slugPrefix
3. Set each module boolean in `modules` to match the chosen preset
4. Update `adminNav` to only include nav items for enabled modules
5. Set `analytics.availableProviders` based on which providers the site needs
6. Set `storage.mediaBucket` and file size limits

### Step 7: Wire Analytics

Add the `AnalyticsContextProvider` to the root layout (`src/app/layout.tsx`):

```tsx
import { AnalyticsContextProvider } from "@/lib/analytics";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsContextProvider>
          {children}
        </AnalyticsContextProvider>
      </body>
    </html>
  );
}
```

The provider reads analytics configuration from `site_settings` in Supabase and automatically initializes the configured providers (GA4, GTM, etc.).

### Step 8: Security

Add security headers to `next.config.ts`:

```ts
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
```

For Netlify deployments, add headers to `netlify.toml`. For Vercel, add to `vercel.json`.

Ensure `.env.local` contains:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Step 9: Verify

Run the build to check for errors:

```bash
pnpm build
```

If the build succeeds, the CMS is ready. If there are errors:
1. Check that all imported data layer files exist
2. Verify env vars are set
3. Confirm migrations ran successfully with `supabase db push`
4. Check TypeScript errors -- usually missing type imports from `cms.config.ts`

---

## Upgrade Workflow

When updating an existing CMS installation:

1. **Pull latest reference code** from the ESGsource repo (or `pnpm update @pandotic/universal-cms` when the npm package is published)
2. **Check for new migrations** -- compare `supabase/migrations/` in the reference repo against the target project. New migration files will have higher sequence numbers.
3. **Apply new migrations** -- copy new `.sql` files and run `supabase db push` or `supabase migration up`
4. **Update admin pages** -- if admin page templates changed, copy the updated versions. Check for new props, renamed components, or updated data layer calls.
5. **Update cms.config.ts** -- if new modules were added to the CMS, add their entries to the `CmsModuleName` type and `modules` record.
6. **Run build** -- `pnpm build` to verify everything compiles.

---

## Key Conventions

- **Config-driven**: Everything is controlled by `cmsConfig` in `src/lib/cms/cms.config.ts`. Modules, navigation, storage, analytics -- all configured there.
- **Module = migration + data layer + admin page**: Each module follows the same pattern. Enabling a module means: add its migration, add its data access file, add its admin page.
- **RLS everywhere**: All Supabase tables use Row Level Security. The `has_role()` PostgreSQL function gates admin access. Never bypass RLS in client code.
- **Server-first data access**: All data layer functions use the server Supabase client. API routes call `requireAdmin()` before any mutation.
- **Admin pages are server components** by default. Client interactivity is isolated to specific components with `"use client"`.
- **Analytics are provider-agnostic**: The analytics layer supports multiple providers simultaneously. Configuration happens in the admin settings page, not in code.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "relation does not exist" errors | Migration not applied. Run `supabase db push`. |
| Admin pages return 401 | Check middleware.ts is protecting `/admin/*`. Verify the user has an admin role in `profiles`. |
| Analytics not tracking | Check site_settings table for analytics config. Verify provider IDs are set in admin settings. |
| Build fails with missing imports | A data layer file references a module that is not enabled. Check imports match enabled modules. |
| RLS policy errors | Run `00003_core_cms_roles_profiles.sql` first -- it creates the `has_role()` function all other policies depend on. |
| Command palette not working | Ensure `CommandPalette.tsx` is mounted in the admin layout and `adminNav` is populated in config. |

---

## Reference Files

For architecture details, see `skills/universal-cms/references/architecture.md`.
For the complete module catalog, see `skills/universal-cms/references/module-catalog.md`.
For upgrade procedures, see `skills/universal-cms/references/upgrade-guide.md`.
