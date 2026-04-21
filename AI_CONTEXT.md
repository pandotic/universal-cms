# @pandotic/universal-cms — AI Context Pack

> Condensed spec for pasting into Claude / ChatGPT / Cursor sessions when
> building a new site on top of this CMS. Scope: **`packages/cms-core`
> (the consumable npm package) + App Admin surface**. Hub / Fleet /
> Team Hub features are intentionally excluded, except where their
> backend tables are exported from cms-core so other apps can read them.

- Package: `@pandotic/universal-cms` (ESM-only, published to GitHub Packages `@pandotic` scope)
- Stack target: Next.js 16 App Router + React 19 + Supabase + Tailwind v4
- TS 5.7+, tsup build, Vitest, 43 tests passing
- License: MIT

---

## 1. Install & wire-up

```bash
pnpm add @pandotic/universal-cms
```

Peer deps your app must have:

```
next >= 14           react >= 18           react-dom >= 18
@supabase/supabase-js >= 2                 @supabase/ssr >= 0.5
tailwindcss >= 4     class-variance-authority              zod
lucide-react >= 0.4  (optional — admin icons)
@anthropic-ai/sdk >= 0.30                  (optional — /ai helpers)
```

Required env:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...            # only for ./ai helpers
```

Consumer `.npmrc` (package is in GitHub Packages):

```
@pandotic:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Starter template for a new site: copy `template/` from the monorepo —
ships `src/cms.config.ts`, `src/middleware.ts`, `/admin/*` routes, and
a `/api/admin/*` stub set.

---

## 2. Design tenets (do not violate)

- **Client-injection.** Every data function takes a `SupabaseClient` as
  its first argument. No global state, no hidden singleton. Caller
  decides which Supabase project to talk to.
- **ESM-only, tree-shakable subpath exports.** `splitting: true` in
  tsup. Importing one subpath does not pull in unrelated ones.
- **`development` conditional resolution.** In the monorepo, subpath
  imports resolve to `src/` (live TS); published consumers resolve to
  `dist/`.
- **RLS everywhere.** Published/public rows readable by `anon`;
  admin/editor writes gated via `has_role()` SECURITY DEFINER helper
  defined in migration `00003`.
- **Idempotent migrations.** Every table uses `CREATE TABLE IF NOT
  EXISTS`, every policy uses `DROP POLICY IF EXISTS ... CREATE POLICY`.
  Safe to re-apply against a DB that already contains overlapping
  schema.

---

## 3. Subpath exports (full map)

Import from `@pandotic/universal-cms/<subpath>`:

| Subpath | What's in it |
|---|---|
| `.` (root) | `CmsConfig`, `CmsModuleName`, `CmsRole`, `CmsNavGroup`, `CmsNavItem` types + `modulePresets` |
| `/config` | Same types + `MODULE_MIGRATIONS`, `CORE_MIGRATIONS`, `modulesFromPreset`, `isModuleEnabled`, `getRequiredMigrations` |
| `/types` | All public types (re-exports from `src/types/*`) |
| `/security` | `createRateLimiter`, `authLimiter`, `adminApiLimiter`, `validateEnv`, `validateEnvOrThrow`, `cspHeader`, `securityHeaders`, `validateBody`, `sanitizeCss` |
| `/middleware` | `requireAdmin`, `apiError`, `requireHubRole` |
| `/version` | `CMS_VERSION` |
| `/utils` | `cn`, `relativeLuminance`, `contrastRatio`, `meetsAA`, `meetsAAA`, `validateThemeContrast`, `Layer`, `LAYER_COLORS` |
| `/utils/validation` | `zod` validators for shared schemas |
| `/registry` | Module registry helpers |
| `/ai` | `getCmsTools`, `buildSystemPrompt`, `executeTool`, `ChatMessage`, `ToolResultDisplay`, `Conversation`, `SSEEvent` |
| `/error-logging` | Client-side error capture (`ErrorBoundary`, `ErrorCaptureProvider`) |
| `/error-logging/server` | Server helpers for logging errors |
| `/components/admin` | `AdminShell`, `AdminSidebar`, `CommandPalette`, `ChatPanel`, `ChatMessage`, `ChatToolResult`, `CmsProvider`, `useCmsConfig` |
| `/components/ui` | shadcn-style primitives (see §6) |
| `/components/theme` | `ThemeProvider`, `useTheme`, `ThemeInjector`, `ThemeToggle` |
| `/components/tracking` | `TrackingInjector`, `WebmasterVerification`, `TrackingNoscript` |
| `/components/projects` | Portfolio/project-page components (hero, feature grid, case study, etc.) |

