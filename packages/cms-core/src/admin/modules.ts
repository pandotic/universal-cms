/**
 * Universal CMS — Admin Module Registry.
 *
 * Single source of truth for the modules a site can enable. Each consuming
 * repo activates a subset of these against its own Supabase project; modules
 * not in the active subset are still visible in the admin nav (greyed out)
 * so operators can see what the universal CMS ships.
 *
 * The `previewRows` are sample entries used by capability previews (e.g. the
 * Hub's `/cms/*` pages) when a module has no live data on the current site.
 */

export type AdminLayerKey = 'marketing-cms' | 'app-admin' | 'group-admin';

export interface AdminLayer {
  key: AdminLayerKey;
  title: string;
  description: string;
}

export interface AdminModulePreviewRow {
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
}

export interface AdminModule {
  id: string;
  layer: AdminLayerKey;
  label: string;
  description: string;
  previewRows: AdminModulePreviewRow[];
}

export const ADMIN_LAYERS: AdminLayer[] = [
  {
    key: 'marketing-cms',
    title: 'Marketing CMS',
    description:
      'Everything a marketing site ships: pages, media, SEO, links, forms, CTAs.',
  },
  {
    key: 'app-admin',
    title: 'App Admin',
    description:
      'Per-app SaaS admin: directory, taxonomy, reviews, ratings, affiliate & engagement.',
  },
  {
    key: 'group-admin',
    title: 'Group Admin',
    description:
      'Team, roles, audit trail, errors, and feature rollouts — shared across apps.',
  },
];

