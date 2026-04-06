import type Anthropic from "@anthropic-ai/sdk";
import { cmsConfig } from "@/lib/cms";

type Tool = Anthropic.Tool;

// ─── Content Pages ──────────────────────────────────────────────────────────

const contentPageTools: Tool[] = [
  {
    name: "list_content_pages",
    description:
      "List content pages with optional filters. Returns an array of pages with id, title, slug, status, page_type, and dates.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["draft", "published", "archived"],
          description: "Filter by status",
        },
        page_type: {
          type: "string",
          enum: ["article", "guide", "landing", "custom"],
          description: "Filter by page type",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 25)",
        },
      },
    },
  },
  {
    name: "get_content_page",
    description:
      "Get a single content page by ID or slug. Returns the full page object including body content.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Page UUID" },
        slug: { type: "string", description: "Page URL slug" },
      },
    },
  },
  {
    name: "create_content_page",
    description:
      "Create a new content page. Returns the created page. Defaults to draft status.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Page title" },
        slug: {
          type: "string",
          description:
            "URL slug (auto-generated from title if omitted)",
        },
        page_type: {
          type: "string",
          enum: ["article", "guide", "landing", "custom"],
          description: "Content type",
        },
        body: { type: "string", description: "HTML content body" },
        excerpt: { type: "string", description: "Short excerpt or summary" },
        status: {
          type: "string",
          enum: ["draft", "published"],
          description: "Page status (default: draft)",
        },
        seo_title: { type: "string", description: "SEO title override" },
        seo_description: {
          type: "string",
          description: "Meta description (max 160 chars)",
        },
      },
      required: ["title", "page_type"],
    },
  },
  {
    name: "update_content_page",
    description:
      "Update an existing content page by ID. Only include fields to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Page UUID to update" },
        title: { type: "string" },
        slug: { type: "string" },
        body: { type: "string" },
        excerpt: { type: "string" },
        status: { type: "string", enum: ["draft", "published", "archived"] },
        seo_title: { type: "string" },
        seo_description: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_content_page",
    description:
      "Delete a content page by ID. This is permanent and cannot be undone. Always confirm with the user before calling this.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Page UUID to delete" },
      },
      required: ["id"],
    },
  },
];

// ─── Directory Entities ─────────────────────────────────────────────────────

const directoryTools: Tool[] = [
  {
    name: "list_entities",
    description: `List directory ${cmsConfig.primaryEntity.plural} with optional filters. Returns id, name, slug, type, status.`,
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["published", "draft", "archived"],
        },
        type: { type: "string", description: "Entity type filter" },
        limit: { type: "number", description: "Max results (default 25)" },
        search: {
          type: "string",
          description: "Search by name (case-insensitive)",
        },
      },
    },
  },
  {
    name: "get_entity",
    description: `Get a single ${cmsConfig.primaryEntity.singular} by ID or slug.`,
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        slug: { type: "string" },
      },
    },
  },
  {
    name: "create_entity",
    description: `Create a new ${cmsConfig.primaryEntity.singular} in the directory.`,
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Entity display name" },
        slug: { type: "string", description: "URL slug" },
        type: { type: "string", description: "Entity type" },
        description: { type: "string" },
        website: { type: "string", description: "Website URL" },
        logo_url: { type: "string" },
        status: {
          type: "string",
          enum: ["draft", "published"],
          description: "Default: draft",
        },
      },
      required: ["name", "slug"],
    },
  },
  {
    name: "update_entity",
    description: `Update an existing ${cmsConfig.primaryEntity.singular} by ID.`,
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Entity UUID" },
        name: { type: "string" },
        description: { type: "string" },
        website: { type: "string" },
        logo_url: { type: "string" },
        status: { type: "string", enum: ["draft", "published", "archived"] },
      },
      required: ["id"],
    },
  },
];

// ─── Categories ─────────────────────────────────────────────────────────────

