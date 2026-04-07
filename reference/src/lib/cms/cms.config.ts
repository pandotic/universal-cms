// Universal CMS Configuration
// Each site provides its own values here. This is the single config file
// that parameterizes the entire CMS for a specific project.

export type CmsModuleName =
  // Content & Pages
  | "contentPages"
  | "landingPages"
  | "mediaLibrary"
  | "listicles"
  | "brandGuide"
  // Directory & Taxonomy
  | "directory"
  | "categories"
  | "frameworks"
  | "glossary"
  | "certifications"
  // Career & Education
  | "careerHub"
  // Engagement & Monetization
  | "reviews"
  | "affiliates"
  | "clickAnalytics"
  | "merchants"
  | "ratings"
  // SEO & Technical
  | "seo"
  | "redirects"
  | "linkChecker"
  | "internalLinks"
  | "imagesSeo"
  // Tools & Public Features
  | "compareTools"
  | "assessmentTool"
  | "resourcesPage"
  | "smallBusinessPage"
  // Forms & Lead Capture
  | "forms"
  | "ctaManager"
  // System
  | "errorLog"
  | "activityLog"
  | "bulkImport";

export type CmsRole = "admin" | "editor" | "moderator";

export interface CmsNavItem {
  label: string;
  href: string;
  icon?: string;
  module?: CmsModuleName; // Only show if module is enabled
}

export interface CmsNavGroup {
  group: string;
  items: CmsNavItem[];
}

export interface CmsConfig {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  siteTagline: string;
  twitterHandle?: string;

  primaryEntity: {
    name: string; // table name / data key
    singular: string;
    plural: string;
    slugPrefix: string; // public URL prefix e.g. "/directory"
  };

  modules: Record<CmsModuleName, boolean>;
  roles: CmsRole[];

  adminNav: CmsNavGroup[];

  analytics: {
    // Provider-agnostic: configured via site_settings in admin
    // This just controls which providers are available
    availableProviders: string[];
  };

  storage: {
    mediaBucket: string;
    maxFileSizeMb: number;
    allowedMimeTypes: string[];
  };
}

