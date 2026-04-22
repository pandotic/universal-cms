/**
 * Helper for the marketing-long-form-writer skill.
 *
 * Two modes:
 *   --read <slug>                         → prints JSON context for Claude to draft a blog post
 *   --write <slug> --payload <file.json>  → inserts hub_content_pipeline row (qa_review) + pending QA review
 *
 * Reads credentials from env:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run via:
 *   pnpm --filter @pandotic/fleet-dashboard long-form-writer-helper --read speed
 *   pnpm --filter @pandotic/fleet-dashboard long-form-writer-helper --write speed --payload /tmp/post.json
 *
 * Types inlined intentionally — tsx+CJS can't resolve `@pandotic/universal-cms/data/*`
 * subpaths. The playbook map mirrors packages/cms-core/src/data/hub-marketing-playbooks.ts
 * and marketing-plan-helper.ts; keep them in sync when the canonical shape changes.
 */

import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const WRITER_AGENT = "marketing-long-form-writer";
const REVIEWER_AGENT = "marketing-skeptical-reviewer";
const PIPELINE_TABLE = "hub_content_pipeline";
const QA_TABLE = "hub_content_qa_reviews";
const PROPERTY_TABLE = "hub_properties";
const VOICE_TABLE = "hub_brand_voice_briefs";
const ASSETS_TABLE = "hub_brand_assets";

// ─── Inlined playbook map (mirrors hub-marketing-playbooks.ts) ──────────

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
  contentTypes: string[];
  crossPromotion: boolean;
  brandIsolation: boolean;
  pressStrategy: "national" | "local" | "studio_attribution" | "skip";
  socialStrategy: "own_handles" | "shared_handles" | "skip";
  newsletterEnabled: boolean;
}

const PLAYBOOKS: Record<PlaybookType, PlaybookConfig> = {
  pandotic_studio: {
    type: "pandotic_studio",
    contentTypes: ["blog", "social", "press", "newsletter", "case_study"],
    crossPromotion: true,
    brandIsolation: false,
    pressStrategy: "national",
    socialStrategy: "own_handles",
    newsletterEnabled: true,
  },
  pandotic_studio_product: {
    type: "pandotic_studio_product",
    contentTypes: ["blog", "social", "press", "newsletter", "landing_page"],
    crossPromotion: true,
    brandIsolation: false,
    pressStrategy: "studio_attribution",
    socialStrategy: "own_handles",
    newsletterEnabled: true,
  },
  gbi_personal: {
    type: "gbi_personal",
    contentTypes: ["blog", "social", "press", "newsletter", "featured_pitch", "guest_post"],
    crossPromotion: false,
    brandIsolation: true,
    pressStrategy: "national",
    socialStrategy: "own_handles",
    newsletterEnabled: true,
  },
  pandotic_client: {
    type: "pandotic_client",
    contentTypes: ["case_study", "press"],
    crossPromotion: false,
    brandIsolation: true,
    pressStrategy: "studio_attribution",
    socialStrategy: "skip",
    newsletterEnabled: false,
  },
  local_service: {
    type: "local_service",
    contentTypes: ["blog", "social", "press"],
    crossPromotion: false,
    brandIsolation: false,
    pressStrategy: "local",
    socialStrategy: "own_handles",
    newsletterEnabled: false,
  },
  standalone: {
    type: "standalone",
    contentTypes: ["blog", "social", "press", "newsletter", "featured_pitch"],
    crossPromotion: false,
    brandIsolation: true,
    pressStrategy: "national",
    socialStrategy: "own_handles",
    newsletterEnabled: true,
  },
};

function relationshipTypeToPlaybook(rt: RelationshipType): PlaybookType {
  switch (rt) {
    case "pandotic_studio": return "pandotic_studio";
    case "pandotic_studio_product": return "pandotic_studio_product";
    case "gbi_personal": return "gbi_personal";
    case "pandotic_client": return "pandotic_client";
    case "local_service": return "local_service";
    case "standalone":
    default: return "standalone";
  }
}

// ─── Types ──────────────────────────────────────────────────────────────

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
  domains: string[] | null;
}

interface ReadContext {
  property: PropertyRow;
  brand_voice: Record<string, unknown> | null;
  brand_assets: Record<string, unknown> | null;
  playbook: PlaybookConfig;
  gate: { allowed: boolean; reason?: string };
}

