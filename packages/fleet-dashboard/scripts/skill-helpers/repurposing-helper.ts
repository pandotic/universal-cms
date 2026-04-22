/**
 * Helper for the marketing-repurposing-specialist skill.
 *
 * Two modes:
 *   --read <source-pipeline-id>                    → prints JSON context for Claude to atomize
 *   --write <source-pipeline-id> --payload <file>  → fans out children into hub_content_pipeline
 *                                                    with pending QA reviews
 *
 * Reads credentials from env:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run via:
 *   pnpm --filter @pandotic/fleet-dashboard repurposing-helper --read <uuid>
 *   pnpm --filter @pandotic/fleet-dashboard repurposing-helper --write <uuid> --payload /tmp/repurpose.json
 *
 * Types + playbook map inlined (tsx+CJS constraint, mirrors long-form-writer-helper).
 */

import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const REPURPOSER_AGENT = "marketing-repurposing-specialist";
const REVIEWER_AGENT = "marketing-skeptical-reviewer";
const PIPELINE_TABLE = "hub_content_pipeline";
const QA_TABLE = "hub_content_qa_reviews";
const PROPERTY_TABLE = "hub_properties";
const VOICE_TABLE = "hub_brand_voice_briefs";
const ASSETS_TABLE = "hub_brand_assets";

// ─── Inlined playbook map ───────────────────────────────────────────────

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