export const cmsConfig: CmsConfig = {
  siteName: "ESGsource",
  siteUrl: "https://esgsource.com",
  siteDescription:
    "The definitive guide to ESG standards, data providers, software, and service providers.",
  siteTagline: "Navigate the ESG Ecosystem",
  twitterHandle: "@esgsource",

  primaryEntity: {
    name: "entities",
    singular: "Entity",
    plural: "Entities",
    slugPrefix: "/directory",
  },

  modules: {
    // Content & Pages
    contentPages: true,
    landingPages: true,
    mediaLibrary: true,
    listicles: true,
    brandGuide: true,
    // Directory & Taxonomy
    directory: true,
    categories: true,
    frameworks: true,
    glossary: true,
    certifications: true,
    // Career & Education
    careerHub: true,
    // Engagement & Monetization
    reviews: true,
    affiliates: true,
    clickAnalytics: true,
    merchants: true,
    ratings: true,
    // SEO & Technical
    seo: true,
    redirects: true,
    linkChecker: true,
    internalLinks: true,
    imagesSeo: true,
    // Tools & Public Features
    compareTools: true,
    assessmentTool: true,
    resourcesPage: true,
    smallBusinessPage: true,
    // Forms & Lead Capture
    forms: true,
    ctaManager: true,
    // System
    errorLog: true,
    activityLog: true,
    bulkImport: true,
  },

  roles: ["admin", "editor", "moderator"],

  adminNav: [
    {
      group: "Content",
      items: [
        { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
        {
          label: "Content Pages",
          href: "/admin/content-pages",
          icon: "FileText",
          module: "contentPages",
        },
        {
          label: "Listicles",
          href: "/admin/listicles",
          icon: "List",
          module: "listicles",
        },
        {
          label: "Media Library",
          href: "/admin/media",
          icon: "Image",
          module: "mediaLibrary",
        },
        {
          label: "Brand Guide",
          href: "/admin/brand-guide",
          icon: "BookOpen",
          module: "brandGuide",
        },
      ],
    },
    {
      group: "SEO",
      items: [
        { label: "SEO Dashboard", href: "/admin/seo", icon: "Search", module: "seo" },
        { label: "Keywords", href: "/admin/seo/keywords", icon: "Tag", module: "seo" },
        { label: "Links", href: "/admin/seo/links", icon: "LinkIcon2", module: "linkChecker" },
        { label: "Interlinking", href: "/admin/seo/interlinking", icon: "Link", module: "internalLinks" },
        { label: "Redirects", href: "/admin/seo/redirects", icon: "ArrowRight", module: "redirects" },
        { label: "Schema", href: "/admin/seo/schema", icon: "Code2", module: "seo" },
        { label: "Images", href: "/admin/seo/images", icon: "Image", module: "imagesSeo" },
      ],
    },
    {
      group: "Directory",
      items: [
        { label: "Entities", href: "/admin/directory", icon: "Building2", module: "directory" },
        {
          label: "Categories",
          href: "/admin/categories",
          icon: "FolderTree",
          module: "categories",
        },
        {
          label: "Frameworks",
          href: "/admin/frameworks",
          icon: "Scale",
          module: "frameworks",
        },
        {
          label: "Glossary",
          href: "/admin/glossary",
          icon: "BookA",
          module: "glossary",
        },
        {
          label: "Certifications",
          href: "/admin/certifications",
          icon: "Award",
          module: "certifications",
        },
      ],
    },
    {
      group: "Careers",
      items: [
        {
          label: "Career Hub",
          href: "/admin/careers-training",
          icon: "GraduationCap",
          module: "careerHub",
        },
      ],
    },
    {
      group: "Engagement",
      items: [
        {
          label: "Reviews",
          href: "/admin/reviews",
          icon: "MessageSquare",
          module: "reviews",
        },
        {
          label: "Affiliates",
          href: "/admin/affiliates",
          icon: "Link",
          module: "affiliates",
        },
        {
          label: "Click Analytics",
          href: "/admin/analytics",
          icon: "BarChart3",
          module: "clickAnalytics",
        },
        {
          label: "Forms",
          href: "/admin/forms",
          icon: "FileInput",
          module: "forms",
        },
        {
          label: "CTA Blocks",
          href: "/admin/cta-blocks",
          icon: "Megaphone",
          module: "ctaManager",
        },
      ],
    },
    {
      group: "System",
      items: [
        { label: "Users", href: "/admin/users", icon: "Users" },
        { label: "Settings", href: "/admin/settings", icon: "Settings" },
        { label: "Activity Log", href: "/admin/activity", icon: "History", module: "activityLog" },
        { label: "Error Log", href: "/admin/errors", icon: "Bug", module: "errorLog" },
        {
          label: "Bulk Import",
          href: "/admin/import",
          icon: "Upload",
          module: "bulkImport",
        },
      ],
    },
  ],

  analytics: {
    availableProviders: [
      "ga4",
      "gtm",
      "meta-pixel",
      "linkedin-insight",
      "rybbit",
      "posthog",
      "custom",
    ],
  },

  storage: {
    mediaBucket: "media",
    maxFileSizeMb: 10,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ],
  },
};

// ─── Module → Migration Mapping ─────────────────────────────────────────────
// Maps each module to the SQL migration files it requires.
// Core migrations (00003–00006) are always required (auth, profiles, site_settings).

export const MODULE_MIGRATIONS: Record<CmsModuleName, string[]> = {
  // Content & Pages — always-on core + content_pages
  contentPages: ["00004_content_pages"],
  landingPages: ["00004_content_pages"], // uses same table with type='landing'
  mediaLibrary: ["00005_media_library"],
  listicles: ["00009_listicles"],
  brandGuide: [], // stored in site_settings (no extra migration)
  // Directory & Taxonomy
  directory: ["00014_core_taxonomy_tables"],
  categories: ["00014_core_taxonomy_tables"],
  frameworks: ["00014_core_taxonomy_tables"],
  glossary: ["00014_core_taxonomy_tables"],
  certifications: ["00011_certifications"],
  // Career & Education
  careerHub: ["00002_create_career_hub_tables", "00015_seed_career_hub"],
  // Engagement & Monetization
  reviews: ["00010_reviews"],
  affiliates: ["00012_affiliates"],
  clickAnalytics: ["00008_click_analytics"],
  merchants: ["00013_merchants"],
  ratings: ["00001_create_ratings_tables"],
  // SEO & Technical
  seo: ["00019_seo_keyword_fields"],
  redirects: ["00020_links_redirects"],
  linkChecker: ["00020_links_redirects"],
  internalLinks: ["00021_internal_links"],
  imagesSeo: [], // UI-only, no tables
  // Tools & Public Features
  compareTools: [], // uses entities table from directory module
  assessmentTool: ["00016_assessment_resources_config_tables", "00017_seed_assessment_resources_config"],
  resourcesPage: ["00016_assessment_resources_config_tables"],
  smallBusinessPage: [], // stored in site_settings
  // Forms & Lead Capture
  forms: ["00022_forms_and_leads"],
  ctaManager: ["00022_forms_and_leads"],
  // System
  errorLog: ["00018_error_log"],
  activityLog: ["00007_activity_log"],
  bulkImport: [], // UI-only, uses existing tables
};

