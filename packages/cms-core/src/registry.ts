// Universal CMS Module Registry
// Exports detailed metadata about all CMS modules for use by the fleet dashboard.

import type { CmsModuleName } from "./config";
import { MODULE_MIGRATIONS } from "./config";

export interface ModuleInfo {
  name: CmsModuleName;
  label: string;
  description: string;
  category: "content" | "directory" | "career" | "engagement" | "seo" | "tools" | "forms" | "system";
  migrations: string[];
  dataExport?: string;
  adminPath?: string;
}

export const MODULE_REGISTRY: ModuleInfo[] = [
  // ─── Content ──────────────────────────────────────────────────────────────
  {
    name: "contentPages",
    label: "Content Pages",
    description: "Create and manage blog posts, articles, and static pages with a rich text editor.",
    category: "content",
    migrations: MODULE_MIGRATIONS.contentPages,
    dataExport: "./data/content",
    adminPath: "/admin/content-pages",
  },
  {
    name: "landingPages",
    label: "Landing Pages",
    description: "Build conversion-focused landing pages with customizable sections and CTAs.",
    category: "content",
    migrations: MODULE_MIGRATIONS.landingPages,
    dataExport: "./data/content",
    adminPath: "/admin/landing-pages",
  },
  {
    name: "mediaLibrary",
    label: "Media Library",
    description: "Upload, organize, and manage images, documents, and other media assets.",
    category: "content",
    migrations: MODULE_MIGRATIONS.mediaLibrary,
    dataExport: "./data/media",
    adminPath: "/admin/media",
  },
  {
    name: "listicles",
    label: "Listicles",
    description: "Create ranked and curated list-style articles with structured item data.",
    category: "content",
    migrations: MODULE_MIGRATIONS.listicles,
    dataExport: "./data/listicles",
    adminPath: "/admin/listicles",
  },
  {
    name: "brandGuide",
    label: "Brand Guide",
    description: "Define brand colors, typography, logos, and voice guidelines stored in site settings.",
    category: "content",
    migrations: MODULE_MIGRATIONS.brandGuide,
    adminPath: "/admin/brand-guide",
  },

  // ─── Directory ────────────────────────────────────────────────────────────
  {
    name: "directory",
    label: "Directory",
    description: "Manage a directory of entities (tools, companies, products) with profiles and metadata.",
    category: "directory",
    migrations: MODULE_MIGRATIONS.directory,
    dataExport: "./data/entities",
    adminPath: "/admin/directory",
  },
  {
    name: "categories",
    label: "Categories",
    description: "Organize directory entities and content into hierarchical categories.",
    category: "directory",
    migrations: MODULE_MIGRATIONS.categories,
    dataExport: "./data/categories",
    adminPath: "/admin/categories",
  },
  {
    name: "frameworks",
    label: "Frameworks",
    description: "Define taxonomy frameworks for classifying and filtering directory entities.",
    category: "directory",
    migrations: MODULE_MIGRATIONS.frameworks,
    adminPath: "/admin/frameworks",
  },
  {
    name: "glossary",
    label: "Glossary",
    description: "Maintain a glossary of terms and definitions linked to directory taxonomy.",
    category: "directory",
    migrations: MODULE_MIGRATIONS.glossary,
    adminPath: "/admin/glossary",
  },
  {
    name: "certifications",
    label: "Certifications",
    description: "Track certifications, badges, and credentials associated with directory entities.",
    category: "directory",
    migrations: MODULE_MIGRATIONS.certifications,
    dataExport: "./data/certifications",
    adminPath: "/admin/certifications",
  },

  // ─── Career ───────────────────────────────────────────────────────────────
  {
    name: "careerHub",
    label: "Career Hub",
    description: "Publish career paths, job roles, salary data, and educational resources.",
    category: "career",
    migrations: MODULE_MIGRATIONS.careerHub,
    adminPath: "/admin/career-hub",
  },

  // ─── Engagement ───────────────────────────────────────────────────────────
  {
    name: "reviews",
    label: "Reviews",
    description: "Collect and display user reviews with moderation, ratings, and verified status.",
    category: "engagement",
    migrations: MODULE_MIGRATIONS.reviews,
    dataExport: "./data/reviews",
    adminPath: "/admin/reviews",
  },
  {
    name: "affiliates",
    label: "Affiliates",
    description: "Manage affiliate links, tracking parameters, and commission data for monetization.",
    category: "engagement",
    migrations: MODULE_MIGRATIONS.affiliates,
    dataExport: "./data/affiliates",
    adminPath: "/admin/affiliates",
  },
  {
    name: "clickAnalytics",
    label: "Click Analytics",
    description: "Track outbound link clicks and affiliate conversions with detailed analytics.",
    category: "engagement",
    migrations: MODULE_MIGRATIONS.clickAnalytics,
    adminPath: "/admin/click-analytics",
  },
  {
    name: "merchants",
    label: "Merchants",
    description: "Manage merchant profiles, pricing plans, and partnership details.",
    category: "engagement",
    migrations: MODULE_MIGRATIONS.merchants,
    adminPath: "/admin/merchants",
  },
  {
    name: "ratings",
    label: "Ratings",
    description: "Enable star ratings and scoring for directory entities with aggregation.",
    category: "engagement",
    migrations: MODULE_MIGRATIONS.ratings,
    adminPath: "/admin/ratings",
  },

  // ─── SEO ──────────────────────────────────────────────────────────────────
  {
    name: "seo",
    label: "SEO",
    description: "Manage meta titles, descriptions, keywords, and structured data for all pages.",
    category: "seo",
    migrations: MODULE_MIGRATIONS.seo,
    adminPath: "/admin/seo",
  },
  {
    name: "redirects",
    label: "Redirects",
    description: "Create and manage URL redirects (301/302) to preserve link equity and fix broken links.",
    category: "seo",
    migrations: MODULE_MIGRATIONS.redirects,
    dataExport: "./data/redirects",
    adminPath: "/admin/redirects",
  },
  {
    name: "linkChecker",
    label: "Link Checker",
    description: "Scan pages for broken internal and external links with scheduled checks.",
    category: "seo",
    migrations: MODULE_MIGRATIONS.linkChecker,
    dataExport: "./data/link-checker",
    adminPath: "/admin/link-checker",
  },
  {
    name: "internalLinks",
    label: "Internal Links",
    description: "Manage internal linking strategy with suggested links and anchor text optimization.",
    category: "seo",
    migrations: MODULE_MIGRATIONS.internalLinks,
    dataExport: "./data/internal-links",
    adminPath: "/admin/internal-links",
  },
  {
    name: "imagesSeo",
    label: "Images SEO",
    description: "Audit and optimize image alt text, file names, and compression for SEO.",
    category: "seo",
    migrations: MODULE_MIGRATIONS.imagesSeo,
    adminPath: "/admin/images-seo",
  },

  // ─── Tools ────────────────────────────────────────────────────────────────
  {
    name: "compareTools",
    label: "Compare Tools",
    description: "Generate side-by-side comparison pages for directory entities.",
    category: "tools",
    migrations: MODULE_MIGRATIONS.compareTools,
    adminPath: "/admin/compare-tools",
  },
  {
    name: "assessmentTool",
    label: "Assessment Tool",
    description: "Build interactive assessment quizzes that recommend directory entities based on answers.",
    category: "tools",
    migrations: MODULE_MIGRATIONS.assessmentTool,
    adminPath: "/admin/assessment-tool",
  },
  {
    name: "resourcesPage",
    label: "Resources Page",
    description: "Curate a public resources page with categorized links, guides, and downloads.",
    category: "tools",
    migrations: MODULE_MIGRATIONS.resourcesPage,
    adminPath: "/admin/resources",
  },
  {
    name: "smallBusinessPage",
    label: "Small Business Page",
    description: "Dedicated landing page for small business recommendations stored in site settings.",
    category: "tools",
    migrations: MODULE_MIGRATIONS.smallBusinessPage,
    adminPath: "/admin/small-business",
  },

  // ─── Forms ────────────────────────────────────────────────────────────────
  {
    name: "forms",
    label: "Forms",
    description: "Create contact forms, surveys, and lead capture forms with submission management.",
    category: "forms",
    migrations: MODULE_MIGRATIONS.forms,
    dataExport: "./data/forms",
    adminPath: "/admin/forms",
  },
  {
    name: "ctaManager",
    label: "CTA Manager",
    description: "Design and place call-to-action blocks across pages with A/B testing support.",
    category: "forms",
    migrations: MODULE_MIGRATIONS.ctaManager,
    dataExport: "./data/cta-blocks",
    adminPath: "/admin/cta-manager",
  },

  // ─── System ───────────────────────────────────────────────────────────────
  {
    name: "errorLog",
    label: "Error Log",
    description: "Monitor and review application errors, broken pages, and failed API calls.",
    category: "system",
    migrations: MODULE_MIGRATIONS.errorLog,
    dataExport: "./data/errors",
    adminPath: "/admin/error-log",
  },
  {
    name: "activityLog",
    label: "Activity Log",
    description: "Track admin user actions including edits, publishes, and configuration changes.",
    category: "system",
    migrations: MODULE_MIGRATIONS.activityLog,
    dataExport: "./data/activity",
    adminPath: "/admin/activity-log",
  },
  {
    name: "bulkImport",
    label: "Bulk Import",
    description: "Import entities, content, and data in bulk from CSV or JSON files.",
    category: "system",
    migrations: MODULE_MIGRATIONS.bulkImport,
    adminPath: "/admin/bulk-import",
  },
];

/** Look up a single module by name */
export function getModuleInfo(name: CmsModuleName): ModuleInfo | undefined {
  return MODULE_REGISTRY.find((m) => m.name === name);
}

/** Get all modules in a given category */
export function getModulesByCategory(category: ModuleInfo["category"]): ModuleInfo[] {
  return MODULE_REGISTRY.filter((m) => m.category === category);
}
