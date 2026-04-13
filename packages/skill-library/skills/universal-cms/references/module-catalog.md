# Universal CMS Module Catalog

Complete reference for all 31 CMS modules. Use this when scaffolding, enabling/disabling modules, or understanding dependencies.

---

## Module Reference

### Content and Pages

#### contentPages
- **Description**: Rich-text content pages with status workflow (draft/published/archived), SEO fields, and URL slug management.
- **Migration**: `00004_content_pages.sql`
- **Data Layer**: `src/lib/data/content-pages.ts`
- **Admin Page**: `src/app/admin/content-pages/`
- **Dependencies**: None

#### landingPages
- **Description**: Landing pages with hero sections, CTA blocks, and conversion-focused layouts. Shares the content_pages table with `type = 'landing'`.
- **Migration**: `00004_content_pages.sql` (shared with contentPages)
- **Data Layer**: `src/lib/data/content-pages.ts` (shared)
- **Admin Page**: `src/app/admin/content-pages/` (filtered by type)
- **Dependencies**: contentPages (shares migration and data layer)

#### mediaLibrary
- **Description**: Upload, organize, and manage images and files in Supabase Storage. Supports drag-and-drop, bulk upload, alt text, and image optimization metadata.
- **Migration**: `00005_media_library.sql`
- **Data Layer**: `src/lib/data/media.ts`
- **Admin Page**: `src/app/admin/media/`
- **Dependencies**: None

#### listicles
- **Description**: Structured list-based articles (e.g., "Top 10 ESG Tools"). Each listicle has ordered items with title, description, image, and optional entity link.
- **Migration**: `00009_listicles.sql`
- **Data Layer**: `src/lib/data/listicles.ts`
- **Admin Page**: `src/app/admin/listicles/`
- **Dependencies**: None (optional: directory module for entity linking)

#### brandGuide
- **Description**: Brand guidelines management -- colors, typography, logo usage, tone of voice. Stored in the `site_settings` table (no separate migration).
- **Migration**: None (uses site_settings)
- **Data Layer**: `src/lib/data/brand-guide.ts`
- **Admin Page**: `src/app/admin/brand-guide/`
- **Dependencies**: None

---

### Directory and Taxonomy

#### directory
- **Description**: Core entity directory. Manages the primary entity type (e.g., companies, tools, products) with profiles, descriptions, logos, metadata, and status workflow.
- **Migration**: `00014_core_taxonomy_tables.sql`
- **Data Layer**: `src/lib/data/entities.ts`
- **Admin Page**: `src/app/admin/directory/`
- **Dependencies**: None (but typically used with categories, frameworks, glossary)

#### categories
- **Description**: Hierarchical category taxonomy for organizing directory entities. Supports parent-child relationships, descriptions, and icons.
- **Migration**: `00014_core_taxonomy_tables.sql` (shared with directory)
- **Data Layer**: `src/lib/data/categories.ts`, `src/lib/data/category-content.ts`
- **Admin Page**: `src/app/admin/categories/`
- **Dependencies**: directory (entities are assigned to categories)

#### frameworks
- **Description**: Regulatory and standards frameworks (e.g., GRI, SASB, TCFD). Entities can be mapped to frameworks they support.
- **Migration**: `00014_core_taxonomy_tables.sql` (shared with directory)
- **Data Layer**: `src/lib/data/frameworks.ts`
- **Admin Page**: `src/app/admin/frameworks/`
- **Dependencies**: directory

#### glossary
- **Description**: Glossary of terms with definitions, related terms, and links to entities. Used for internal linking and SEO.
- **Migration**: `00014_core_taxonomy_tables.sql` (shared with directory)
- **Data Layer**: `src/lib/data/glossary.ts`
- **Admin Page**: `src/app/admin/glossary/`
- **Dependencies**: None

#### certifications
- **Description**: Industry certifications and accreditations. Entities can be tagged with certifications they hold.
- **Migration**: `00011_certifications.sql`
- **Data Layer**: `src/lib/data/certifications.ts`
- **Admin Page**: `src/app/admin/certifications/`
- **Dependencies**: directory (for entity-certification relationships)

---

### Career and Education