// Migrations that are always required regardless of module selection
export const CORE_MIGRATIONS = [
  "00003_core_cms_roles_profiles",
  "00006_site_settings",
];

// ─── Module Presets ─────────────────────────────────────────────────────────
// Quick-start configurations for common site types.

export type ModulePreset = {
  name: string;
  description: string;
  modules: CmsModuleName[];
};

export const MODULE_PRESETS: ModulePreset[] = [
  {
    name: "App Marketing Site",
    description: "Simple marketing site for a SaaS or mobile app. Landing pages, blog, media, basic SEO.",
    modules: [
      "contentPages",
      "landingPages",
      "mediaLibrary",
      "brandGuide",
      "forms",
      "ctaManager",
      "seo",
      "redirects",
      "errorLog",
    ],
  },
  {
    name: "Blog / Content Site",
    description: "Content-focused site with articles, SEO tools, and link management.",
    modules: [
      "contentPages",
      "landingPages",
      "mediaLibrary",
      "listicles",
      "brandGuide",
      "forms",
      "ctaManager",
      "seo",
      "redirects",
      "linkChecker",
      "internalLinks",
      "imagesSeo",
      "errorLog",
      "activityLog",
    ],
  },
  {
    name: "Directory / Marketplace",
    description: "Directory site with entities, categories, reviews, affiliate links, and full SEO.",
    modules: [
      "contentPages",
      "landingPages",
      "mediaLibrary",
      "listicles",
      "brandGuide",
      "directory",
      "categories",
      "frameworks",
      "glossary",
      "certifications",
      "reviews",
      "affiliates",
      "clickAnalytics",
      "merchants",
      "ratings",
      "compareTools",
      "forms",
      "ctaManager",
      "seo",
      "redirects",
      "linkChecker",
      "internalLinks",
      "imagesSeo",
      "errorLog",
      "activityLog",
      "bulkImport",
    ],
  },
  {
    name: "Full Platform (ESGsource)",
    description: "Everything enabled — directory, career hub, assessment tools, all SEO, all engagement.",
    modules: Object.keys({
      contentPages: true, landingPages: true, mediaLibrary: true, listicles: true, brandGuide: true,
      directory: true, categories: true, frameworks: true, glossary: true, certifications: true,
      careerHub: true, reviews: true, affiliates: true, clickAnalytics: true, merchants: true,
      ratings: true, forms: true, ctaManager: true, seo: true, redirects: true, linkChecker: true,
      internalLinks: true, imagesSeo: true, compareTools: true, assessmentTool: true,
      resourcesPage: true, smallBusinessPage: true, errorLog: true, activityLog: true,
      bulkImport: true,
    }) as CmsModuleName[],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Check if a module is enabled */
export function isModuleEnabled(module: CmsModuleName): boolean {
  return cmsConfig.modules[module] ?? false;
}

/** Get the deduplicated list of migrations required for the enabled modules */
export function getRequiredMigrations(): string[] {
  const migrations = new Set<string>(CORE_MIGRATIONS);
  for (const [module, enabled] of Object.entries(cmsConfig.modules)) {
    if (enabled) {
      const moduleMigrations = MODULE_MIGRATIONS[module as CmsModuleName] ?? [];
      moduleMigrations.forEach((m) => migrations.add(m));
    }
  }
  return [...migrations].sort();
}

/** Build a modules record from a preset */
export function modulesFromPreset(preset: ModulePreset): Record<CmsModuleName, boolean> {
  const all: Record<string, boolean> = {};
  for (const key of Object.keys(MODULE_MIGRATIONS)) {
    all[key] = preset.modules.includes(key as CmsModuleName);
  }
  return all as Record<CmsModuleName, boolean>;
}
