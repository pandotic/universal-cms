# Module Catalog

Universal CMS has 31 modules organized into 8 categories. Each module is independently toggleable via `cms.config.ts`.

## Content & Pages

| Module | Description | Migration |
|--------|-------------|-----------|
| `contentPages` | Articles, guides, landing pages with SEO fields | `00004_content_pages.sql` |
| `landingPages` | Specialized landing page templates | `00004_content_pages.sql` |
| `mediaLibrary` | Image/file upload with alt text, captions | `00005_media_library.sql` |
| `listicles` | Ranked list content (e.g. "Top 10...") | `00009_listicles.sql` |
| `brandGuide` | Brand guidelines and style documentation | `00004_content_pages.sql` |

## Directory & Taxonomy

| Module | Description | Migration |
|--------|-------------|-----------|
| `directory` | Entity directory (companies, products, services) | `00014_core_taxonomy_tables.sql` |
| `categories` | Hierarchical taxonomy categories | `00014_core_taxonomy_tables.sql` |
| `frameworks` | Industry frameworks and standards | `00014_core_taxonomy_tables.sql` |
| `glossary` | Glossary terms with definitions | `00014_core_taxonomy_tables.sql` |
| `certifications` | Certification and credential tracking | `00011_certifications.sql` |

## Career & Education

| Module | Description | Migration |
|--------|-------------|-----------|
| `careerHub` | Career resources, job roles, training programs | `00002_create_career_hub_tables.sql` |

## Engagement & Monetization

| Module | Description | Migration |
|--------|-------------|-----------|
| `reviews` | User-submitted reviews with moderation | `00010_reviews.sql` |
| `affiliates` | Affiliate link management and tracking | `00012_affiliates.sql` |
| `clickAnalytics` | Click event tracking and reporting | `00008_click_analytics.sql` |
| `merchants` | Merchant/vendor management | `00013_merchants.sql` |
| `ratings` | Rating aggregation from external sources | `00001_create_ratings_tables.sql` |

## SEO & Technical

| Module | Description | Migration |
|--------|-------------|-----------|
| `seo` | SEO dashboard with keyword tracking | `00019_seo_keyword_fields.sql` |
| `redirects` | URL redirect management (301/302) | `00020_links_redirects.sql` |
| `linkChecker` | Broken link detection and monitoring | `00020_links_redirects.sql` |
| `internalLinks` | Internal link suggestions and management | `00021_internal_links.sql` |
| `imagesSeo` | Image SEO optimization tools | `00019_seo_keyword_fields.sql` |

## Tools & Public Features

| Module | Description | Migration |
|--------|-------------|-----------|
| `compareTools` | Side-by-side entity comparison | (uses directory tables) |
| `assessmentTool` | Interactive assessment/quiz builder | `00016_assessment_resources_config_tables.sql` |
| `resourcesPage` | Curated resource collections | `00016_assessment_resources_config_tables.sql` |
| `smallBusinessPage` | Small business focused content | (uses content pages) |

## Forms & Lead Capture

| Module | Description | Migration |
|--------|-------------|-----------|
| `forms` | Form builder with submission management | `00022_forms_and_leads.sql` |
| `ctaManager` | Call-to-action block management | `00022_forms_and_leads.sql` |

## System

| Module | Description | Migration |
|--------|-------------|-----------|
| `errorLog` | Application error tracking | `00018_error_log.sql` |
| `activityLog` | Admin action audit trail | `00007_activity_log.sql` |
| `bulkImport` | Bulk data import from CSV/JSON | (no dedicated migration) |

## Presets

### App Marketing Site
Modules: `contentPages`, `landingPages`, `mediaLibrary`, `forms`, `ctaManager`, `errorLog`, `activityLog`

### Blog / Content Site
Modules: `contentPages`, `mediaLibrary`, `listicles`, `seo`, `redirects`, `linkChecker`, `internalLinks`, `imagesSeo`, `errorLog`, `activityLog`

### Directory / Marketplace
Modules: `contentPages`, `mediaLibrary`, `directory`, `categories`, `frameworks`, `glossary`, `certifications`, `reviews`, `affiliates`, `clickAnalytics`, `ratings`, `seo`, `redirects`, `linkChecker`, `internalLinks`, `forms`, `ctaManager`, `errorLog`, `activityLog`, `bulkImport`

### Full Platform
All 31 modules enabled.

## Data Layer

Each module's data functions are available as subpath exports:

```typescript
import { getAllContentPages } from "@pandotic/universal-cms/data/content";
import { getAllEntities } from "@pandotic/universal-cms/data/entities";
import { getAllReviews } from "@pandotic/universal-cms/data/reviews";
import { getAllCategories } from "@pandotic/universal-cms/data/categories";
import { getAllMedia } from "@pandotic/universal-cms/data/media";
import { getAllSettings } from "@pandotic/universal-cms/data/settings";
import { getActivityLog } from "@pandotic/universal-cms/data/activity";
import { getErrors } from "@pandotic/universal-cms/data/errors";
import { getAllAffiliates } from "@pandotic/universal-cms/data/affiliates";
import { getAllCertifications } from "@pandotic/universal-cms/data/certifications";
import { getAllForms } from "@pandotic/universal-cms/data/forms";
import { getAllListicles } from "@pandotic/universal-cms/data/listicles";
import { getAllRedirects } from "@pandotic/universal-cms/data/redirects";
import { getInternalLinks } from "@pandotic/universal-cms/data/internal-links";
```

All functions take `client: SupabaseClient` as their first parameter.