### Data subpaths (client-injection pattern — all take `SupabaseClient` first)

| Subpath | Domain |
|---|---|
| `/data/content` | Content pages (articles, guides, landing) |
| `/data/entities` | Directory entities (generic — any row in `entities`) |
| `/data/reviews` | User reviews with moderation |
| `/data/categories` | Layered taxonomy |
| `/data/media` | Media library (Supabase Storage bridge) |
| `/data/forms` | Forms + submissions (lead capture) |
| `/data/settings` | `site_settings` key/value store |
| `/data/activity` | Activity log (audit trail) |
| `/data/errors` | Error log |
| `/data/affiliates` | Affiliate programs + tracking URL builder |
| `/data/certifications` | Certifications + rule engine |
| `/data/cta-blocks` | Reusable CTA blocks by placement |
| `/data/listicles` | Ranked lists + items |
| `/data/redirects` | 301/302 management |
| `/data/ai-conversations` | Admin chat persistence |
| `/data/internal-links` | Link graph analysis / orphan pages |
| `/data/link-checker` | Broken link + 404 tracking |
| `/data/api-usage` | API call tracking + keys + audit |
| `/data/projects` + `/data/project-parsers` | Portfolio project pages + markdown parsers |

### Hub/admin data subpaths (for Pandotic Hub — exported so consumers *could* read cross-property tables if needed)

`/types/hub`, `/types/admin`, `/types/agent`, `/types/social`,
`/types/playbooks`, `/types/hub-*`, `/data/hub`, `/data/hub-users`,
`/data/hub-activity`, `/data/hub-groups`, `/data/hub-admin`,
`/data/hub-agents`, `/data/hub-social`, `/data/hub-brand-assets`,
`/data/hub-content-pipeline`, `/data/hub-brand-setup`, `/data/hub-qa`,
`/data/hub-link-building`, `/data/hub-marketing-ops`,
`/data/hub-playbooks`, `/data/hub-marketing-playbooks`,
`/data/hub-skill-contract`, `/data/hub-package-deployments`,
`/data/hub-marketing`.

→ **Regular sites should not import these.** They target the Hub's
Supabase project (`rimbgolutrxpmwsoswhq`), not per-site DBs.

### PromptKit (experimental — AI model / skill registry)

`/types/promptkit`, `/promptkit/models`, `/promptkit/skills`,
`/promptkit/optimizers`, `/data/promptkit-history`.

---

## 4. CmsConfig shape + modules

```ts
interface CmsConfig {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  siteTagline: string;
  twitterHandle?: string;

  primaryEntity: {
    name: string;            // table name / data key
    singular: string;
    plural: string;
    slugPrefix: string;      // public URL prefix e.g. "/directory"
  };

  modules: Record<CmsModuleName, boolean>;
  roles: CmsRole[];          // "admin" | "editor" | "moderator"
  adminNav: CmsNavGroup[];

  analytics: {
    availableProviders: TrackingProvider[];  // ga4|gtm|posthog|rybbit|clarity|linkedin|meta_pixel|cloudflare|custom
  };

  storage: {
    mediaBucket: string;
    maxFileSizeMb: number;
    allowedMimeTypes: string[];
  };
}
```

### Module catalog (`CmsModuleName` values)

Flip booleans in `modules` to enable. The build step reads
`getRequiredMigrations(config)` to compute the SQL list.

