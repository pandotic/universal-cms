/**
 * Helper for the marketing-director skill.
 *
 * Single mode:
 *   --read <slug>   → prints JSON context for Claude to synthesize a weekly plan
 *
 * Reads credentials from env:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run via:
 *   pnpm --filter @pandotic/fleet-dashboard marketing-plan-helper --read speed
 *
 * The Marketing Director is read-only by design — this helper does not write
 * to any hub_* table. Claude generates the markdown plan inside the Claude
 * Code session.
 *
 * The playbook map below is kept in sync with
 * packages/cms-core/src/data/hub-marketing-playbooks.ts. It is inlined
 * intentionally so this tsx-invoked script stays CJS-friendly and avoids
 * cross-package subpath import issues.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type RelationshipType =
  | "gbi_personal"
  | "pandotic_studio"
  | "pandotic_studio_product"
  | "pandotic_client"
  | "standalone"
  | "local_service"
  | null;

type PlaybookType =
  | "pandotic_studio"
  | "pandotic_studio_product"
  | "gbi_personal"
  | "pandotic_client"
  | "local_service"
  | "standalone";

interface PlaybookConfig {
  type: PlaybookType;
  enabledDepartments: string[];
  contentTypes: string[];
  crossPromotion: boolean;
  brandIsolation: boolean;
  pressStrategy: "national" | "local" | "studio_attribution" | "skip";
  socialStrategy: "own_handles" | "shared_handles" | "skip";
  linkBuildingTiers: string[];
  featuredComEnabled: boolean;
  newsletterEnabled: boolean;
  podcastBookingEnabled: boolean;
}

const PLAYBOOKS: Record<PlaybookType, PlaybookConfig> = {
  pandotic_studio: {
    type: "pandotic_studio",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "relationships", "email", "research", "operations"],
    contentTypes: ["blog", "social", "press", "newsletter", "case_study"],
    crossPromotion: true,
    brandIsolation: false,
    pressStrategy: "national",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2", "tier_3"],
    featuredComEnabled: true,
    newsletterEnabled: true,
    podcastBookingEnabled: true,
  },
  pandotic_studio_product: {
    type: "pandotic_studio_product",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "relationships", "email", "operations"],
    contentTypes: ["blog", "social", "press", "newsletter", "landing_page"],
    crossPromotion: true,
    brandIsolation: false,
    pressStrategy: "studio_attribution",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2", "tier_3"],
    featuredComEnabled: true,
    newsletterEnabled: true,
    podcastBookingEnabled: true,
  },
  gbi_personal: {
    type: "gbi_personal",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "relationships", "email", "research", "operations"],
    contentTypes: ["blog", "social", "press", "newsletter", "featured_pitch", "guest_post"],
    crossPromotion: false,
    brandIsolation: true,
    pressStrategy: "national",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2", "tier_3"],
    featuredComEnabled: true,
    newsletterEnabled: true,
    podcastBookingEnabled: true,
  },
  pandotic_client: {
    type: "pandotic_client",
    enabledDepartments: ["marketing_director", "content_creative"],
    contentTypes: ["case_study", "press"],
    crossPromotion: false,
    brandIsolation: true,
    pressStrategy: "studio_attribution",
    socialStrategy: "skip",
    linkBuildingTiers: [],
    featuredComEnabled: false,
    newsletterEnabled: false,
    podcastBookingEnabled: false,
  },
  local_service: {
    type: "local_service",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "operations"],
    contentTypes: ["blog", "social", "press"],
    crossPromotion: false,
    brandIsolation: false,
    pressStrategy: "local",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2"],
    featuredComEnabled: false,
    newsletterEnabled: false,
    podcastBookingEnabled: false,
  },
  standalone: {
    type: "standalone",
    enabledDepartments: ["marketing_director", "content_creative", "distribution_growth", "relationships", "email", "operations"],
    contentTypes: ["blog", "social", "press", "newsletter", "featured_pitch"],
    crossPromotion: false,
    brandIsolation: true,
    pressStrategy: "national",
    socialStrategy: "own_handles",
    linkBuildingTiers: ["tier_1", "tier_2", "tier_3"],
    featuredComEnabled: true,
    newsletterEnabled: true,
    podcastBookingEnabled: true,
  },
};

function relationshipTypeToPlaybook(relationshipType: RelationshipType): PlaybookType {
  switch (relationshipType) {
    case "pandotic_studio": return "pandotic_studio";
    case "pandotic_studio_product": return "pandotic_studio_product";
    case "gbi_personal": return "gbi_personal";
    case "pandotic_client": return "pandotic_client";
    case "local_service": return "local_service";
    case "standalone":
    default: return "standalone";
  }
}

interface PropertyRow {
  id: string;
  name: string;
  slug: string;
  url: string;
  relationship_type: RelationshipType;
  site_profile: string | null;
  business_stage: string | null;
  business_category: string | null;
  kill_switch: boolean;
  auto_pilot_enabled: boolean;
  domains: string[] | null;
}

interface ReadContext {
  property: PropertyRow;
  playbook: PlaybookConfig;
  recent_content: {
    since: string;
    total: number;
    by_status: Record<string, number>;
    items: Array<Record<string, unknown>>;
  };
  needs_human_review: Array<Record<string, unknown>>;
  setup_gaps: Array<Record<string, unknown>>;
  recent_agent_errors: {
    since: string;
    total: number;
    items: Array<Record<string, unknown>>;
  };
  gate: {
    allowed: boolean;
    reason?: string;
  };
}

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function readCommand(slug: string): Promise<void> {
  const supabase = getSupabase();

  const { data: property, error: propErr } = await supabase
    .from("hub_properties")
    .select(
      "id, name, slug, url, relationship_type, site_profile, business_stage, business_category, kill_switch, auto_pilot_enabled, domains"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (propErr) throw propErr;
  if (!property) {
    console.error(JSON.stringify({ error: `Property with slug '${slug}' not found` }, null, 2));
    process.exit(1);
  }

  const prop = property as PropertyRow;
  const playbook = PLAYBOOKS[relationshipTypeToPlaybook(prop.relationship_type)];

  const now = Date.now();
  const since14d = new Date(now - FOURTEEN_DAYS_MS).toISOString();
  const since7d = new Date(now - SEVEN_DAYS_MS).toISOString();

  const contentColumns =
    "id, channel, platform, content_type, title, status, drafted_by_agent, qa_confidence, source_content_id, created_at";

  const [recentRes, reviewRes, gapsRes, errorsRes] = await Promise.all([
    supabase
      .from("hub_content_pipeline")
      .select(contentColumns)
      .eq("property_id", prop.id)
      .gte("created_at", since14d)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("hub_content_pipeline")
      .select("id, channel, platform, content_type, title, status, drafted_by_agent, qa_confidence, created_at")
      .eq("property_id", prop.id)
      .eq("status", "needs_human_review")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("hub_brand_setup_checklist")
      .select("id, category, task_name, platform, tier, status, execution_mode")
      .eq("property_id", prop.id)
      .in("status", ["pending", "in_progress", "blocked"])
      .order("category")
      .order("tier")
      .order("task_name")
      .limit(200),
    supabase
      .from("hub_agent_runs")
      .select("id, agent_id, status, error_message, triggered_by, started_at, created_at")
      .eq("property_id", prop.id)
      .eq("status", "failed")
      .gte("created_at", since7d)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (recentRes.error) throw recentRes.error;
  if (reviewRes.error) throw reviewRes.error;
  if (gapsRes.error) throw gapsRes.error;
  if (errorsRes.error) throw errorsRes.error;

  const recentItems = (recentRes.data ?? []) as Array<Record<string, unknown>>;
  const byStatus: Record<string, number> = {};
  for (const row of recentItems) {
    const key = String(row.status);
    byStatus[key] = (byStatus[key] ?? 0) + 1;
  }

  const gate: ReadContext["gate"] = prop.kill_switch
    ? { allowed: false, reason: "Kill switch is active" }
    : prop.business_stage !== "active"
      ? { allowed: false, reason: `Property stage is '${prop.business_stage}', not 'active'` }
      : { allowed: true };

  const ctx: ReadContext = {
    property: prop,
    playbook,
    recent_content: {
      since: since14d,
      total: recentItems.length,
      by_status: byStatus,
      items: recentItems,
    },
    needs_human_review: (reviewRes.data ?? []) as Array<Record<string, unknown>>,
    setup_gaps: (gapsRes.data ?? []) as Array<Record<string, unknown>>,
    recent_agent_errors: {
      since: since7d,
      total: (errorsRes.data ?? []).length,
      items: (errorsRes.data ?? []) as Array<Record<string, unknown>>,
    },
    gate,
  };

  console.log(JSON.stringify(ctx, null, 2));
}

function parseArgs(argv: string[]): { slug: string } {
  const args = argv.slice(2);
  let slug: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--read") slug = args[++i] ?? null;
  }

  if (!slug) {
    console.error("Usage: marketing-plan-helper --read <slug>");
    process.exit(2);
  }

  return { slug };
}

async function main() {
  const { slug } = parseArgs(process.argv);
  await readCommand(slug);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