#### careerHub
- **Description**: Career resources hub with job roles, career paths, salary data, and training resources for the domain.
- **Migration**: `00002_create_career_hub_tables.sql`, `00015_seed_career_hub.sql`
- **Data Layer**: `src/lib/data/careers.ts`, `src/lib/data/careers-supabase.ts`, `src/lib/data/careers-client.ts`
- **Admin Page**: `src/app/admin/careers-training/`
- **Dependencies**: None

---

### Engagement and Monetization

#### reviews
- **Description**: User reviews for directory entities. Includes moderation workflow (pending/approved/rejected), star ratings, and admin management.
- **Migration**: `00010_reviews.sql`
- **Data Layer**: (inline in admin page or via API routes)
- **Admin Page**: `src/app/admin/reviews/`
- **Dependencies**: directory (reviews are attached to entities)

#### affiliates
- **Description**: Affiliate link management. Track affiliate URLs, commission rates, and click attribution for monetization.
- **Migration**: `00012_affiliates.sql`
- **Data Layer**: `src/lib/data/affiliates.ts`
- **Admin Page**: `src/app/admin/affiliates/`
- **Dependencies**: directory (affiliate links map to entities)

#### clickAnalytics
- **Description**: Track outbound clicks on affiliate links, external URLs, and CTA buttons. Provides click counts, trends, and attribution data in the admin dashboard.
- **Migration**: `00008_click_analytics.sql`
- **Data Layer**: `src/lib/data/click-analytics.ts`
- **Admin Page**: `src/app/admin/analytics/`
- **Dependencies**: None (enhanced by affiliates module)

#### merchants
- **Description**: Merchant/vendor profiles for marketplace functionality. Tracks merchant details, product offerings, and relationships.
- **Migration**: `00013_merchants.sql`
- **Data Layer**: (managed via admin pages)
- **Admin Page**: (managed within directory admin)
- **Dependencies**: directory

#### ratings
- **Description**: Structured rating system with multiple criteria (e.g., ease of use, features, support). Aggregates into overall scores displayed on entity pages.
- **Migration**: `00001_create_ratings_tables.sql`
- **Data Layer**: `src/lib/data/ratings.ts`
- **Admin Page**: (managed within directory/reviews admin)
- **Dependencies**: directory

---

### SEO and Technical

#### seo
- **Description**: SEO management dashboard. Keyword tracking, meta tag optimization, structured data (JSON-LD schema), and SEO audit tools.
- **Migration**: `00019_seo_keyword_fields.sql`
- **Data Layer**: (inline in admin pages)
- **Admin Page**: `src/app/admin/seo/`
- **Dependencies**: None

#### redirects
- **Description**: URL redirect management (301/302). Supports exact match and regex patterns. Redirects are cached in middleware for performance.
- **Migration**: `00020_links_redirects.sql` (shared with linkChecker)
- **Data Layer**: (read in middleware.ts, managed in admin)
- **Admin Page**: `src/app/admin/seo/redirects/`
- **Dependencies**: None

#### linkChecker
- **Description**: Automated broken link detection. Scans internal and external links, reports 404s and redirect chains.
- **Migration**: `00020_links_redirects.sql` (shared with redirects)
- **Data Layer**: `src/lib/data/link-checker.ts`
- **Admin Page**: `src/app/admin/seo/links/`
- **Dependencies**: None

#### internalLinks
- **Description**: Internal link suggestion and management. Helps build a strong internal linking structure for SEO by suggesting contextual links between content.
- **Migration**: `00021_internal_links.sql`
- **Data Layer**: `src/lib/data/internal-links.ts`
- **Admin Page**: `src/app/admin/seo/interlinking/`
- **Dependencies**: contentPages (links between content pages)

#### imagesSeo
- **Description**: Image SEO audit -- checks for missing alt text, oversized images, and WebP conversion opportunities. UI-only module with no database tables.
- **Migration**: None (UI-only)
- **Data Layer**: None
- **Admin Page**: `src/app/admin/seo/images/`
- **Dependencies**: mediaLibrary (audits media library images)

---

### Tools and Public Features

#### compareTools
- **Description**: Side-by-side entity comparison tool. Allows users to compare features, pricing, and ratings across directory entities.
- **Migration**: None (uses entities table from directory module)
- **Data Layer**: (uses entities data layer)
- **Admin Page**: None (public feature, configured via directory)
- **Dependencies**: directory (requires entities to compare)

