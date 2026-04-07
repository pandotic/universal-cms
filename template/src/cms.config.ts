import { modulesFromPreset, modulePresets, type CmsConfig } from "@pandotic/universal-cms/config";

/**
 * CMS Configuration
 *
 * Customize this file for your site. Enable/disable modules,
 * set your site name, and configure navigation.
 */
export const cmsConfig: CmsConfig = {
  siteName: "My CMS Site",
  siteUrl: "https://example.com",
  siteDescription: "A site built with Universal CMS",
  siteTagline: "Your tagline here",

  primaryEntity: {
    name: "entities",
    singular: "Entity",
    plural: "Entities",
    slugPrefix: "/directory",
  },

  // Start with the "full" preset, then disable what you don't need.
  // Other presets: modulePresets.appMarketing, modulePresets.blog, modulePresets.directory
  modules: modulesFromPreset(modulePresets.full),

  // Roles available in your CMS
  roles: ["admin", "editor"],

  // Admin sidebar navigation
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
          label: "Media Library",
          href: "/admin/media",
          icon: "Image",
          module: "mediaLibrary",
        },
      ],
    },
    {
      group: "Directory",
      items: [
        {
          label: "Entities",
          href: "/admin/directory",
          icon: "Building2",
          module: "directory",
        },
        {
          label: "Categories",
          href: "/admin/categories",
          icon: "FolderTree",
          module: "categories",
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
          icon: "Award",
          module: "affiliates",
        },
        {
          label: "Forms",
          href: "/admin/forms",
          icon: "List",
          module: "forms",
        },
      ],
    },
    {
      group: "System",
      items: [
        {
          label: "Settings",
          href: "/admin/settings",
          icon: "Settings",
        },
        {
          label: "Activity Log",
          href: "/admin/activity",
          icon: "History",
          module: "activityLog",
        },
        {
          label: "Error Log",
          href: "/admin/errors",
          icon: "Bug",
          module: "errorLog",
        },
      ],
    },
  ],

  analytics: {
    availableProviders: ["ga4", "gtm", "posthog", "custom"],
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