interface WritePayload {
  title: string;
  excerpt: string;
  body: string;
  metadata?: {
    brief?: string;
    target_keyword?: string;
    secondary_keywords?: string[];
    estimated_read_time_min?: number;
    [k: string]: unknown;
  };
}

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function readCommand(slug: string): Promise<void> {
  const supabase = getSupabase();

  const { data: property, error: propErr } = await supabase
    .from(PROPERTY_TABLE)
    .select(
      "id, name, slug, url, relationship_type, site_profile, business_stage, business_category, kill_switch, domains"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (propErr) throw propErr;
  if (!property) {
    console.error(JSON.stringify({ error: `Property with slug '${slug}' not found` }, null, 2));
    process.exit(1);
  }

  const [voiceRes, assetsRes] = await Promise.all([
    supabase
      .from(VOICE_TABLE)
      .select("*")
      .eq("property_id", property.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from(ASSETS_TABLE)
      .select("*")
      .eq("property_id", property.id)
      .maybeSingle(),
  ]);

  if (voiceRes.error) throw voiceRes.error;
  if (assetsRes.error) throw assetsRes.error;

  const prop = property as PropertyRow;
  const playbook = PLAYBOOKS[relationshipTypeToPlaybook(prop.relationship_type)];

  const gate: ReadContext["gate"] = prop.kill_switch
    ? { allowed: false, reason: "Kill switch is active" }
    : prop.business_stage !== "active"
      ? { allowed: false, reason: `Property stage is '${prop.business_stage}', not 'active'` }
      : !playbook.contentTypes.includes("blog")
        ? { allowed: false, reason: `Playbook '${playbook.type}' does not enable the blog channel` }
        : voiceRes.data == null
          ? { allowed: false, reason: "No brand voice brief exists for this property — quality floor blocks drafting" }
          : { allowed: true };

  const ctx: ReadContext = {
    property: prop,
    brand_voice: (voiceRes.data as Record<string, unknown> | null) ?? null,
    brand_assets: (assetsRes.data as Record<string, unknown> | null) ?? null,
    playbook,
    gate,
  };

  console.log(JSON.stringify(ctx, null, 2));
}

function validatePayload(raw: unknown): WritePayload {
  if (!raw || typeof raw !== "object") throw new Error("payload must be a JSON object");
  const p = raw as Record<string, unknown>;

  if (typeof p.title !== "string" || p.title.trim().length === 0) {
    throw new Error("title must be a non-empty string");
  }
  if (typeof p.excerpt !== "string" || p.excerpt.trim().length === 0) {
    throw new Error("excerpt must be a non-empty string");
  }
  if (typeof p.body !== "string" || p.body.trim().length === 0) {
    throw new Error("body must be a non-empty string");
  }
  if (p.metadata !== undefined && (typeof p.metadata !== "object" || Array.isArray(p.metadata))) {
    throw new Error("metadata, if present, must be an object");
  }

  return {
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    metadata: (p.metadata as WritePayload["metadata"]) ?? undefined,
  };
}

async function writeCommand(slug: string, payloadFile: string): Promise<void> {
  const supabase = getSupabase();

  const { data: property, error: propErr } = await supabase
    .from(PROPERTY_TABLE)
    .select("id, relationship_type, kill_switch, business_stage")
    .eq("slug", slug)
    .maybeSingle();

  if (propErr) throw propErr;
  if (!property) throw new Error(`Property with slug '${slug}' not found`);
  if (property.kill_switch) throw new Error("Kill switch is active; aborting");
  if (property.business_stage !== "active") {
    throw new Error(`Property stage is '${property.business_stage}', not 'active'; aborting`);
  }

  const playbook = PLAYBOOKS[relationshipTypeToPlaybook(property.relationship_type as RelationshipType)];
  if (!playbook.contentTypes.includes("blog")) {
    throw new Error(`Playbook '${playbook.type}' does not enable the blog channel; aborting`);
  }

  // Refuse writes when no voice brief exists — same quality floor as --read gate.
  const { data: brief, error: briefErr } = await supabase
    .from(VOICE_TABLE)
    .select("id")
    .eq("property_id", property.id)
    .limit(1)
    .maybeSingle();
  if (briefErr) throw briefErr;
  if (!brief) {
    throw new Error(
      "No brand voice brief exists for this property; refusing to submit a draft without voice calibration."
    );
  }

  const raw = readFileSync(payloadFile, "utf8");
  const payload = validatePayload(JSON.parse(raw));

  // Step 1: insert pipeline row in qa_review state.
  const { data: pipelineItem, error: insertErr } = await supabase
    .from(PIPELINE_TABLE)
    .insert({
      property_id: property.id,
      brief_id: null,
      channel: "blog",
      platform: null,
      content_type: "blog",
      title: payload.title,
      body: payload.body,
      excerpt: payload.excerpt,
      media_urls: [],
      hashtags: [],
      status: "qa_review",
      drafted_by_agent: WRITER_AGENT,
      qa_confidence: null,
      source_content_id: null,
      metadata: payload.metadata ?? {},
      created_by: WRITER_AGENT,
    })
    .select("id")
    .single();

  if (insertErr) throw insertErr;

  // Step 2: insert pending QA review row pointing at the Skeptical Reviewer.
  const { data: review, error: reviewErr } = await supabase
    .from(QA_TABLE)
    .insert({
      content_id: pipelineItem.id,
      content_table: PIPELINE_TABLE,
      reviewer_agent: REVIEWER_AGENT,
      overall_confidence: null,
      status: null,
      checks: null,
      suggested_fixes: [],
      human_override: false,
      override_reason: null,
    })
    .select("id")
    .single();

  if (reviewErr) throw reviewErr;

  console.log(
    JSON.stringify(
      {
        ok: true,
        pipeline_id: pipelineItem.id,
        qa_review_id: review.id,
        property_id: property.id,
        next_action: `Run \`/skeptical-review ${pipelineItem.id}\` next.`,
      },
      null,
      2
    )
  );
}

function parseArgs(
  argv: string[]
): { mode: "read" | "write"; slug: string; payload?: string } {
  const args = argv.slice(2);
  let mode: "read" | "write" | null = null;
  let slug: string | null = null;
  let payload: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--read") { mode = "read"; slug = args[++i]; }
    else if (a === "--write") { mode = "write"; slug = args[++i]; }
    else if (a === "--payload") { payload = args[++i]; }
  }

  if (!mode || !slug) {
    console.error("Usage: long-form-writer-helper --read <slug> | --write <slug> --payload <file.json>");
    process.exit(2);
  }
  if (mode === "write" && !payload) {
    console.error("--write requires --payload <file.json>");
    process.exit(2);
  }

  return { mode, slug, payload };
}

async function main() {
  const { mode, slug, payload } = parseArgs(process.argv);
  if (mode === "read") await readCommand(slug);
  else await writeCommand(slug, payload!);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