#### assessmentTool
- **Description**: Interactive assessment/quiz tool. Users answer questions and receive personalized recommendations for entities.
- **Migration**: `00016_assessment_resources_config_tables.sql`, `00017_seed_assessment_resources_config.sql`
- **Data Layer**: `src/lib/data/assessment.ts`
- **Admin Page**: (configured via settings)
- **Dependencies**: directory

#### resourcesPage
- **Description**: Curated resources page with categorized links, guides, and downloads.
- **Migration**: `00016_assessment_resources_config_tables.sql` (shared with assessmentTool)
- **Data Layer**: `src/lib/data/assessment.ts` (shared)
- **Admin Page**: (configured via settings)
- **Dependencies**: None

#### smallBusinessPage
- **Description**: Dedicated landing page for small business resources and recommendations. Stored in site_settings.
- **Migration**: None (uses site_settings)
- **Data Layer**: None
- **Admin Page**: None (configured via settings)
- **Dependencies**: None

---

### Forms and Lead Capture

#### forms
- **Description**: Form builder and submission management. Create contact forms, newsletter signups, and lead capture forms. Submissions stored in Supabase with admin review.
- **Migration**: `00022_forms_and_leads.sql` (shared with ctaManager)
- **Data Layer**: `src/lib/data/forms.ts`
- **Admin Page**: `src/app/admin/forms/`
- **Dependencies**: None

#### ctaManager
- **Description**: Call-to-action block management. Create reusable CTA blocks with configurable text, buttons, and styling that can be embedded in content pages.
- **Migration**: `00022_forms_and_leads.sql` (shared with forms)
- **Data Layer**: `src/lib/data/cta-blocks.ts`
- **Admin Page**: `src/app/admin/cta-blocks/`
- **Dependencies**: None

---

### System

#### errorLog
- **Description**: Application error logging. Captures client-side and server-side errors with stack traces, user context, and frequency tracking.
- **Migration**: `00018_error_log.sql`
- **Data Layer**: `src/lib/data/error-log.ts`
- **Admin Page**: `src/app/admin/errors/`
- **Dependencies**: None

#### activityLog
- **Description**: Audit trail for admin actions. Logs who did what and when -- content edits, user role changes, settings updates, etc.
- **Migration**: `00007_activity_log.sql`
- **Data Layer**: `src/lib/data/activity-log.ts`
- **Admin Page**: `src/app/admin/activity/`
- **Dependencies**: None

#### bulkImport
- **Description**: Bulk data import tool for directory entities, categories, and other structured data. Supports CSV upload with field mapping and validation.
- **Migration**: None (UI-only, writes to existing tables)
- **Data Layer**: None (uses existing data layer functions)
- **Admin Page**: `src/app/admin/import/`
- **Dependencies**: directory (primary use case is entity import)

---

## Preset Configurations

### App Marketing Site (9 modules)

For SaaS or mobile app marketing sites. Landing pages, blog, media, basic SEO.

```
contentPages, landingPages, mediaLibrary, brandGuide, forms, ctaManager, seo, redirects, errorLog
```

**Required migrations**: 00003, 00004, 00005, 00006, 00018, 00019, 00020, 00022

---

### Blog / Content Site (14 modules)

Content-focused site with articles, SEO tools, and link management.

```
contentPages, landingPages, mediaLibrary, listicles, brandGuide, forms, ctaManager, seo, redirects, linkChecker, internalLinks, imagesSeo, errorLog, activityLog
```

**Required migrations**: 00003, 00004, 00005, 00006, 00007, 00009, 00018, 00019, 00020, 00021, 00022

---

### Directory / Marketplace (26 modules)

Full directory site with entities, categories, reviews, affiliate links, and complete SEO.

```
contentPages, landingPages, mediaLibrary, listicles, brandGuide, directory, categories, frameworks, glossary, certifications, reviews, affiliates, clickAnalytics, merchants, ratings, compareTools, forms, ctaManager, seo, redirects, linkChecker, internalLinks, imagesSeo, errorLog, activityLog, bulkImport
```