interface SourcePipelineRow {
  id: string;
  property_id: string;
  channel: string;
  platform: string | null;
  content_type: string | null;
  title: string | null;
  body: string;
  excerpt: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface PropertyRow {
  id: string;
  name: string;
  slug: string;
  relationship_type: RelationshipType;
  site_profile: string | null;
  business_stage: string | null;
  kill_switch: boolean;
  domains: string[] | null;
}

interface ReadGate {
  allowed: boolean;
  reason?: string;
  produce_social?: boolean;
  produce_newsletter?: boolean;
}

interface ReadContext {
  source_item: SourcePipelineRow;
  property: PropertyRow;
  brand_voice: Record<string, unknown> | null;
  brand_assets: Record<string, unknown> | null;
  playbook: PlaybookConfig;
  gate: ReadGate;
}

interface SocialPostEntry {
  platform: "linkedin" | "twitter" | "instagram" | "facebook";
  title?: string | null;
  body: string;
  hashtags?: string[];
}

interface QuoteCardEntry {
  platform: "linkedin" | "twitter" | "instagram";
  body: string;
}

interface NewsletterEntry {
  title: string;
  excerpt: string;
  body: string;
}

interface WritePayload {
  social_posts?: SocialPostEntry[];
  newsletter_excerpt?: NewsletterEntry;
  quote_cards?: QuoteCardEntry[];
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

async function readCommand(id: string): Promise<void> {
  const supabase = getSupabase();

  const { data: source, error: sourceErr } = await supabase
    .from(PIPELINE_TABLE)
    .select(
      "id, property_id, channel, platform, content_type, title, body, excerpt, status, metadata, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (sourceErr) throw sourceErr;
  if (!source) {
    console.error(JSON.stringify({ error: `Source pipeline item '${id}' not found` }, null, 2));
    process.exit(1);
  }

  const { data: property, error: propErr } = await supabase
    .from(PROPERTY_TABLE)
    .select(
      "id, name, slug, relationship_type, site_profile, business_stage, kill_switch, domains"
    )
    .eq("id", source.property_id)
    .maybeSingle();

  if (propErr) throw propErr;
  if (!property) {
    console.error(JSON.stringify({ error: `Property for source item not found` }, null, 2));
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
  const src = source as SourcePipelineRow;
  const playbook = PLAYBOOKS[relationshipTypeToPlaybook(prop.relationship_type)];

  let gate: ReadGate;
  if (prop.kill_switch) {
    gate = { allowed: false, reason: "Kill switch is active" };
  } else if (prop.business_stage !== "active") {
    gate = { allowed: false, reason: `Property stage is '${prop.business_stage}', not 'active'` };
  } else if (src.channel !== "blog") {
    gate = {
      allowed: false,
      reason: `Source channel is '${src.channel}', not 'blog' — only blog posts are atomized in this slice`,
    };
  } else if (src.status !== "approved") {
    gate = {
      allowed: false,
      reason: `Source status is '${src.status}', not 'approved' — run Skeptical Reviewer and approve first`,
    };
  } else {
    const produceSocial = playbook.socialStrategy !== "skip";
    const produceNewsletter = playbook.newsletterEnabled;
    if (!produceSocial && !produceNewsletter) {
      gate = {
        allowed: false,
        reason: `Playbook '${playbook.type}' disables both socialStrategy and newsletter — nothing to repurpose`,
      };
    } else {
      gate = {
        allowed: true,
        produce_social: produceSocial,
        produce_newsletter: produceNewsletter,
      };
    }
  }

  const ctx: ReadContext = {
    source_item: src,
    property: prop,
    brand_voice: (voiceRes.data as Record<string, unknown> | null) ?? null,
    brand_assets: (assetsRes.data as Record<string, unknown> | null) ?? null,
    playbook,
    gate,
  };

  console.log(JSON.stringify(ctx, null, 2));
}

function validatePayload(raw: unknown, gate: { produceSocial: boolean; produceNewsletter: boolean }): WritePayload {
  if (!raw || typeof raw !== "object") throw new Error("payload must be a JSON object");
  const p = raw as Record<string, unknown>;

  const out: WritePayload = {};

  if (p.social_posts !== undefined) {
    if (!gate.produceSocial) {
      throw new Error("social_posts present but playbook socialStrategy is 'skip'");
    }
    if (!Array.isArray(p.social_posts)) throw new Error("social_posts must be an array");
    const validPlatforms = new Set(["linkedin", "twitter", "instagram", "facebook"]);
    for (const [i, entry] of (p.social_posts as unknown[]).entries()) {
      if (!entry || typeof entry !== "object") throw new Error(`social_posts[${i}] must be an object`);
      const e = entry as Record<string, unknown>;
      if (!validPlatforms.has(String(e.platform))) {
        throw new Error(`social_posts[${i}].platform must be one of: linkedin, twitter, instagram, facebook`);
      }
      if (typeof e.body !== "string" || e.body.trim().length === 0) {
        throw new Error(`social_posts[${i}].body must be a non-empty string`);
      }
      if (e.hashtags !== undefined && (!Array.isArray(e.hashtags) || !e.hashtags.every((h) => typeof h === "string"))) {
        throw new Error(`social_posts[${i}].hashtags must be an array of strings`);
      }
    }
    out.social_posts = p.social_posts as SocialPostEntry[];
  }

  if (p.quote_cards !== undefined) {
    if (!gate.produceSocial) {
      throw new Error("quote_cards present but playbook socialStrategy is 'skip'");
    }
    if (!Array.isArray(p.quote_cards)) throw new Error("quote_cards must be an array");
    const validPlatforms = new Set(["linkedin", "twitter", "instagram"]);
    for (const [i, entry] of (p.quote_cards as unknown[]).entries()) {
      if (!entry || typeof entry !== "object") throw new Error(`quote_cards[${i}] must be an object`);
      const e = entry as Record<string, unknown>;
      if (!validPlatforms.has(String(e.platform))) {
        throw new Error(`quote_cards[${i}].platform must be one of: linkedin, twitter, instagram`);
      }
      if (typeof e.body !== "string" || e.body.trim().length === 0) {
        throw new Error(`quote_cards[${i}].body must be a non-empty string`);
      }
    }
    out.quote_cards = p.quote_cards as QuoteCardEntry[];
  }

  if (p.newsletter_excerpt !== undefined) {
    if (!gate.produceNewsletter) {
      throw new Error("newsletter_excerpt present but playbook newsletterEnabled is false");
    }
    const n = p.newsletter_excerpt;
    if (!n || typeof n !== "object" || Array.isArray(n)) {
      throw new Error("newsletter_excerpt must be an object");
    }
    const nm = n as Record<string, unknown>;
    if (typeof nm.title !== "string" || nm.title.trim().length === 0) {
      throw new Error("newsletter_excerpt.title must be a non-empty string");
    }
    if (typeof nm.excerpt !== "string" || nm.excerpt.trim().length === 0) {
      throw new Error("newsletter_excerpt.excerpt must be a non-empty string");
    }
    if (typeof nm.body !== "string" || nm.body.trim().length === 0) {
      throw new Error("newsletter_excerpt.body must be a non-empty string");
    }
    out.newsletter_excerpt = {
      title: nm.title,
      excerpt: nm.excerpt,
      body: nm.body,
    };
  }

  const childCount =
    (out.social_posts?.length ?? 0) + (out.quote_cards?.length ?? 0) + (out.newsletter_excerpt ? 1 : 0);
  if (childCount === 0) {
    throw new Error("payload produced zero children — nothing to repurpose");
  }

  return out;
}

interface ChildInsert {
  channel: string;
  platform: string | null;
  content_type: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  hashtags: string[];
}

function payloadToChildren(payload: WritePayload): ChildInsert[] {
  const children: ChildInsert[] = [];

  for (const sp of payload.social_posts ?? []) {
    children.push({
      channel: "social",
      platform: sp.platform,
      content_type: "post",
      title: sp.title ?? null,
      body: sp.body,
      excerpt: null,
      hashtags: sp.hashtags ?? [],
    });
  }

  for (const qc of payload.quote_cards ?? []) {
    children.push({
      channel: "social",
      platform: qc.platform,
      content_type: "quote_card",
      title: null,
      body: qc.body,
      excerpt: null,
      hashtags: [],
    });
  }

  if (payload.newsletter_excerpt) {
    children.push({
      channel: "newsletter",
      platform: null,
      content_type: "newsletter_excerpt",
      title: payload.newsletter_excerpt.title,
      body: payload.newsletter_excerpt.body,
      excerpt: payload.newsletter_excerpt.excerpt,
      hashtags: [],
    });
  }

  return children;
}

async function writeCommand(id: string, payloadFile: string): Promise<void> {
  const supabase = getSupabase();

  const { data: source, error: sourceErr } = await supabase
    .from(PIPELINE_TABLE)
    .select("id, property_id, channel, status")
    .eq("id", id)
    .maybeSingle();

  if (sourceErr) throw sourceErr;
  if (!source) throw new Error(`Source pipeline item '${id}' not found`);
  if (source.channel !== "blog") {
    throw new Error(`Source channel is '${source.channel}', not 'blog'; aborting`);
  }
  if (source.status !== "approved") {
    throw new Error(`Source status is '${source.status}', not 'approved'; aborting`);
  }

  const { data: property, error: propErr } = await supabase
    .from(PROPERTY_TABLE)
    .select("id, relationship_type, kill_switch, business_stage")
    .eq("id", source.property_id)
    .maybeSingle();

  if (propErr) throw propErr;
  if (!property) throw new Error(`Property for source item not found`);
  if (property.kill_switch) throw new Error("Kill switch is active; aborting");
  if (property.business_stage !== "active") {
    throw new Error(`Property stage is '${property.business_stage}', not 'active'; aborting`);
  }

  const playbook = PLAYBOOKS[relationshipTypeToPlaybook(property.relationship_type as RelationshipType)];
  const produceSocial = playbook.socialStrategy !== "skip";
  const produceNewsletter = playbook.newsletterEnabled;

  const raw = readFileSync(payloadFile, "utf8");
  const payload = validatePayload(JSON.parse(raw), { produceSocial, produceNewsletter });
  const children = payloadToChildren(payload);

  const results: Array<{
    pipeline_id: string;
    qa_review_id: string;
    channel: string;
    platform: string | null;
    content_type: string;
  }> = [];

  for (const child of children) {
    const { data: pipelineItem, error: insertErr } = await supabase
      .from(PIPELINE_TABLE)
      .insert({
        property_id: property.id,
        brief_id: null,
        channel: child.channel,
        platform: child.platform,
        content_type: child.content_type,
        title: child.title,
        body: child.body,
        excerpt: child.excerpt,
        media_urls: [],
        hashtags: child.hashtags,
        status: "qa_review",
        drafted_by_agent: REPURPOSER_AGENT,
        qa_confidence: null,
        source_content_id: source.id,
        metadata: {},
        created_by: REPURPOSER_AGENT,
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

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

    results.push({
      pipeline_id: pipelineItem.id,
      qa_review_id: review.id,
      channel: child.channel,
      platform: child.platform,
      content_type: child.content_type,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        source_id: source.id,
        property_id: property.id,
        child_count: results.length,
        children: results,
      },
      null,
      2
    )
  );
}

function parseArgs(
  argv: string[]
): { mode: "read" | "write"; id: string; payload?: string } {
  const args = argv.slice(2);
  let mode: "read" | "write" | null = null;
  let id: string | null = null;
  let payload: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--read") { mode = "read"; id = args[++i]; }
    else if (a === "--write") { mode = "write"; id = args[++i]; }
    else if (a === "--payload") { payload = args[++i]; }
  }

  if (!mode || !id) {
    console.error(
      "Usage: repurposing-helper --read <source-pipeline-id> | --write <source-pipeline-id> --payload <file.json>"
    );
    process.exit(2);
  }
  if (mode === "write" && !payload) {
    console.error("--write requires --payload <file.json>");
    process.exit(2);
  }

  return { mode, id, payload };
}

async function main() {
  const { mode, id, payload } = parseArgs(process.argv);
  if (mode === "read") await readCommand(id);
  else await writeCommand(id, payload!);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
