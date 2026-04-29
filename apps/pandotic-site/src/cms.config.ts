import type { CmsConfig, CmsModuleName, CmsNavGroup } from "@pandotic/universal-cms/config";
import {
  ADMIN_LAYERS,
  ADMIN_MODULES,
  type AdminLayerKey,
} from "@pandotic/universal-cms/admin/modules";

// ─── Active modules ─────────────────────────────────────────────────────────
// Every module the universal CMS ships appears in the sidebar. Modules that
// are `true` here are wired to real data; everything else stays visible but
// greyed-out, linking to a sample preview at /admin/modules/{id}. As we
// activate more modules on pandotic.ai (or as ESGsource/HomeDoc improvements
// land back in cms-core), flip the flag here to switch a module from
// preview to live.

const ACTIVE_MODULES: Partial<Record<CmsModuleName, boolean>> = {
  contentPages: true,
};

const ALL_MODULES: CmsModuleName[] = [
  "contentPages", "landingPages", "mediaLibrary", "listicles", "brandGuide",
  "videos",
  "directory", "categories", "frameworks", "glossary", "certifications",
  "careerHub", "reviews", "affiliates", "clickAnalytics", "merchants",
  "ratings", "forms", "ctaManager", "seo", "redirects", "linkChecker",
  "internalLinks", "imagesSeo", "compareTools", "assessmentTool",
  "resourcesPage", "smallBusinessPage",
  "businessEntities", "linkedinAuth", "vendorProfiles",
  "errorLog", "activityLog", "bulkImport", "apiUsage",
];

const modules = Object.fromEntries(
  ALL_MODULES.map((m) => [m, ACTIVE_MODULES[m] ?? false]),
) as Record<CmsModuleName, boolean>;

// ─── Sidebar nav ────────────────────────────────────────────────────────────
// Top section is pandotic-site-specific (Overview, Projects). The remaining
// groups are derived from the cms-core admin module registry so that any
// new module added to the registry shows up here automatically — exactly
// the visibility loop the master CMS needs.

const LAYER_LABEL: Record<AdminLayerKey, string> = {
  "marketing-cms": "Marketing CMS",
  "app-admin": "App Admin",
  "group-admin": "Group Admin",
};

// Modules whose live admin page lives outside `/admin/modules/{id}`. Add an
// entry when a module gets a real panel.
const ACTIVE_HREFS: Partial<Record<string, string>> = {
  contentPages: "/admin/content",
};

// Per-module icon (string keys from AdminSidebar's iconMap). Falls back to
// LayoutDashboard when not specified.
const MODULE_ICON: Partial<Record<string, string>> = {
  contentPages: "FileText",
  landingPages: "FileText",
  mediaLibrary: "Image",
  listicles: "List",
  brandGuide: "BookOpen",
  seo: "Search",
  redirects: "ArrowRight",
  linkChecker: "Link",
  internalLinks: "LinkIcon2",
  imagesSeo: "Image",
  ctaManager: "MessageSquare",
  forms: "List",
  directory: "Building2",
  categories: "FolderTree",
  frameworks: "Code2",
  glossary: "BookA",
  certifications: "Award",
  careerHub: "GraduationCap",
  reviews: "MessageSquare",
  affiliates: "Award",
  clickAnalytics: "BarChart3",
  merchants: "Building2",
  ratings: "Award",
  compareTools: "Scale",
  assessmentTool: "List",
  resourcesPage: "BookOpen",
  smallBusinessPage: "Building2",
  bulkImport: "Upload",
  apiUsage: "BarChart3",
};

// CmsNavItem.module is typed as CmsModuleName. Group-admin modules in the
// registry (users, roles, featureFlags) are not part of CmsModuleName, so
// we only emit nav entries for layers whose modules all map cleanly.
const CMS_MODULE_NAMES = new Set<string>(ALL_MODULES);

const moduleGroups: CmsNavGroup[] = ADMIN_LAYERS
  .filter((layer) => layer.key !== "group-admin")
  .map((layer) => ({
    group: LAYER_LABEL[layer.key],
    items: ADMIN_MODULES
      .filter((m) => m.layer === layer.key)
      .map((m) => ({
        label: m.label,
        href: ACTIVE_HREFS[m.id] ?? `/admin/modules/${m.id}`,
        icon: MODULE_ICON[m.id] ?? "LayoutDashboard",
        ...(CMS_MODULE_NAMES.has(m.id)
          ? { module: m.id as CmsModuleName }
          : {}),
      })),
  }));

const adminNav: CmsNavGroup[] = [
  {
    group: "Site",
    items: [
      { label: "Overview", href: "/admin", icon: "LayoutDashboard" },
      { label: "Projects", href: "/admin/projects", icon: "Briefcase" },
    ],
  },
  ...moduleGroups,
];

// ─── Config ─────────────────────────────────────────────────────────────────

export const cmsConfig: CmsConfig = {
  siteName: "Pandotic",
  siteUrl: "https://pandotic.ai",
  siteDescription:
    "Pandotic AI builds intelligent, supervised, agent-based AI systems.",
  siteTagline: "Engineered intelligence",

  primaryEntity: {
    name: "projects",
    singular: "Project",
    plural: "Projects",
    slugPrefix: "/projects",
  },

  modules,
  roles: ["admin", "editor"],

  inactiveModulesMode: "preview",
  inactiveModulePreviewBase: "/admin/modules",

  adminNav,

  analytics: {
    availableProviders: ["ga4", "posthog"],
  },

  storage: {
    mediaBucket: "media",
    maxFileSizeMb: 10,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
    ],
  },
};

export const HUB_PROPERTY_MODULES_URL =
  "https://pandhub.netlify.app/properties/pandotic-site/modules";
