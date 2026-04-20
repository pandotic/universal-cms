// Fixture data for CMS Admin capability previews.
// These are rendered ONLY in the Hub's /cms/* preview pages so operators can
// see what each module looks like with content. The fixtures never touch any
// Supabase DB and never ship via the npm package.

export interface FixtureRow {
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
}

export interface ModuleFixture {
  label: string;
  description: string;
  rows: FixtureRow[];
}

export type FixtureKey = string;

export const MODULE_FIXTURES: Record<FixtureKey, ModuleFixture> = {
  // ─── Marketing CMS ───────────────────────────────────────────────
  contentPages: {
    label: "Content Pages",
    description: "Long-form articles, guides, and blog posts.",
    rows: [
      { title: "How to choose a CRM in 2026", subtitle: "/guides/choose-a-crm", meta: "8,412 views", status: "Published" },
      { title: "The Indie Hacker's SEO Playbook", subtitle: "/blog/indie-seo", meta: "3,921 views", status: "Published" },
      { title: "Building a portfolio that converts", subtitle: "/blog/portfolio-conversion", meta: "Draft", status: "Draft" },
    ],
  },
  landingPages: {
    label: "Landing Pages",
    description: "Conversion-focused pages with hero, features, CTAs.",
    rows: [
      { title: "Homepage", subtitle: "/", meta: "Hero + 4 sections", status: "Live" },
      { title: "Pricing", subtitle: "/pricing", meta: "Compare tiers", status: "Live" },
      { title: "Launch week special", subtitle: "/launch", meta: "A/B test active", status: "Testing" },
    ],
  },
  mediaLibrary: {
    label: "Media Library",
    description: "Images, videos, and file uploads.",
    rows: [
      { title: "hero-background.jpg", subtitle: "1.2 MB \u00b7 2400\u00d71600", meta: "Used in 3 pages" },
      { title: "product-demo.mp4", subtitle: "14.8 MB \u00b7 00:42", meta: "Used in /features" },
      { title: "team-photo.jpg", subtitle: "820 KB \u00b7 1600\u00d71067", meta: "Used in /about" },
    ],
  },
  listicles: {
    label: "Listicles",
    description: "Ranked lists with items, scores, and affiliate links.",
    rows: [
      { title: "10 Best SaaS Tools for 2026", subtitle: "10 items", meta: "12,104 views", status: "Published" },
      { title: "Top 7 Indie Dev Newsletters", subtitle: "7 items", meta: "4,228 views", status: "Published" },
    ],
  },
  brandGuide: {
    label: "Brand Guide",
    description: "Logos, colors, typography, voice.",
    rows: [
      { title: "Primary logo (light)", meta: "SVG \u00b7 4 KB" },
      { title: "Color palette", subtitle: "6 colors", meta: "Updated 3 days ago" },
      { title: "Voice & tone", subtitle: "Confident, pragmatic, direct", meta: "v2.1" },
    ],
  },
  seo: {
    label: "SEO",
    description: "Meta tags, keyword targets, schema.",
    rows: [
      { title: "/pricing", subtitle: "Target: \u201csaas pricing calculator\u201d", meta: "Rank #12", status: "Monitoring" },
      { title: "/blog/indie-seo", subtitle: "Target: \u201cindie seo guide\u201d", meta: "Rank #4", status: "Good" },
    ],
  },
  redirects: {
    label: "Redirects",
    description: "301s, 302s, domain-level rewrites.",
    rows: [
      { title: "/old-pricing \u2192 /pricing", subtitle: "301", meta: "Added 2026-03-08" },
      { title: "/blog/old-slug \u2192 /blog/new-slug", subtitle: "301", meta: "Added 2026-02-14" },
    ],
  },
  linkChecker: {
    label: "Link Checker",
    description: "Broken-link scans and fix queue.",
    rows: [
      { title: "/blog/tooling \u2192 https://retired-api.example.com", subtitle: "404", meta: "Found 6h ago", status: "Broken" },
      { title: "/guides/setup \u2192 https://github.com/...", subtitle: "200", meta: "Last check 2h ago", status: "OK" },
    ],
  },
  internalLinks: {
    label: "Internal Links",
    description: "Graph of page-to-page links with anchor text.",
    rows: [
      { title: "/blog/indie-seo", subtitle: "12 outbound / 8 inbound", meta: "Orphan risk: low" },
      { title: "/pricing", subtitle: "3 outbound / 22 inbound", meta: "Hub page" },
    ],
  },
  imagesSeo: {
    label: "Images SEO",
    description: "Alt text coverage and image optimization.",
    rows: [
      { title: "Pages missing alt text", subtitle: "4 pages affected", meta: "Coverage 87%", status: "Needs attention" },
      { title: "Oversized images", subtitle: "2 images >500KB", meta: "Est. savings 1.4MB" },
    ],
  },
  ctaManager: {
    label: "CTA Manager",
    description: "Centrally managed call-to-action blocks.",
    rows: [
      { title: "\u201cStart free trial\u201d", subtitle: "Used on 12 pages", meta: "CTR 4.2%" },
      { title: "\u201cBook a demo\u201d", subtitle: "Used on 3 pages", meta: "CTR 1.8%" },
    ],
  },
  forms: {
    label: "Forms",
    description: "Lead capture forms and submissions.",
    rows: [
      { title: "Contact form", subtitle: "94 submissions this month", meta: "Conversion 3.1%" },
      { title: "Demo request", subtitle: "28 submissions this month", meta: "Conversion 1.4%" },
    ],
  },

  // ─── App Admin ───────────────────────────────────────────────────
  directory: {
    label: "Directory",
    description: "Entities with rich metadata, filters, and facets.",
    rows: [
      { title: "Linear", subtitle: "Project management \u00b7 /tools/linear", meta: "Featured", status: "Published" },
      { title: "Vercel", subtitle: "Hosting \u00b7 /tools/vercel", meta: "Staff pick", status: "Published" },
      { title: "Supabase", subtitle: "Database & Auth \u00b7 /tools/supabase", meta: "4.8\u2605 (312)", status: "Published" },
    ],
  },
  categories: {
    label: "Categories",
    description: "Taxonomy for directory entities.",
    rows: [
      { title: "Project Management", subtitle: "28 entities" },
      { title: "Databases & Backend", subtitle: "41 entities" },
      { title: "AI & ML", subtitle: "63 entities" },
    ],
  },
  frameworks: {
    label: "Frameworks",
    description: "Technology tags for compatibility filtering.",
    rows: [
      { title: "Next.js", subtitle: "Used by 89 entities" },
      { title: "React", subtitle: "Used by 142 entities" },
      { title: "Supabase", subtitle: "Used by 34 entities" },
    ],
  },
  glossary: {
    label: "Glossary",
    description: "Term definitions with auto-linking.",
    rows: [
      { title: "API", subtitle: "Application Programming Interface", meta: "Auto-linked on 38 pages" },
      { title: "RLS", subtitle: "Row-Level Security", meta: "Auto-linked on 4 pages" },
    ],
  },
  certifications: {
    label: "Certifications",
    description: "Verified badges and certification tracks.",
    rows: [
      { title: "SOC 2 Type II", subtitle: "12 entities verified", meta: "Updated monthly" },
      { title: "ISO 27001", subtitle: "8 entities verified", meta: "Updated monthly" },
    ],
  },
  careerHub: {
    label: "Career Hub",
    description: "Job listings, career paths, interview prep.",
    rows: [
      { title: "Senior Product Designer", subtitle: "Remote \u00b7 $140k\u2013180k", meta: "Posted 2d ago" },
      { title: "Staff Frontend Engineer", subtitle: "NYC or Remote \u00b7 $180k\u2013240k", meta: "Posted 5d ago" },
    ],
  },
  reviews: {
    label: "Reviews",
    description: "User-submitted reviews with moderation.",
    rows: [
      { title: "\u201cChanged how our team ships\u201d", subtitle: "Linear \u00b7 5\u2605", meta: "Verified user", status: "Published" },
      { title: "\u201cSteep learning curve but worth it\u201d", subtitle: "Supabase \u00b7 4\u2605", meta: "Pending mod", status: "Pending" },
    ],
  },
  affiliates: {
    label: "Affiliates",
    description: "Affiliate links with click tracking and revenue.",
    rows: [
      { title: "Vercel Pro", subtitle: "$45 avg commission", meta: "124 clicks / 8 conversions" },
      { title: "Supabase Team", subtitle: "$60 avg commission", meta: "87 clicks / 5 conversions" },
    ],
  },
  clickAnalytics: {
    label: "Click Analytics",
    description: "Outbound link and CTA click tracking.",
    rows: [
      { title: "External links this month", subtitle: "14,281 clicks", meta: "+18% vs last month" },
      { title: "Top destination", subtitle: "github.com", meta: "3,104 clicks" },
    ],
  },
  merchants: {
    label: "Merchants",
    description: "Seller/vendor accounts for marketplace listings.",
    rows: [
      { title: "Acme Inc.", subtitle: "12 listings", meta: "Verified \u00b7 since 2024" },
      { title: "Indie Studio LLC", subtitle: "3 listings", meta: "Pending verification" },
    ],
  },
  ratings: {
    label: "Ratings",
    description: "Multi-dimensional scoring with aggregate display.",
    rows: [
      { title: "Linear", subtitle: "Overall 4.8 \u2605", meta: "UX 4.9 \u00b7 Value 4.6 \u00b7 Support 4.7" },
      { title: "Supabase", subtitle: "Overall 4.6 \u2605", meta: "UX 4.4 \u00b7 Value 4.8 \u00b7 Support 4.5" },
    ],
  },
  compareTools: {
    label: "Compare Tools",
    description: "Side-by-side comparison pages.",
    rows: [
      { title: "Linear vs Jira", subtitle: "12,904 views", status: "Published" },
      { title: "Supabase vs Firebase", subtitle: "8,412 views", status: "Published" },
    ],
  },
  assessmentTool: {
    label: "Assessment Tool",
    description: "Interactive quizzes that recommend entities.",
    rows: [
      { title: "\u201cWhich CRM is right for you?\u201d", subtitle: "6 questions \u00b7 4 outcomes", meta: "1,204 completions" },
      { title: "\u201cFind your ideal stack\u201d", subtitle: "8 questions \u00b7 12 outcomes", meta: "842 completions" },
    ],
  },
  resourcesPage: {
    label: "Resources Page",
    description: "Curated external resources with descriptions.",
    rows: [
      { title: "Indie Hackers community", subtitle: "https://indiehackers.com", meta: "Category: Community" },
      { title: "The Lean Startup", subtitle: "Book by Eric Ries", meta: "Category: Books" },
    ],
  },
  smallBusinessPage: {
    label: "Small Business Page",
    description: "Vertical-specific landing template.",
    rows: [
      { title: "Coffee shops", subtitle: "/small-business/coffee-shops", meta: "Updated 1 week ago" },
      { title: "Yoga studios", subtitle: "/small-business/yoga-studios", meta: "Updated 3 weeks ago" },
    ],
  },
  bulkImport: {
    label: "Bulk Import",
    description: "CSV / JSON bulk content upload.",
    rows: [
      { title: "entities_2026_q1.csv", subtitle: "412 rows", meta: "Imported 2026-04-02", status: "Complete" },
      { title: "glossary_terms.json", subtitle: "89 terms", meta: "Imported 2026-03-18", status: "Complete" },
    ],
  },
  apiUsage: {
    label: "API Usage",
    description: "Per-key request volume and quotas.",
    rows: [
      { title: "prod-web-key", subtitle: "482k requests this month", meta: "Quota 94%" },
      { title: "staging-key", subtitle: "12k requests this month", meta: "Quota 8%" },
    ],
  },

  // ─── Group Admin ─────────────────────────────────────────────────
  users: {
    label: "Users",
    description: "Team members with role assignments.",
    rows: [
      { title: "Dan Golden", subtitle: "dan@pandotic.com", meta: "super_admin", status: "Active" },
      { title: "Alex Kim", subtitle: "alex@pandotic.com", meta: "group_admin", status: "Active" },
      { title: "Jordan Lee", subtitle: "jordan@pandotic.com", meta: "member", status: "Active" },
    ],
  },
  roles: {
    label: "Roles",
    description: "Custom roles with granular permissions.",
    rows: [
      { title: "super_admin", subtitle: "Full platform access", meta: "2 users" },
      { title: "group_admin", subtitle: "Manage assigned groups", meta: "4 users" },
      { title: "member", subtitle: "Read + edit within groups", meta: "12 users" },
      { title: "viewer", subtitle: "Read-only", meta: "7 users" },
    ],
  },
  activityLog: {
    label: "Activity Log",
    description: "Audit trail of admin actions.",
    rows: [
      { title: "Updated property \u201cpandotic-site\u201d", subtitle: "dan@pandotic.com", meta: "2 minutes ago" },
      { title: "Created group \u201cClient: Acme\u201d", subtitle: "alex@pandotic.com", meta: "1 hour ago" },
      { title: "Enabled module \u201clisticles\u201d on pandotic-site", subtitle: "dan@pandotic.com", meta: "3 hours ago" },
    ],
  },
  errorLog: {
    label: "Error Log",
    description: "Runtime errors with stack traces and fingerprints.",
    rows: [
      { title: "TypeError: Cannot read property 'x' of undefined", subtitle: "/api/items \u00b7 runtime", meta: "14 occurrences", status: "Unresolved" },
      { title: "FetchError: timeout after 5000ms", subtitle: "/api/external \u00b7 api", meta: "3 occurrences", status: "Resolved" },
    ],
  },
  featureFlags: {
    label: "Feature Flags",
    description: "Per-user and per-property feature toggles.",
    rows: [
      { title: "new_editor", subtitle: "Rollout 25%", meta: "Enabled for 4 users" },
      { title: "ai_writer", subtitle: "Off", meta: "Allowlist: 2 users" },
    ],
  },
};