const categoryTools: Tool[] = [
  {
    name: "list_categories",
    description: "List all categories. Returns id, name, slug, layer, sort_order.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "create_category",
    description: "Create a new category.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        slug: { type: "string" },
        description: { type: "string" },
        layer: { type: "string", description: "Category layer/group" },
        parent_id: { type: "string", description: "Parent category UUID for nesting" },
      },
      required: ["name", "slug"],
    },
  },
];

// ─── Site Settings ──────────────────────────────────────────────────────────

const settingsTools: Tool[] = [
  {
    name: "get_site_setting",
    description:
      "Get a site setting by key. Settings are key-value pairs stored in the site_settings table.",
    input_schema: {
      type: "object" as const,
      properties: {
        key: {
          type: "string",
          description:
            "Setting key (e.g. 'site_tagline', 'analytics_providers', 'hero_config')",
        },
      },
      required: ["key"],
    },
  },
  {
    name: "update_site_setting",
    description:
      "Update a site setting. Creates the setting if it does not exist. Value is a JSON object.",
    input_schema: {
      type: "object" as const,
      properties: {
        key: { type: "string", description: "Setting key" },
        value: {
          type: "object",
          description: "Setting value as JSON object",
        },
      },
      required: ["key", "value"],
    },
  },
  {
    name: "list_site_settings",
    description: "List all site settings. Returns key, value, group_name for each.",
    input_schema: {
      type: "object" as const,
      properties: {
        group_name: {
          type: "string",
          description: "Optional: filter by group name",
        },
      },
    },
  },
];

// ─── Media ──────────────────────────────────────────────────────────────────

const mediaTools: Tool[] = [
  {
    name: "list_media",
    description:
      "List media library items. Returns filename, storage_path, mime_type, alt_text, created_at.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results (default 25)" },
      },
    },
  },
];

// ─── Redirects ──────────────────────────────────────────────────────────────

const redirectTools: Tool[] = [
  {
    name: "list_redirects",
    description: "List URL redirects. Returns from_path, to_path, status_code, is_active.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "create_redirect",
    description: "Create a URL redirect rule.",
    input_schema: {
      type: "object" as const,
      properties: {
        from_path: { type: "string", description: "Source URL path (e.g. /old-page)" },
        to_path: { type: "string", description: "Destination URL path (e.g. /new-page)" },
        status_code: {
          type: "number",
          enum: [301, 302],
          description: "HTTP status code (default 301)",
        },
        is_active: { type: "boolean", description: "Whether redirect is active (default true)" },
      },
      required: ["from_path", "to_path"],
    },
  },
];

// ─── Activity Log ───────────────────────────────────────────────────────────

const activityLogTools: Tool[] = [
  {
    name: "list_activity_log",
    description:
      "View recent admin activity. Returns action, entity_type, entity_title, user_id, created_at.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max results (default 20)" },
        action: {
          type: "string",
          enum: ["create", "update", "delete", "publish", "archive", "login"],
          description: "Filter by action type",
        },
      },
    },
  },
];

// ─── Reviews ────────────────────────────────────────────────────────────────

const reviewTools: Tool[] = [
  {
    name: "list_reviews",
    description: "List reviews with optional status filter.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["pending", "approved", "rejected", "flagged"],
        },
        limit: { type: "number", description: "Max results (default 25)" },
      },
    },
  },
  {
    name: "update_review_status",
    description: "Approve, reject, or flag a review.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Review UUID" },
        status: {
          type: "string",
          enum: ["approved", "rejected", "flagged"],
        },
      },
      required: ["id", "status"],
    },
  },
];

// ─── Build final tools array based on enabled modules ───────────────────────

export function getCmsTools(): Tool[] {
  const m = cmsConfig.modules;
  const tools: Tool[] = [...settingsTools]; // always available

  if (m.contentPages || m.landingPages) tools.push(...contentPageTools);
  if (m.directory) tools.push(...directoryTools);
  if (m.categories) tools.push(...categoryTools);
  if (m.mediaLibrary) tools.push(...mediaTools);
  if (m.redirects) tools.push(...redirectTools);
  if (m.activityLog) tools.push(...activityLogTools);
  if (m.reviews) tools.push(...reviewTools);

  return tools;
}