- **Content & Pages:** `contentPages`, `landingPages`, `mediaLibrary`, `listicles`, `brandGuide`
- **Directory & Taxonomy:** `directory`, `categories`, `frameworks`, `glossary`, `certifications`
- **Career & Education:** `careerHub`
- **Engagement & Monetization:** `reviews`, `affiliates`, `clickAnalytics`, `merchants`, `ratings`
- **SEO & Technical:** `seo`, `redirects`, `linkChecker`, `internalLinks`, `imagesSeo`
- **Tools & Public Features:** `compareTools`, `assessmentTool`, `resourcesPage`, `smallBusinessPage`
- **Forms & Lead Capture:** `forms`, `ctaManager`
- **System:** `errorLog`, `activityLog`, `bulkImport`, `apiUsage`

### Presets

```ts
modulePresets.appMarketing   // SaaS/app: content, landing, media, forms, CTA, logs
modulePresets.blog           // articles + SEO stack
modulePresets.directory      // entities + reviews + affiliates + full SEO
modulePresets.full           // everything
```

Build a modules record: `modulesFromPreset(modulePresets.directory)`.

---

## 5. Data-function signatures (per module)

All functions are async and take `(client: SupabaseClient, ...)`.
Errors throw; reads that miss return `null` or `[]`.

### `/data/content` — content pages
`getAllContentPages`, `getPublishedContentPages`, `getContentPageBySlug`,
`getContentPageById`, `createContentPage`, `updateContentPage`,
`deleteContentPage`.

### `/data/entities` — directory rows
`getAllEntities`, `getEntityBySlug`, `getEntityById`,
`getFeaturedEntities`, `getEntitiesByType`, `getEntitiesByCategory`,
`getAllEntitySlugs`, `getAllTags`.

### `/data/reviews`
`getAllReviews`, `getPublicReviews`, `createReview`,
`updateReviewStatus`, `bulkUpdateReviewStatus`, `deleteReview`,
`getReviewStats`.

### `/data/categories`
`getAllCategories`, `getCategoryBySlug`, `getCategoryById`,
`getCategoriesByLayer`, `getCategorySlugs`,
`getCategoriesGroupedByLayer`.

### `/data/media`
`getAllMedia`, `getMediaById`, `uploadMedia`, `updateMedia`,
`deleteMedia`, `getMediaPublicUrl`.

### `/data/settings`
`getSetting`, `getSettingsByGroup`, `getAllSettings`, `updateSetting`,
`updateSettings`, `getAnalyticsProviders`.

### `/data/activity`
`logActivity`, `getActivityLog`, `getRecentActivity`.
`ActivityAction` = create | update | delete | publish | archive | login | bulk_import.

### `/data/errors`
`logError`, `getErrors`, `getErrorById`, `getErrorStats`,
`resolveError`, `resolveErrors`, `unresolveError`, `deleteError`,
`deleteResolvedErrors`, `formatErrorAsMarkdown`,
`formatErrorBatchAsMarkdown`.
Severity: info|warning|error|critical. Category: runtime|api|ui|build.

### `/data/forms`
`getAllForms`, `getFormById`, `getFormBySlug`, `createForm`,
`updateForm`, `deleteForm`, `createSubmission`, `getSubmissions`,
`updateSubmissionStatus`.
FormType = contact|lead|newsletter|cta|custom.

### `/data/affiliates`
`getAllAffiliatePrograms`, `getAffiliateProgram`,
`createAffiliateProgram`, `updateAffiliateProgram`,
`deleteAffiliateProgram`, `buildTrackingUrl`.
Networks: impact|cj|shareasale|awin|rakuten|partnerstack|direct|other.

### `/data/certifications`
`getAllCertifications`, `getCertificationWithRules`,
`createCertification`, `updateCertification`, `deleteCertification`,
`addCertificationRule`, `deleteCertificationRule`,
`getEntityCertifications`, `awardCertification`.

### `/data/cta-blocks`
`getCtaBlocksByPlacement`, `getAllCtaBlocks`, `getCtaBlockById`,
`createCtaBlock`, `updateCtaBlock`, `deleteCtaBlock`.

### `/data/listicles`
`getAllListicles`, `getPublishedListicles`, `getListicleBySlug`,
`getListicleById`, `createListicle`, `updateListicle`,
`deleteListicle`, `upsertListicleItems`.

### `/data/redirects`
`getRedirects`, `createRedirect`, `updateRedirect`, `deleteRedirect`,
`incrementRedirectHits`.

