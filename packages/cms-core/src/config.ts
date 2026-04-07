// Universal CMS Configuration Types & Presets
// Sites provide their own CmsConfig values. This file exports only
// the shared types and quick-start module presets.

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
  | "bulkImport"
  | "apiUsage";

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

// ─── Module → Migration Mapping ─────────────────────────────────────────────
// Maps each module to the SQL migration files it requires.
// Core migrations (auth, profiles, site_settings) are always required.

export const MODULE_MIGRATIONS: Record<CmsModuleName, string[]> = {
  // Content & Pages
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
  apiUsage: ["00025_api_usage_tracking"],
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

const ALL_MODULES: CmsModuleName[] = [
  "contentPages", "landingPages", "mediaLibrary", "listicles", "brandGuide",
  "directory", "categories", "frameworks", "glossary", "certifications",
  "careerHub", "reviews", "affiliates", "clickAnalytics", "merchants",
  "ratings", "forms", "ctaManager", "seo", "redirects", "linkChecker",
  "internalLinks", "imagesSeo", "compareTools", "assessmentTool",
  "resourcesPage", "smallBusinessPage", "errorLog", "activityLog",
  "bulkImport", "apiUsage",
];

export const modulePresets = {
  appMarketing: {
    name: "App Marketing Site",
    description: "Simple marketing site for a SaaS or mobile app. Landing pages, blog, media, basic SEO.",
    modules: [
      "contentPages",
      "landingPages",
      "mediaLibrary",
      "forms",
      "ctaManager",
      "errorLog",
      "activityLog",
    ] as CmsModuleName[],
  },

  blog: {
    name: "Blog / Content Site",
    description: "Content-focused site with articles, SEO tools, and link management.",
    modules: [
      "contentPages",
      "mediaLibrary",
      "listicles",
      "seo",
      "redirects",
      "linkChecker",
      "internalLinks",
      "imagesSeo",
      "errorLog",
      "activityLog",
    ] as CmsModuleName[],
  },

  directory: {
    name: "Directory / Marketplace",
    description: "Directory site with entities, categories, reviews, affiliate links, and full SEO.",
    modules: [
      "contentPages",
      "mediaLibrary",
      "directory",
      "categories",
      "frameworks",
      "glossary",
      "certifications",
      "reviews",
      "affiliates",
      "clickAnalytics",
      "ratings",
      "seo",
      "redirects",
      "linkChecker",
      "internalLinks",
      "forms",
      "ctaManager",
      "errorLog",
      "activityLog",
      "bulkImport",
    ] as CmsModuleName[],
  },

  full: {
    name: "Full Platform",
    description: "Everything enabled — directory, career hub, assessment tools, all SEO, all engagement.",
    modules: ALL_MODULES,
  },
} satisfies Record<string, ModulePreset>;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Build a modules record from a preset */
export function modulesFromPreset(preset: ModulePreset): Record<CmsModuleName, boolean> {
  const all: Record<string, boolean> = {};
  for (const key of ALL_MODULES) {
    all[key] = preset.modules.includes(key);
  }
  return all as Record<CmsModuleName, boolean>;
}

/** Check if a module is enabled in a config */
export function isModuleEnabled(config: CmsConfig, module: CmsModuleName): boolean {
  return config.modules[module] ?? false;
}

/** Get the deduplicated list of migrations required for the enabled modules */
export function getRequiredMigrations(config: CmsConfig): string[] {
  const migrations = new Set<string>(CORE_MIGRATIONS);
  for (const [module, enabled] of Object.entries(config.modules)) {
    if (enabled) {
      const moduleMigrations = MODULE_MIGRATIONS[module as CmsModuleName] ?? [];
      moduleMigrations.forEach((m) => migrations.add(m));
    }
  }
  return [...migrations].sort();
}