**Required migrations**: 00001, 00003, 00004, 00005, 00006, 00007, 00008, 00009, 00010, 00011, 00012, 00013, 00014, 00018, 00019, 00020, 00021, 00022

---

### Full Platform (31 modules)

Everything enabled. All modules, all migrations.

```
contentPages, landingPages, mediaLibrary, listicles, brandGuide, directory, categories, frameworks, glossary, certifications, careerHub, reviews, affiliates, clickAnalytics, merchants, ratings, forms, ctaManager, seo, redirects, linkChecker, internalLinks, imagesSeo, compareTools, assessmentTool, resourcesPage, smallBusinessPage, errorLog, activityLog, bulkImport
```

**Required migrations**: All 22 migration files (00001 through 00022)

---

## Module-to-Migration Mapping Table

Quick lookup of which migration file(s) each module requires. Core migrations (`00003_core_cms_roles_profiles.sql` and `00006_site_settings.sql`) are always required regardless of module selection.

| Module | Migration File(s) |
|---|---|
| contentPages | `00004_content_pages.sql` |
| landingPages | `00004_content_pages.sql` |
| mediaLibrary | `00005_media_library.sql` |
| listicles | `00009_listicles.sql` |
| brandGuide | None (site_settings) |
| directory | `00014_core_taxonomy_tables.sql` |
| categories | `00014_core_taxonomy_tables.sql` |
| frameworks | `00014_core_taxonomy_tables.sql` |
| glossary | `00014_core_taxonomy_tables.sql` |
| certifications | `00011_certifications.sql` |
| careerHub | `00002_create_career_hub_tables.sql`, `00015_seed_career_hub.sql` |
| reviews | `00010_reviews.sql` |
| affiliates | `00012_affiliates.sql` |
| clickAnalytics | `00008_click_analytics.sql` |
| merchants | `00013_merchants.sql` |
| ratings | `00001_create_ratings_tables.sql` |
| seo | `00019_seo_keyword_fields.sql` |
| redirects | `00020_links_redirects.sql` |
| linkChecker | `00020_links_redirects.sql` |
| internalLinks | `00021_internal_links.sql` |
| imagesSeo | None (UI-only) |
| compareTools | None (uses directory tables) |
| assessmentTool | `00016_assessment_resources_config_tables.sql`, `00017_seed_assessment_resources_config.sql` |
| resourcesPage | `00016_assessment_resources_config_tables.sql` |
| smallBusinessPage | None (site_settings) |
| forms | `00022_forms_and_leads.sql` |
| ctaManager | `00022_forms_and_leads.sql` |
| errorLog | `00018_error_log.sql` |
| activityLog | `00007_activity_log.sql` |
| bulkImport | None (UI-only) |

---

## Migration-to-Module Reverse Mapping

Use this when you have a migration file and need to know which modules it supports.

| Migration File | Module(s) |
|---|---|
| `00001_create_ratings_tables.sql` | ratings |
| `00002_create_career_hub_tables.sql` | careerHub |
| `00003_core_cms_roles_profiles.sql` | **CORE** (always required) |
| `00004_content_pages.sql` | contentPages, landingPages |
| `00005_media_library.sql` | mediaLibrary |
| `00006_site_settings.sql` | **CORE** (always required) |
| `00007_activity_log.sql` | activityLog |
| `00008_click_analytics.sql` | clickAnalytics |
| `00009_listicles.sql` | listicles |
| `00010_reviews.sql` | reviews |
| `00011_certifications.sql` | certifications |
| `00012_affiliates.sql` | affiliates |
| `00013_merchants.sql` | merchants |
| `00014_core_taxonomy_tables.sql` | directory, categories, frameworks, glossary |
| `00015_seed_career_hub.sql` | careerHub |
| `00016_assessment_resources_config_tables.sql` | assessmentTool, resourcesPage |
| `00017_seed_assessment_resources_config.sql` | assessmentTool |
| `00018_error_log.sql` | errorLog |
| `00019_seo_keyword_fields.sql` | seo |
| `00020_links_redirects.sql` | redirects, linkChecker |
| `00021_internal_links.sql` | internalLinks |
| `00022_forms_and_leads.sql` | forms, ctaManager |