### `/data/ai-conversations`
`getConversations`, `getConversation`, `createConversation`,
`updateConversationMessages`, `deleteConversation`.

### `/data/internal-links`
`getInternalLinkStats`, `getOrphanPages`, `getLinkSuggestions`,
`updateLinkSuggestion`, `recordInternalLink`, `getAnchorTextGroups`.

### `/data/link-checker`
`recordLinkCheck`, `getBrokenLinks`, `getAllLinkChecks`, `log404`,
`get404Logs`.

### `/data/api-usage`
`trackApiCall`, `flushApiUsage`, `startAutoFlush`, `getUsageSummary`,
`getUsageRecords`, `getAllApiKeys`, `upsertApiKey`, `deleteApiKey`,
`getAuditEntries`, `createAuditEntry`, `updateAuditEntry`.

### `/data/projects` + `/data/project-parsers`
Projects: `getAllProjects`, `getPublishedProjects`, `getProjectBySlug`,
`getProjectById`, `createProject`, `updateProject`, `deleteProject`,
`getProjectSections`, `getProjectSection`, `upsertProjectSection`,
`deleteProjectSection`, `getProjectWithContent`.
Parsers (sync, string in → structured out): `parseFeatures`,
`parseProofPoints`, `parseTechDifferentiators`, `parseProductPage`,
`parseCaseStudy`, `parseBlurbs`, `parsePortfolio`.

---

## 6. UI & Admin components

### `/components/admin` — full admin shell
- `<AdminShell title description>{children}</AdminShell>` — collapsible
  sidebar, breadcrumbs, user menu, theme toggle, Cmd-K palette, AI
  chat slide-over.
- `<CmsProvider config={cmsConfig}>` — required wrapper; exposes
  `useCmsConfig()` for child components.
- `<AdminSidebar>`, `<CommandPalette>`, `<ChatPanel>`, `<ChatMessage>`,
  `<ChatToolResult>`.

Module-gated nav: items with `module: "foo"` in `adminNav` are hidden
when `config.modules.foo === false`.

### `/components/ui` (shadcn/Radix primitives)
`Button` (+ `buttonVariants`, `ButtonProps`), `Input`, `Textarea`,
`Badge` (+ `badgeVariants`, `BadgeProps`), `Card` + subcomponents,
`Dialog` + subcomponents, `Select`, `Table` + subcomponents, `Tabs` +
subcomponents, `ToastProvider` + `useToast`, `DropdownMenu` +
subcomponents, `Switch`, `Label`, `Separator`, `Popover` +
subcomponents.

### `/components/theme`
`<ThemeProvider>` + `useTheme()`, `<ThemeInjector>` (applies CSS vars
from `site_settings`), `<ThemeToggle>`.

### `/components/tracking`
`<TrackingInjector>` — renders scripts for all enabled providers from
`site_settings.analytics_providers`. `<TrackingNoscript>` for noscript
fallbacks. `<WebmasterVerification>` for Search Console / Bing / Yandex
meta tags.

### `/components/projects` (portfolio pages)
`<ProjectHero>`, `<ProjectFeatureGrid>`, `<ProjectCaseStudy>`,
`<ProjectProofPoints>`, `<ProjectTechStack>`, `<ProjectVideoEmbed>`,
`<ProjectScreenshots>` (+ `Screenshot` type), `<ScrollReveal>`,
`<TextReveal>`.

---

## 7. Middleware & security

### Auth
```ts
import { requireAdmin, apiError } from "@pandotic/universal-cms/middleware";

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient(...);
  const denied = await requireAdmin(supabase, request, ["admin", "editor"]);
  if (denied) return denied;
  try { ... } catch (e) { return apiError(e, 500); }
}
```
Reads `auth.getUser()`, looks up `profiles.role`, returns 401/403
`NextResponse` if not allowed, or `null` if authorized.

### Route protection in `middleware.ts`
Template ships a `middleware.ts` that wraps `/admin/*` with Supabase
SSR session refresh and redirects unauthenticated users to `/login`
with a `redirect` search param. Authenticated users hitting `/login`
are bounced to `/admin` (or the stored redirect).