// ─── Admin Layer Groupings ─────────────────────────────────────────

export const ADMIN_LAYER_MODULES: Record<
  "marketing-cms" | "app-admin" | "group-admin",
  { title: string; description: string; modules: FixtureKey[] }
> = {
  "marketing-cms": {
    title: "Marketing CMS",
    description:
      "Everything a marketing site ships: pages, media, SEO, links, forms, CTAs.",
    modules: [
      "contentPages",
      "landingPages",
      "mediaLibrary",
      "listicles",
      "brandGuide",
      "seo",
      "redirects",
      "linkChecker",
      "internalLinks",
      "imagesSeo",
      "ctaManager",
      "forms",
    ],
  },
  "app-admin": {
    title: "App Admin",
    description:
      "Per-app SaaS admin: directory, taxonomy, reviews, ratings, affiliate & engagement.",
    modules: [
      "directory",
      "categories",
      "frameworks",
      "glossary",
      "certifications",
      "careerHub",
      "reviews",
      "affiliates",
      "clickAnalytics",
      "merchants",
      "ratings",
      "compareTools",
      "assessmentTool",
      "resourcesPage",
      "smallBusinessPage",
      "bulkImport",
      "apiUsage",
    ],
  },
  "group-admin": {
    title: "Group Admin",
    description:
      "Team, roles, audit trail, errors, and feature rollouts \u2014 shared across apps.",
    modules: ["users", "roles", "activityLog", "errorLog", "featureFlags"],
  },
};

export function getFixture(key: FixtureKey): ModuleFixture | undefined {
  return MODULE_FIXTURES[key];
}
