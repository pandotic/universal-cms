/**
 * Help content shown by the floating "Tell Me About This Page" panel.
 *
 * Keys are exact pathname matches. Dynamic routes like `/properties/[slug]`
 * use the Next.js literal key (e.g. `/properties/[slug]`) — `matchHelp` below
 * converts a visited pathname into the corresponding key.
 *
 * To add help for a new page: append an entry here, no other files change.
 */

export type PageHelp = {
  title: string;
  purpose: string;
  howToUse: string[];
  builtWith: {
    tables?: string[];
    apiRoutes?: string[];
    dataFunctions?: string[];
    auth?: string;
    relatedPages?: string[];
    notes?: string;
  };
};

export const pageHelp: Record<string, PageHelp> = {
  "/": {
    title: "Pandotic Hub — Home",
    purpose:
      "Landing page for the Hub. Links out to the major operational surfaces (fleet, modules, skills, APIs, audit).",
    howToUse: [
      "Click any tile to jump into that area of the Hub.",
      "Use the top navbar (Operations, Content, Tools, Admin) for the full menu.",
    ],
    builtWith: {
      notes: "Static page — no data dependencies.",
      relatedPages: ["/fleet", "/properties", "/skills", "/apis"],
    },
  },

  "/fleet": {
    title: "Fleet Dashboard",
    purpose:
      "Cross-property mission control. Shows the status and module matrix for every site/app in the fleet.",
    howToUse: [
      "Review the status column to spot properties needing attention.",
      "Use 'Register Package' to add a new property into the fleet registry.",
      "Filter/sort to drill into a specific property or module.",
    ],
    builtWith: {
      tables: ["hub_properties"],
      apiRoutes: ["/api/fleet/status", "/api/fleet/dashboard", "/api/fleet/deploy", "/api/fleet/upgrade"],
      dataFunctions: ["listProperties (cms-core/data/hub-properties)"],
      auth: "Authenticated Hub user.",
      relatedPages: ["/fleet/status", "/fleet/deploy", "/properties", "/modules"],
      notes: "Status aggregator pings each property's /api/admin/health endpoint and falls back to fleet.config.ts.",
    },
  },

  "/fleet/status": {
    title: "Fleet Status",
    purpose:
      "Realtime health snapshot across every deployed site. Flags properties that are down, stale, or mis-configured.",
    howToUse: [
      "Refresh to re-poll every property.",
      "Click a property row to jump to its detail page.",
    ],
    builtWith: {
      apiRoutes: ["/api/fleet/status"],
      dataFunctions: ["listProperties"],
      auth: "Authenticated Hub user.",
      notes: "Aggregates live /api/admin/health responses from each property URL.",
    },
  },

  "/fleet/deploy": {
    title: "Fleet Deploy",
    purpose: "Trigger and monitor deploys across the fleet.",
    howToUse: [
      "Pick a property and a deploy target.",
      "Kick off a deploy — progress streams back into the run log.",
    ],
    builtWith: {
      apiRoutes: ["/api/fleet/deploy"],
      auth: "super_admin / group_admin.",
      relatedPages: ["/deployments"],
    },
  },

  "/fleet/onboard": {
    title: "Fleet Onboarding",
    purpose: "Guided flow for bringing a new property into the Hub.",
    howToUse: [
      "Fill in property metadata (slug, URL, Supabase project).",
      "Register — the property appears in /properties and /fleet.",
    ],
    builtWith: {
      tables: ["hub_properties"],
      apiRoutes: ["/api/properties"],
      dataFunctions: ["createProperty"],
      auth: "super_admin.",
    },
  },

  "/properties": {
    title: "Properties",
    purpose:
      "Registry of every site/app the Hub manages. One row per property, with its group, status, and deploy target.",
    howToUse: [
      "Click a row to open the property detail page.",
      "Use 'New Property' to register a site (super_admin only).",
    ],
    builtWith: {
      tables: ["hub_properties", "hub_groups"],
      apiRoutes: ["/api/properties (GET, POST)"],
      dataFunctions: [
        "listProperties (cms-core/data/hub-properties)",
        "createProperty (cms-core/data/hub-properties)",
      ],
      auth: "Authenticated read; platform admin for create.",
      relatedPages: ["/fleet", "/groups"],
    },
  },

  "/properties/[slug]": {
    title: "Property Detail",
    purpose: "Everything about a single property: metadata, group, agents, deploys, activity.",
    howToUse: [
      "Edit the property's metadata inline.",
      "Use the side tabs to view agents / activity for this property.",
      "Delete requires super_admin.",
    ],
    builtWith: {
      tables: ["hub_properties", "hub_agents", "hub_activity_log"],
      apiRoutes: ["/api/properties", "/api/agents?propertyId="],
      dataFunctions: ["getPropertyBySlug", "listAgents", "listActivity"],
      auth: "Authenticated; group membership enforced via RLS.",
      relatedPages: ["/properties/[slug]/agents"],
    },
  },

  "/properties/[slug]/agents": {
    title: "Property Agents",
    purpose: "Agents scoped to a single property — create, toggle, and inspect runs.",
    howToUse: [
      "Toggle an agent on/off via its switch.",
      "Click an agent row to view its run history.",
    ],
    builtWith: {
      tables: ["hub_agents", "hub_agent_runs"],
      apiRoutes: ["/api/agents", "/api/agents/[id]", "/api/agents/[id]/runs"],
      dataFunctions: ["listAgents", "listAgentRuns"],
      auth: "super_admin / group_admin for writes.",
    },
  },

  "/modules": {
    title: "Module Matrix",
    purpose:
      "Matrix view of which cms-core modules are installed and healthy on each property.",
    howToUse: [
      "Scan rows (properties) × columns (modules) for gaps.",
      "Click a cell for module-specific health info.",
    ],
    builtWith: {
      apiRoutes: ["/api/fleet/status"],
      auth: "Authenticated Hub user.",
      notes: "Sources data from each property's /api/admin/health, no direct DB reads.",
    },
  },

  "/apis": {
    title: "APIs & AI",
    purpose: "Central view of every external API the fleet consumes (Anthropic, OpenAI, Supabase, etc.).",
    howToUse: [
      "Use the tab bar (Overview, Keys, Services, Usage, Audit) to switch views.",
    ],
    builtWith: {
      notes: "Orchestrator page — sub-pages do the actual data work.",
      relatedPages: ["/apis/keys", "/apis/services", "/apis/usage", "/apis/audit"],
    },
  },

  "/apis/keys": {
    title: "API Keys",
    purpose: "Manage API keys/secrets for each external service, per property.",
    howToUse: [
      "Add or rotate a key.",
      "Keys are stored encrypted; only preview values are shown after save.",
    ],
    builtWith: {
      auth: "super_admin only.",
      relatedPages: ["/apis/services", "/apis/audit"],
    },
  },

  "/apis/services": {
    title: "API Services",
    purpose: "Catalog of external services the fleet integrates with.",
    howToUse: ["Review which services are in use and what they cost."],
    builtWith: { relatedPages: ["/apis/keys", "/apis/usage"] },
  },

  "/apis/usage": {
    title: "API Usage",
    purpose: "Consumption and cost metrics rolled up by service and property.",
    howToUse: ["Filter by date range or property to investigate spend spikes."],
    builtWith: { relatedPages: ["/apis/audit"] },
  },

  "/apis/audit": {
    title: "API Audit",
    purpose: "Audit trail of API key access, rotations, and usage events.",
    howToUse: ["Search by actor, service, or date to investigate access events."],
    builtWith: { tables: ["hub_activity_log"], auth: "super_admin." },
  },

  "/skills": {
    title: "Skills",
    purpose: "Library of reusable Claude skills available to the fleet.",
    howToUse: [
      "Browse or search the skill catalog.",
      "Click a skill to open its detail page.",
      "Use 'Upload' to add a new skill manifest, or 'Deploy' to ship one to a property.",
    ],
    builtWith: {
      tables: ["hub_skills"],
      apiRoutes: ["/api/skills (GET)", "/api/skills/sync (POST)", "/api/skills/upload", "/api/skills/deploy"],
      dataFunctions: ["listSkills (@pandotic/skill-library/data/hub-skills)"],
      auth: "requireHubRole (super_admin, group_admin, member, viewer).",
      relatedPages: ["/skills/matrix", "/skills/deploy", "/skills/upload", "/skill-store"],
    },
  },

  "/skills/[id]": {
    title: "Skill Detail",
    purpose: "Everything about a single skill: manifest, versions, deployments.",
    howToUse: ["Review the manifest.", "Open a deployment to see its delivery status."],
    builtWith: {
      tables: ["hub_skills", "hub_skill_deployments"],
      apiRoutes: ["/api/skills/[id]", "/api/skills/[id]/deployments"],
    },
  },

  "/skills/[id]/deployments/[depId]": {
    title: "Skill Deployment",
    purpose: "Detail view for a single skill deployment — target property, PR link, status.",
    howToUse: ["Follow the PR link to review the code change.", "Re-trigger if the deployment failed."],
    builtWith: {
      tables: ["hub_skill_deployments"],
      apiRoutes: ["/api/skills/[id]/deployments"],
    },
  },

  "/skills/matrix": {
    title: "Skills Matrix",
    purpose: "Which skills are deployed to which properties — grid view.",
    howToUse: ["Scan for gaps or outdated versions."],
    builtWith: { tables: ["hub_skills", "hub_skill_deployments"] },
  },

  "/skills/deploy": {
    title: "Deploy a Skill",
    purpose: "Wizard for shipping a skill to one or more properties.",
    howToUse: [
      "Pick a skill and target property/properties.",
      "Submit — creates a PR in the target repo.",
    ],
    builtWith: {
      apiRoutes: ["/api/skills/deploy"],
      dataFunctions: ["createSkillPR", "recordPRDeployment"],
      auth: "super_admin / group_admin.",
    },
  },

  "/skills/upload": {
    title: "Upload Skill",
    purpose: "Add a new skill manifest to the Hub library.",
    howToUse: ["Upload a manifest file or paste YAML.", "Review parsed fields and save."],
    builtWith: { apiRoutes: ["/api/skills/upload"], auth: "super_admin / group_admin." },
  },

  "/skill-store": {
    title: "Skill Store",
    purpose: "Discovery surface for official and community-contributed skills.",
    howToUse: ["Browse or search.", "Click 'Install' to copy a skill into your library."],
    builtWith: { relatedPages: ["/skills"] },
  },

  "/agents": {
    title: "Agents",
    purpose:
      "Automated background tasks (SEO audit, broken link checker, dependency updates) configured per property.",
    howToUse: [
      "Toggle an agent's enabled switch to pause/resume it.",
      "Click a row to open run history and config.",
      "Use 'New Agent' to add one (super_admin).",
    ],
    builtWith: {
      tables: ["hub_agents", "hub_agent_runs", "hub_activity_log"],
      apiRoutes: ["/api/agents (GET, POST)", "/api/agents/[id] (PUT)", "/api/agents/[id]/runs"],
      dataFunctions: ["listAgents, createAgent, updateAgent (cms-core/data/hub-agents)"],
      auth: "Authenticated read; platform admin for create.",
      relatedPages: ["/properties/[slug]/agents"],
    },
  },

  "/agents/[id]": {
    title: "Agent Detail",
    purpose: "Config and run history for a single agent.",
    howToUse: [
      "Edit the schedule or config JSON.",
      "Press 'Run Now' to trigger a manual run.",
      "Scroll the run log to inspect past executions.",
    ],
    builtWith: {
      tables: ["hub_agents", "hub_agent_runs"],
      apiRoutes: ["/api/agents/[id]", "/api/agents/[id]/runs"],
      dataFunctions: ["getAgentById", "listAgentRuns", "createAgentRun"],
    },
  },

  "/cms/projects": {
    title: "Projects / Case Studies",
    purpose: "Portfolio and case study records managed by the Hub CMS.",
    howToUse: [
      "Filter by property or status.",
      "Click a project to edit its sections.",
      "Use 'New Project' to add one.",
    ],
    builtWith: {
      tables: ["projects", "project_sections"],
      apiRoutes: ["/api/cms/projects"],
      auth: "super_admin / group_admin for writes.",
    },
  },

  "/cms/projects/[id]": {
    title: "Project Editor",
    purpose: "Edit a project's metadata and section blocks.",
    howToUse: ["Edit fields in-place.", "Add/remove sections from the side rail.", "Save to publish."],
    builtWith: { tables: ["projects", "project_sections"], apiRoutes: ["/api/cms/projects/[id]"] },
  },

  "/cms/content": {
    title: "Pages & Blog",
    purpose: "Static pages and blog posts managed through the Hub CMS.",
    howToUse: ["Filter by type or property.", "Click a row to edit."],
    builtWith: { apiRoutes: ["/api/cms/content"] },
  },

  "/cms/content/[id]": {
    title: "Content Editor",
    purpose: "Edit a single page or blog post.",
    howToUse: ["Edit body and metadata.", "Save to publish immediately (there is no draft workflow yet)."],
    builtWith: { apiRoutes: ["/api/cms/content/[id]"] },
  },

  "/social": {
    title: "Social — Overview",
    purpose: "Counts and recent activity for social content across the fleet.",
    howToUse: ["Select a property to scope the stats.", "Use the nav to jump into Content or Brand Voice."],
    builtWith: {
      tables: ["hub_social_content"],
      apiRoutes: ["/api/social/stats"],
      dataFunctions: ["getSocialContentStats (cms-core/data/hub-social)"],
      relatedPages: ["/social/content", "/social/brand-voice", "/social/generate"],
    },
  },

  "/social/content": {
    title: "Social Content",
    purpose: "Draft, review, and track social posts per property and platform.",
    howToUse: [
      "Filter by platform or status.",
      "Click a row to edit.",
      "Create a post via 'New Content'.",
    ],
    builtWith: {
      tables: ["hub_social_content"],
      apiRoutes: ["/api/social/content (GET, POST)"],
      dataFunctions: ["listSocialContent, createSocialContent, updateSocialContent"],
      auth: "super_admin / group_admin for writes.",
    },
  },

  "/social/brand-voice": {
    title: "Brand Voice Briefs",
    purpose: "Per-property brand voice guides that anchor social content generation.",
    howToUse: ["Pick a property to view or edit its brief."],
    builtWith: {
      tables: ["hub_brand_voice_briefs"],
      apiRoutes: ["/api/social/briefs"],
      dataFunctions: ["listBriefs, getBriefById"],
    },
  },

  "/social/brand-voice/[propertySlug]": {
    title: "Brand Voice Brief",
    purpose: "Edit a single property's brand voice brief (tone, audience, do's and don'ts).",
    howToUse: ["Fill in each section.", "Save to persist — the brief will be fed to content generation."],
    builtWith: {
      tables: ["hub_brand_voice_briefs"],
      apiRoutes: ["/api/social/briefs/[id]"],
      dataFunctions: ["createBrief, updateBrief"],
    },
  },

  "/social/generate": {
    title: "Generate Social Content",
    purpose: "AI-assisted drafting of social posts anchored in a property's brand voice brief.",
    howToUse: [
      "Pick a property, platform, and content type.",
      "Describe what you want — the brief is passed to Claude as context.",
      "Review and save the generated draft.",
    ],
    builtWith: {
      apiRoutes: ["/api/social/generate"],
      notes: "Calls Claude API with the property's BrandVoiceBrief injected into the system prompt.",
    },
  },

  "/tools/pmf-evaluator": {
    title: "PMF Evaluator",
    purpose: "Embedded micro-app for evaluating product-market fit signals.",
    howToUse: ["Interact with the tool directly — it runs in an iframe."],
    builtWith: {
      notes:
        "Standalone Next.js app deployed separately on Netlify. Communicates with the Hub via window.postMessage.",
    },
  },

  "/groups": {
    title: "Groups",
    purpose:
      "Groups cluster properties for access control. Users belong to groups; roles are scoped per group.",
    howToUse: [
      "Click a group to manage its properties and members.",
      "Create a group via 'New Group' (super_admin).",
    ],
    builtWith: {
      tables: ["hub_groups", "hub_group_properties", "hub_user_group_access"],
      apiRoutes: ["/api/groups (GET, POST)"],
      dataFunctions: ["listGroups, createGroup (cms-core/data/hub-groups)"],
      auth: "Authenticated read; super_admin for create.",
      relatedPages: ["/users", "/properties"],
    },
  },

  "/groups/[slug]": {
    title: "Group Detail",
    purpose: "Manage the properties and members attached to a single group.",
    howToUse: [
      "Add/remove properties via the properties panel.",
      "Invite or remove members, edit their role (super_admin / group_admin / member / viewer).",
    ],
    builtWith: {
      tables: ["hub_groups", "hub_group_properties", "hub_user_group_access"],
      apiRoutes: [
        "/api/groups/[id]",
        "/api/groups/[id]/properties",
        "/api/groups/[id]/members",
      ],
      dataFunctions: ["getGroupBySlug, addPropertyToGroup, setMemberRole"],
      auth: "super_admin or the group's group_admin.",
    },
  },

  "/users": {
    title: "Users",
    purpose: "All Hub users, their groups, and their roles.",
    howToUse: [
      "Edit a user's global role inline.",
      "Click into a user to manage per-group memberships.",
    ],
    builtWith: {
      tables: ["hub_users", "hub_user_group_access"],
      apiRoutes: ["/api/users (GET, PUT)"],
      dataFunctions: ["listHubUsers, updateHubUser (cms-core/data/hub-users)"],
      auth: "super_admin.",
      relatedPages: ["/groups"],
    },
  },

  "/audit-log": {
    title: "Audit Log",
    purpose: "Append-only record of meaningful events across the Hub — creates, edits, deploys, role changes.",
    howToUse: ["Filter by actor, entity type, or date.", "Entries are immutable."],
    builtWith: {
      tables: ["hub_activity_log"],
      dataFunctions: ["listActivity (cms-core/data/hub-activity)"],
      auth: "Authenticated read; only server-side writes via logHubActivity.",
    },
  },

  "/feature-flags": {
    title: "Feature Flags",
    purpose: "Toggle Hub features on or off per property or globally.",
    howToUse: ["Flip a flag to enable/disable a feature.", "Changes take effect on the next page load."],
    builtWith: { auth: "super_admin." },
  },

  "/deployments": {
    title: "Deployments",
    purpose: "Chronological log of every deploy (skills, modules, properties) across the fleet.",
    howToUse: ["Click a row to see the deploy's PR and status."],
    builtWith: { apiRoutes: ["/api/deployments"] },
  },

  "/analytics": {
    title: "Analytics",
    purpose: "Cross-fleet analytics — traffic, conversions, and health trends.",
    howToUse: ["Pick a time range.", "Drill into a property for site-specific metrics."],
    builtWith: { notes: "Aggregates from each property's analytics integration." },
  },

  "/setup": {
    title: "Setup",
    purpose: "Initial configuration checklist for a fresh Hub install.",
    howToUse: ["Work through each step — the Hub blocks features that depend on missing config."],
    builtWith: { apiRoutes: ["/api/setup", "/api/setup/check"] },
  },

  "/setup/missing-config": {
    title: "Missing Config",
    purpose: "Lists required environment variables or Supabase settings that are missing.",
    howToUse: ["Follow each remediation step.", "Re-run the check to clear the warning."],
    builtWith: { apiRoutes: ["/api/setup/check"] },
  },

  "/marketing-ops": {
    title: "Marketing Ops — Overview",
    purpose:
      "Virtual marketing department dashboard. Surfaces brand health, pending reviews, kill switches, and agent errors at a glance.",
    howToUse: [
      "Scan the alerts strip for brands needing attention.",
      "Click a brand card to drill into its detail page.",
      "Jump to sub-pages via the tab nav (Brands, Pipeline, Link Building, QA).",
    ],
    builtWith: {
      apiRoutes: ["/api/properties"],
      auth: "Authenticated Hub user.",
      relatedPages: [
        "/marketing-ops/brands",
        "/marketing-ops/pipeline",
        "/marketing-ops/link-building",
        "/marketing-ops/qa",
      ],
    },
  },

  "/marketing-ops/brands": {
    title: "Brands",
    purpose:
      "Tabular view of every brand with health, auto-pilot status, pending review count, and errors.",
    howToUse: [
      "Filter by business stage (active / all / parking lot) and relationship type.",
      "Click a row to open that brand's detail page.",
    ],
    builtWith: {
      tables: ["hub_properties"],
      apiRoutes: ["/api/properties"],
      auth: "Authenticated Hub user.",
      relatedPages: ["/marketing-ops/brands/[slug]"],
    },
  },

  "/marketing-ops/brands/[slug]": {
    title: "Brand Detail",
    purpose:
      "Comprehensive brand hub — toggle auto-pilot, manage setup tasks, review assets, and watch the pipeline for a single brand.",
    howToUse: [
      "Toggle auto-pilot or the kill switch via the top controls.",
      "Set relationship type and site profile.",
      "Work through setup tasks; mark them complete or request revisions.",
      "Review brand assets (descriptions, bios, NAP) and recent pipeline content.",
    ],
    builtWith: {
      tables: ["hub_properties", "hub_brand_assets", "hub_brand_setup_tasks", "hub_content_pipeline"],
      apiRoutes: [
        "/api/properties (GET, PUT)",
        "/api/brand-assets (GET)",
        "/api/brand-setup (GET, POST)",
        "/api/content-pipeline (GET)",
      ],
      auth: "Authenticated Hub user.",
      relatedPages: ["/marketing-ops/brands", "/properties/[slug]/agents"],
    },
  },

  "/marketing-ops/link-building": {
    title: "Link Building",
    purpose:
      "Track directory submission opportunities per brand, plus Featured.com outbound pitches and inbound submissions.",
    howToUse: [
      "Filter opportunities by priority tier.",
      "Add a new opportunity via the create form.",
      "Advance a submission through queued → submitted → live.",
    ],
    builtWith: {
      apiRoutes: [
        "/api/link-building/opportunities (GET, POST)",
        "/api/link-building/submissions (GET)",
        "/api/link-building/featured (GET)",
        "/api/properties (GET)",
      ],
      auth: "Authenticated Hub user.",
    },
  },

  "/marketing-ops/pipeline": {
    title: "Content Pipeline",
    purpose:
      "Cross-brand content pipeline view — every draft, QA item, and scheduled post in one list.",
    howToUse: [
      "Filter by status (needs review / drafted / approved / published).",
      "Filter by channel (social, blog, email, press, newsletter) or brand.",
      "Click a row to open the pipeline item for review.",
    ],
    builtWith: {
      tables: ["hub_content_pipeline"],
      apiRoutes: ["/api/content-pipeline", "/api/properties"],
      dataFunctions: ["listContentPipelineItems (cms-core/data/hub-content-pipeline)"],
      auth: "Authenticated Hub user.",
      relatedPages: ["/marketing-ops/pipeline/[id]"],
    },
  },

  "/marketing-ops/pipeline/[id]": {
    title: "Pipeline Item",
    purpose:
      "Editor and workflow for a single content item. Review QA output, edit, transition status, and request revisions.",
    howToUse: [
      "Edit title/body inline.",
      "Advance status: drafted → qa_review → needs_human_review → approved → scheduled → published.",
      "Request revisions with notes — they flow back to the agent.",
      "Read QA confidence score and suggested fixes.",
    ],
    builtWith: {
      tables: ["hub_content_pipeline", "hub_qa_reviews"],
      apiRoutes: [
        "/api/content-pipeline/[id] (GET, PUT)",
        "/api/qa-reviews (GET)",
      ],
      auth: "Authenticated Hub user.",
      relatedPages: ["/marketing-ops/pipeline"],
    },
  },

  "/marketing-ops/qa": {
    title: "QA & Auto-pilot",
    purpose:
      "Per-brand QA dashboard. Tune auto-pilot thresholds and review the human-feedback learning log.",
    howToUse: [
      "Pick a brand to view its QA metrics.",
      "Enable or disable auto-pilot per content type.",
      "Adjust confidence threshold (0.0–1.0) and daily limits.",
      "Scan the learning log for human agreements vs. overrides.",
    ],
    builtWith: {
      apiRoutes: [
        "/api/autopilot (GET, POST)",
        "/api/qa-learning (GET)",
        "/api/properties (GET)",
      ],
      auth: "Authenticated Hub user.",
    },
  },

  "/playbooks": {
    title: "Playbooks",
    purpose:
      "Catalog of guided operational playbooks (onboarding, upgrades, audits). Kick off a new run against a property.",
    howToUse: [
      "Review active runs in the 'In progress' strip.",
      "Browse templates by category.",
      "Enter a property ID and start a new run.",
    ],
    builtWith: {
      tables: ["hub_playbook_templates", "hub_playbook_runs"],
      apiRoutes: ["/api/playbooks (GET)", "/api/playbooks/runs (POST)"],
      dataFunctions: [
        "listPlaybookTemplates (cms-core/data/hub-playbooks)",
        "listPlaybookRuns (cms-core/data/hub-playbooks)",
      ],
      auth: "requireHubRole (super_admin, group_admin, member, viewer).",
      relatedPages: ["/playbooks/runs/[runId]"],
    },
  },

  "/playbooks/runs/[runId]": {
    title: "Playbook Run",
    purpose:
      "Step-by-step progress tracker for one playbook run. Shows the checklist and overall completion.",
    howToUse: [
      "Mark steps complete as you finish them.",
      "Read each step's description/icon to know whether it's a deploy, upgrade, agent run, or manual task.",
    ],
    builtWith: {
      tables: ["hub_playbook_runs", "hub_playbook_run_steps"],
      apiRoutes: [
        "/api/playbooks/runs/[runId] (GET)",
        "/api/playbooks/runs/[runId]/steps/[stepId] (PATCH)",
      ],
      auth: "requireHubRole.",
      relatedPages: ["/playbooks"],
    },
  },
};

/**
 * Convert a visited pathname into its registry key.
 * Replaces each segment with `[param]` when the key would otherwise miss,
 * preferring the most specific match available.
 */
export function matchHelp(pathname: string): PageHelp | null {
  if (pageHelp[pathname]) return pageHelp[pathname];

  const segments = pathname.split("/");
  const keys = Object.keys(pageHelp);

  const match = keys.find((key) => {
    const keySegments = key.split("/");
    if (keySegments.length !== segments.length) return false;
    return keySegments.every((ks, i) => ks === segments[i] || ks.startsWith("["));
  });

  return match ? pageHelp[match] : null;
}