### `/security`
- `createRateLimiter(opts)` — returns `(key) => { allowed, resetAt }`.
  Pre-made: `authLimiter` (login), `adminApiLimiter`.
- `validateEnv()` / `validateEnvOrThrow()` — runtime check for
  `requiredCmsEnvVars` and `requiredServerEnvVars`.
- `cspHeader`, `cspDirectives`, `securityHeaders` — sane defaults for
  `next.config` headers array.
- `validateBody(req, zodSchema)` — wraps request JSON parsing +
  zod validation; returns `{ data }` or `NextResponse` error.
- `sanitizeCss(css)` — strips dangerous CSS for user-provided theme
  overrides.

---

## 8. AI helpers (`/ai`)

Used by the admin chat panel. Optional — only needed if you enable the
Bot button in `AdminShell`.

```ts
import { getCmsTools, buildSystemPrompt, executeTool } from "@pandotic/universal-cms/ai";

const tools = getCmsTools(cmsConfig);          // returns Anthropic tool definitions
const system = buildSystemPrompt(cmsConfig);   // system prompt aware of enabled modules
const result = await executeTool(name, input, { supabase, userId });
```

Types: `ChatMessage`, `ToolResultDisplay`, `Conversation`, `SSEEvent`.

Conversations persist via `/data/ai-conversations` against the
`ai_conversations` table.

---

## 9. Supabase migrations (template ships 27 files)

Source: `template/supabase/migrations/*.sql`. Idempotent. Apply all the
ones listed by `getRequiredMigrations(cmsConfig)`.

| File | Tables / key objects |
|---|---|
| `00001_create_ratings_tables` | `platforms`, `review_sources`, `rating_history_logs` |
| `00002_create_career_hub_tables` | `ch_providers`, `ch_roles`, `ch_tags`, `ch_job_sources`, `ch_programs`, `ch_resources`, `ch_program_roles`, `ch_program_tags`, `ch_role_recommended_programs`, `ch_role_resources`, `ch_role_progression_paths`, `ch_user_profiles`, `ch_user_programs`, `ch_user_credentials`, `ch_user_saved_jobs` |
| `00003_core_cms_roles_profiles` | **Always required.** `profiles`, `user_roles`, `has_role()` SECURITY DEFINER, `update_updated_at_column()` trigger fn |
| `00004_content_pages` | `content_pages` |
| `00005_media_library` | `content_media` |
| `00006_site_settings` | **Always required.** `site_settings` + seed rows |
| `00007_activity_log` | `activity_log` |
| `00008_click_analytics` | `outbound_links`, `outbound_clicks` |
| `00009_listicles` | `listicles`, `listicle_items` |
| `00010_reviews` | `cms_reviews`, `review_votes`, `reviews_public` view |
| `00011_certifications` | `cms_certifications`, `certification_rules`, `entity_certifications` |
| `00012_affiliates` | `affiliate_programs`, `affiliate_links` |
| `00013_merchants` | `merchants`, `merchant_collections` |
| `00014_core_taxonomy_tables` | `entities`, `categories`, `frameworks`, `glossary_terms`, `category_content`, `entity_categories`, `entity_frameworks`, `entity_source_map` |
| `00015_seed_career_hub` | Career hub seed data |
| `00016_assessment_resources_config_tables` | `assessment_questions`, `assessment_industries`, `assessment_regions`, `esg_recommendations`, `esg_resources` |
| `00017_seed_assessment_resources_config` | Seeds the above |
| `00018_error_log` | `error_log` |
| `00019_seo_keyword_fields` | `keyword_registry` + SEO columns on content tables |
| `00020_links_redirects` | `redirects`, `link_checks`, `not_found_log` |
| `00021_internal_links` | `internal_links`, `link_suggestions` |
| `00022_forms_and_leads` | `forms`, `form_submissions`, `cta_blocks` |
| `00023_ai_conversations` | `ai_conversations` |
| `00024_theme_customization` | Theme columns on `site_settings` |
| `00025_api_usage_tracking` | `api_usage`, `api_keys`, `api_audit` |
| `00025_projects` | `projects`, `project_sections` (note: duplicate `00025` prefix in-place) |
| `00026_tracking_and_webmaster` | Webmaster verification + analytics provider columns |