export const ADMIN_MODULES: AdminModule[] = [
  // ─── Marketing CMS ───────────────────────────────────────────────
  {
    id: 'contentPages',
    layer: 'marketing-cms',
    label: 'Content Pages',
    description: 'Long-form articles, guides, and blog posts.',
    previewRows: [
      { title: 'How to choose a CRM in 2026', subtitle: '/guides/choose-a-crm', meta: '8,412 views', status: 'Published' },
      { title: "The Indie Hacker's SEO Playbook", subtitle: '/blog/indie-seo', meta: '3,921 views', status: 'Published' },
      { title: 'Building a portfolio that converts', subtitle: '/blog/portfolio-conversion', meta: 'Draft', status: 'Draft' },
    ],
  },
  {
    id: 'landingPages',
    layer: 'marketing-cms',
    label: 'Landing Pages',
    description: 'Conversion-focused pages with hero, features, CTAs.',
    previewRows: [
      { title: 'Homepage', subtitle: '/', meta: 'Hero + 4 sections', status: 'Live' },
      { title: 'Pricing', subtitle: '/pricing', meta: 'Compare tiers', status: 'Live' },
      { title: 'Launch week special', subtitle: '/launch', meta: 'A/B test active', status: 'Testing' },
    ],
  },
  {
    id: 'mediaLibrary',
    layer: 'marketing-cms',
    label: 'Media Library',
    description: 'Images, videos, and file uploads.',
    previewRows: [
      { title: 'hero-background.jpg', subtitle: '1.2 MB · 2400×1600', meta: 'Used in 3 pages' },
      { title: 'product-demo.mp4', subtitle: '14.8 MB · 00:42', meta: 'Used in /features' },
      { title: 'team-photo.jpg', subtitle: '820 KB · 1600×1067', meta: 'Used in /about' },
    ],
  },
  {
    id: 'listicles',
    layer: 'marketing-cms',
    label: 'Listicles',
    description: 'Ranked lists with items, scores, and affiliate links.',
    previewRows: [
      { title: '10 Best SaaS Tools for 2026', subtitle: '10 items', meta: '12,104 views', status: 'Published' },
      { title: 'Top 7 Indie Dev Newsletters', subtitle: '7 items', meta: '4,228 views', status: 'Published' },
    ],
  },
  {
    id: 'brandGuide',
    layer: 'marketing-cms',
    label: 'Brand Guide',
    description: 'Logos, colors, typography, voice.',
    previewRows: [
      { title: 'Primary logo (light)', meta: 'SVG · 4 KB' },
      { title: 'Color palette', subtitle: '6 colors', meta: 'Updated 3 days ago' },
      { title: 'Voice & tone', subtitle: 'Confident, pragmatic, direct', meta: 'v2.1' },
    ],
  },
  {
    id: 'seo',
    layer: 'marketing-cms',
    label: 'SEO',
    description: 'Meta tags, keyword targets, schema.',
    previewRows: [
      { title: '/pricing', subtitle: 'Target: “saas pricing calculator”', meta: 'Rank #12', status: 'Monitoring' },
      { title: '/blog/indie-seo', subtitle: 'Target: “indie seo guide”', meta: 'Rank #4', status: 'Good' },
    ],
  },
  {
    id: 'redirects',
    layer: 'marketing-cms',
    label: 'Redirects',
    description: '301s, 302s, domain-level rewrites.',
    previewRows: [
      { title: '/old-pricing → /pricing', subtitle: '301', meta: 'Added 2026-03-08' },
      { title: '/blog/old-slug → /blog/new-slug', subtitle: '301', meta: 'Added 2026-02-14' },
    ],
  },
  {
    id: 'linkChecker',
    layer: 'marketing-cms',
    label: 'Link Checker',
    description: 'Broken-link scans and fix queue.',
    previewRows: [
      { title: '/blog/tooling → https://retired-api.example.com', subtitle: '404', meta: 'Found 6h ago', status: 'Broken' },
      { title: '/guides/setup → https://github.com/...', subtitle: '200', meta: 'Last check 2h ago', status: 'OK' },
    ],
  },
  {
    id: 'internalLinks',
    layer: 'marketing-cms',
    label: 'Internal Links',
    description: 'Graph of page-to-page links with anchor text.',
    previewRows: [
      { title: '/blog/indie-seo', subtitle: '12 outbound / 8 inbound', meta: 'Orphan risk: low' },
      { title: '/pricing', subtitle: '3 outbound / 22 inbound', meta: 'Hub page' },
    ],
  },
  {
    id: 'imagesSeo',
    layer: 'marketing-cms',
    label: 'Images SEO',
    description: 'Alt text coverage and image optimization.',
    previewRows: [
      { title: 'Pages missing alt text', subtitle: '4 pages affected', meta: 'Coverage 87%', status: 'Needs attention' },
      { title: 'Oversized images', subtitle: '2 images >500KB', meta: 'Est. savings 1.4MB' },
    ],
  },
  {
    id: 'ctaManager',
    layer: 'marketing-cms',
    label: 'CTA Manager',
    description: 'Centrally managed call-to-action blocks.',
    previewRows: [
      { title: '“Start free trial”', subtitle: 'Used on 12 pages', meta: 'CTR 4.2%' },
      { title: '“Book a demo”', subtitle: 'Used on 3 pages', meta: 'CTR 1.8%' },
    ],
  },
  {
    id: 'forms',
    layer: 'marketing-cms',
    label: 'Forms',
    description: 'Lead capture forms and submissions.',
    previewRows: [
      { title: 'Contact form', subtitle: '94 submissions this month', meta: 'Conversion 3.1%' },
      { title: 'Demo request', subtitle: '28 submissions this month', meta: 'Conversion 1.4%' },
    ],
  },

  // ─── App Admin ───────────────────────────────────────────────────
  {
    id: 'directory',
    layer: 'app-admin',
    label: 'Directory',
    description: 'Entities with rich metadata, filters, and facets.',
    previewRows: [
      { title: 'Linear', subtitle: 'Project management · /tools/linear', meta: 'Featured', status: 'Published' },
      { title: 'Vercel', subtitle: 'Hosting · /tools/vercel', meta: 'Staff pick', status: 'Published' },
      { title: 'Supabase', subtitle: 'Database & Auth · /tools/supabase', meta: '4.8★ (312)', status: 'Published' },
    ],
  },
  {
    id: 'categories',
    layer: 'app-admin',
    label: 'Categories',
    description: 'Taxonomy for directory entities.',
    previewRows: [
      { title: 'Project Management', subtitle: '28 entities' },
      { title: 'Databases & Backend', subtitle: '41 entities' },
      { title: 'AI & ML', subtitle: '63 entities' },
    ],
  },
  {
    id: 'frameworks',
    layer: 'app-admin',
    label: 'Frameworks',
    description: 'Technology tags for compatibility filtering.',
    previewRows: [
      { title: 'Next.js', subtitle: 'Used by 89 entities' },
      { title: 'React', subtitle: 'Used by 142 entities' },
      { title: 'Supabase', subtitle: 'Used by 34 entities' },
    ],
  },
  {
    id: 'glossary',
    layer: 'app-admin',
    label: 'Glossary',
    description: 'Term definitions with auto-linking.',
    previewRows: [
      { title: 'API', subtitle: 'Application Programming Interface', meta: 'Auto-linked on 38 pages' },
      { title: 'RLS', subtitle: 'Row-Level Security', meta: 'Auto-linked on 4 pages' },
    ],
  },
  {
    id: 'certifications',
    layer: 'app-admin',
    label: 'Certifications',
    description: 'Verified badges and certification tracks.',
    previewRows: [
      { title: 'SOC 2 Type II', subtitle: '12 entities verified', meta: 'Updated monthly' },
      { title: 'ISO 27001', subtitle: '8 entities verified', meta: 'Updated monthly' },
    ],
  },
  {
    id: 'careerHub',
    layer: 'app-admin',
    label: 'Career Hub',
    description: 'Job listings, career paths, interview prep.',
    previewRows: [
      { title: 'Senior Product Designer', subtitle: 'Remote · $140k–180k', meta: 'Posted 2d ago' },
      { title: 'Staff Frontend Engineer', subtitle: 'NYC or Remote · $180k–240k', meta: 'Posted 5d ago' },
    ],
  },
  {
    id: 'reviews',
    layer: 'app-admin',
    label: 'Reviews',
    description: 'User-submitted reviews with moderation.',
    previewRows: [
      { title: '“Changed how our team ships”', subtitle: 'Linear · 5★', meta: 'Verified user', status: 'Published' },
      { title: '“Steep learning curve but worth it”', subtitle: 'Supabase · 4★', meta: 'Pending mod', status: 'Pending' },
    ],
  },
  {
    id: 'affiliates',
    layer: 'app-admin',
    label: 'Affiliates',
    description: 'Affiliate links with click tracking and revenue.',
    previewRows: [
      { title: 'Vercel Pro', subtitle: '$45 avg commission', meta: '124 clicks / 8 conversions' },
      { title: 'Supabase Team', subtitle: '$60 avg commission', meta: '87 clicks / 5 conversions' },
    ],
  },
  {
    id: 'clickAnalytics',
    layer: 'app-admin',
    label: 'Click Analytics',
    description: 'Outbound link and CTA click tracking.',
    previewRows: [
      { title: 'External links this month', subtitle: '14,281 clicks', meta: '+18% vs last month' },
      { title: 'Top destination', subtitle: 'github.com', meta: '3,104 clicks' },
    ],
  },
  {
    id: 'merchants',
    layer: 'app-admin',
    label: 'Merchants',
    description: 'Seller/vendor accounts for marketplace listings.',
    previewRows: [
      { title: 'Acme Inc.', subtitle: '12 listings', meta: 'Verified · since 2024' },
      { title: 'Indie Studio LLC', subtitle: '3 listings', meta: 'Pending verification' },
    ],
  },
  {
    id: 'ratings',
    layer: 'app-admin',
    label: 'Ratings',
    description: 'Multi-dimensional scoring with aggregate display.',
    previewRows: [
      { title: 'Linear', subtitle: 'Overall 4.8 ★', meta: 'UX 4.9 · Value 4.6 · Support 4.7' },
      { title: 'Supabase', subtitle: 'Overall 4.6 ★', meta: 'UX 4.4 · Value 4.8 · Support 4.5' },
    ],
  },
  {
    id: 'compareTools',
    layer: 'app-admin',
    label: 'Compare Tools',
    description: 'Side-by-side comparison pages.',
    previewRows: [
      { title: 'Linear vs Jira', subtitle: '12,904 views', status: 'Published' },
      { title: 'Supabase vs Firebase', subtitle: '8,412 views', status: 'Published' },
    ],
  },
  {
    id: 'assessmentTool',
    layer: 'app-admin',
    label: 'Assessment Tool',
    description: 'Interactive quizzes that recommend entities.',
    previewRows: [
      { title: '“Which CRM is right for you?”', subtitle: '6 questions · 4 outcomes', meta: '1,204 completions' },
      { title: '“Find your ideal stack”', subtitle: '8 questions · 12 outcomes', meta: '842 completions' },
    ],
  },
  {
    id: 'resourcesPage',
    layer: 'app-admin',
    label: 'Resources Page',
    description: 'Curated external resources with descriptions.',
    previewRows: [
      { title: 'Indie Hackers community', subtitle: 'https://indiehackers.com', meta: 'Category: Community' },
      { title: 'The Lean Startup', subtitle: 'Book by Eric Ries', meta: 'Category: Books' },
    ],
  },
  {
    id: 'smallBusinessPage',
    layer: 'app-admin',
    label: 'Small Business Page',
    description: 'Vertical-specific landing template.',
    previewRows: [
      { title: 'Coffee shops', subtitle: '/small-business/coffee-shops', meta: 'Updated 1 week ago' },
      { title: 'Yoga studios', subtitle: '/small-business/yoga-studios', meta: 'Updated 3 weeks ago' },
    ],
  },
  {
    id: 'bulkImport',
    layer: 'app-admin',
    label: 'Bulk Import',
    description: 'CSV / JSON bulk content upload.',
    previewRows: [
      { title: 'entities_2026_q1.csv', subtitle: '412 rows', meta: 'Imported 2026-04-02', status: 'Complete' },
      { title: 'glossary_terms.json', subtitle: '89 terms', meta: 'Imported 2026-03-18', status: 'Complete' },
    ],
  },
  {
    id: 'apiUsage',
    layer: 'app-admin',
    label: 'API Usage',
    description: 'Per-key request volume and quotas.',
    previewRows: [
      { title: 'prod-web-key', subtitle: '482k requests this month', meta: 'Quota 94%' },
      { title: 'staging-key', subtitle: '12k requests this month', meta: 'Quota 8%' },
    ],
  },

  // ─── Group Admin ─────────────────────────────────────────────────
  {
    id: 'users',
    layer: 'group-admin',
    label: 'Users',
    description: 'Team members with role assignments.',
    previewRows: [
      { title: 'Dan Golden', subtitle: 'dan@pandotic.com', meta: 'super_admin', status: 'Active' },
      { title: 'Alex Kim', subtitle: 'alex@pandotic.com', meta: 'group_admin', status: 'Active' },
      { title: 'Jordan Lee', subtitle: 'jordan@pandotic.com', meta: 'member', status: 'Active' },
    ],
  },
  {
    id: 'roles',
    layer: 'group-admin',
    label: 'Roles',
    description: 'Custom roles with granular permissions.',
    previewRows: [
      { title: 'super_admin', subtitle: 'Full platform access', meta: '2 users' },
      { title: 'group_admin', subtitle: 'Manage assigned groups', meta: '4 users' },
      { title: 'member', subtitle: 'Read + edit within groups', meta: '12 users' },
      { title: 'viewer', subtitle: 'Read-only', meta: '7 users' },
    ],
  },
  {
    id: 'activityLog',
    layer: 'group-admin',
    label: 'Activity Log',
    description: 'Audit trail of admin actions.',
    previewRows: [
      { title: 'Updated property “pandotic-site”', subtitle: 'dan@pandotic.com', meta: '2 minutes ago' },
      { title: 'Created group “Client: Acme”', subtitle: 'alex@pandotic.com', meta: '1 hour ago' },
      { title: 'Enabled module “listicles” on pandotic-site', subtitle: 'dan@pandotic.com', meta: '3 hours ago' },
    ],
  },
  {
    id: 'errorLog',
    layer: 'group-admin',
    label: 'Error Log',
    description: 'Runtime errors with stack traces and fingerprints.',
    previewRows: [
      { title: "TypeError: Cannot read property 'x' of undefined", subtitle: '/api/items · runtime', meta: '14 occurrences', status: 'Unresolved' },
      { title: 'FetchError: timeout after 5000ms', subtitle: '/api/external · api', meta: '3 occurrences', status: 'Resolved' },
    ],
  },
  {
    id: 'featureFlags',
    layer: 'group-admin',
    label: 'Feature Flags',
    description: 'Per-user and per-property feature toggles.',
    previewRows: [
      { title: 'new_editor', subtitle: 'Rollout 25%', meta: 'Enabled for 4 users' },
      { title: 'ai_writer', subtitle: 'Off', meta: 'Allowlist: 2 users' },
    ],
  },
];

const MODULE_INDEX: Record<string, AdminModule> = Object.fromEntries(
  ADMIN_MODULES.map((m) => [m.id, m]),
);

const LAYER_INDEX: Record<AdminLayerKey, AdminLayer> = Object.fromEntries(
  ADMIN_LAYERS.map((l) => [l.key, l]),
) as Record<AdminLayerKey, AdminLayer>;

export function getAdminModule(id: string): AdminModule | undefined {
  return MODULE_INDEX[id];
}

export function getAdminLayer(key: AdminLayerKey): AdminLayer {
  return LAYER_INDEX[key];
}

export function getAdminModulesByLayer(layer: AdminLayerKey): AdminModule[] {
  return ADMIN_MODULES.filter((m) => m.layer === layer);
}

export function listAdminModuleIds(): string[] {
  return ADMIN_MODULES.map((m) => m.id);
}