Core (always required): `00003`, `00006`.

Module → migration mapping lives in `MODULE_MIGRATIONS` exported from
`/config`. Your build step should call `getRequiredMigrations(cmsConfig)`
and keep `supabase/migrations/` in sync.

### Hub-specific migrations (NOT shipped in template; live in the Hub repo only)

`00100_hub_properties`, `00101_hub_groups`, `00102_hub_users`,
`00103_hub_activity_log`, `00104_agents`, `00105_social_content`,
`00107_projects`, `00120–00123_team_hub_*`. Only relevant if you're
consuming Hub data from a site (rare).

---

## 10. App Admin surface (what's in `template/src/app/admin/`)

Ready-to-go admin pages in the starter template. Drop-in for a new
site.

- `/admin` — dashboard
- `/admin/content-pages` — list, create, edit (module: `contentPages`)
- `/admin/media` — media library (module: `mediaLibrary`)
- `/admin/directory` — entities list (module: `directory`)
- `/admin/categories` — taxonomy (module: `categories`)
- `/admin/reviews` — moderation queue (module: `reviews`)
- `/admin/affiliates` — programs + links (module: `affiliates`)
- `/admin/forms` — forms + submissions (module: `forms`)
- `/admin/activity` — audit log (module: `activityLog`)
- `/admin/errors` — error log (module: `errorLog`)
- `/admin/settings` — site settings

Matching API handlers in `template/src/app/api/admin/`:
`activity`, `chat`, `content-pages`, `dashboard`, `errors`, `health`,
`media`, `reviews`, `settings`.

All API routes open with `requireAdmin(supabase, request)` and close
with `apiError(e)` on throw.

### Integrated vs standalone admin
- `template/src/app/admin/` — admin pages co-located with the site
  (same Next.js app).
- `template/admin-integrated/` — alternative wiring if you want the
  admin under a sub-route with its own layout.
- `packages/cms-core/src/cli/setup-admin.ts` — interactive wizard to
  scaffold the admin surface into an existing Next.js project. See
  `packages/cms-core/src/cli/README.md`.

---

## 11. Minimum viable site recipe

1. `pnpm add @pandotic/universal-cms` (with `.npmrc` pointing at GitHub
   Packages).
2. Create Supabase project. Copy `template/supabase/migrations/*.sql`.
   Run `getRequiredMigrations(cmsConfig)` to know which to apply;
   apply them via `supabase db push` or the SQL editor.
3. Copy `template/src/cms.config.ts` → edit `siteName`, `siteUrl`,
   `primaryEntity`, `modules`, `adminNav`.
4. Copy `template/src/middleware.ts` verbatim.
5. Copy `template/src/app/admin/` and `template/src/app/api/admin/`.
   Wrap the admin layout with `<CmsProvider config={cmsConfig}>`.
6. Set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, optionally `ANTHROPIC_API_KEY`).
7. Create an admin user: insert into `auth.users` via Supabase dashboard,
   then `INSERT INTO profiles (id, role) VALUES ('<uuid>', 'admin')`.
8. Ship. Add public pages that call `get...` data functions with a
   server Supabase client.

---

## 12. Gotchas

- `published` rows readable by `anon`; everything else needs a
  Supabase session (server client with cookies).
- `has_role(role_name text)` lives in `public`, is `SECURITY DEFINER`,
  and is referenced by every admin RLS policy. Don't drop it.
- `update_updated_at_column()` trigger fn is defined once in `00003`
  and reused by later migrations. Apply `00003` first.
- Admin icons expect `lucide-react` installed in the host app even
  though it's an optional peer dep.
- tsup builds ESM only — if a consumer is still on CJS, it won't work.
- **Duplicate `00025_` prefix** — both `00025_api_usage_tracking.sql`
  and `00025_projects.sql` exist. Supabase CLI applies them in
  lexicographic order so both run, but be aware when adding a new
  `00025_` file.
- Hub data exports target a different Supabase project. A site should
  never import `/data/hub*` unless it's the Pandotic Hub dashboard.
