/**
 * Helper for the marketing-brand-profile-builder skill.
 *
 * Two modes:
 *   --read <slug>                          → prints JSON context for Claude to use when generating assets
 *   --write <slug> --payload <file.json>   → upserts generated assets into hub_brand_assets
 *
 * Reads credentials from env:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run via:
 *   pnpm --filter @pandotic/fleet-dashboard brand-profile-helper -- --read speed
 *   pnpm --filter @pandotic/fleet-dashboard brand-profile-helper -- --write speed --payload /tmp/assets.json
 */

import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface ReadContext {
  property: {
    id: string;
    name: string;
    slug: string;
    url: string;
    relationship_type: string | null;
    site_profile: string | null;
    business_stage: string | null;
    business_category: string | null;
    kill_switch: boolean;
    domains: string[] | null;
  };
  brand_voice: Record<string, unknown> | null;
  existing_assets: Record<string, unknown> | null;
  gate: {
    allowed: boolean;
    reason?: string;
  };
}

interface WritePayload {
  description_25?: string | null;
  description_50?: string | null;
  description_100?: string | null;
  description_250?: string | null;
  description_500?: string | null;
  bio_twitter?: string | null;
  bio_linkedin?: string | null;
  bio_instagram?: string | null;
  bio_facebook?: string | null;
  category_primary?: string | null;
  categories_secondary?: string[];
  keywords?: string[];
  press_boilerplate?: string | null;
  hashtags?: Record<string, unknown>;
  nap_name?: string | null;
  nap_address?: string | null;
  nap_phone?: string | null;
  nap_email?: string | null;
  schema_jsonld?: Record<string, unknown> | null;
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
    .select("id, name, slug, url, relationship_type, site_profile, business_stage, business_category, kill_switch, domains")
    .eq("slug", slug)
    .maybeSingle();

  if (propErr) throw propErr;
  if (!property) {
    console.error(JSON.stringify({ error: `Property with slug '${slug}' not found` }, null, 2));
    process.exit(1);
  }

  const [voiceRes, assetsRes] = await Promise.all([
    supabase.from("hub_brand_voice_briefs").select("*").eq("property_id", property.id).limit(1).maybeSingle(),
    supabase.from("hub_brand_assets").select("*").eq("property_id", property.id).maybeSingle(),
  ]);

  if (voiceRes.error) throw voiceRes.error;
  if (assetsRes.error) throw assetsRes.error;

  const gate: ReadContext["gate"] = property.kill_switch
    ? { allowed: false, reason: "Kill switch is active" }
    : property.business_stage !== "active"
      ? { allowed: false, reason: `Property stage is '${property.business_stage}', not 'active'` }
      : { allowed: true };

  const ctx: ReadContext = {
    property,
    brand_voice: voiceRes.data,
    existing_assets: assetsRes.data,
    gate,
  };

  console.log(JSON.stringify(ctx, null, 2));
}

async function writeCommand(slug: string, payloadFile: string): Promise<void> {
  const supabase = getSupabase();

  const { data: property, error: propErr } = await supabase
    .from("hub_properties")
    .select("id, kill_switch, business_stage")
    .eq("slug", slug)
    .maybeSingle();

  if (propErr) throw propErr;
  if (!property) throw new Error(`Property with slug '${slug}' not found`);
  if (property.kill_switch) throw new Error("Kill switch is active; aborting");
  if (property.business_stage !== "active") {
    throw new Error(`Property stage is '${property.business_stage}', not 'active'; aborting`);
  }

  const raw = readFileSync(payloadFile, "utf8");
  const payload = JSON.parse(raw) as WritePayload;

  const { data, error } = await supabase
    .from("hub_brand_assets")
    .upsert(
      { property_id: property.id, ...payload, updated_at: new Date().toISOString() },
      { onConflict: "property_id" }
    )
    .select()
    .single();

  if (error) throw error;

  console.log(JSON.stringify({ ok: true, asset_id: data.id, property_id: property.id }, null, 2));
}

function parseArgs(argv: string[]): { mode: "read" | "write"; slug: string; payload?: string } {
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
    console.error("Usage: brand-profile-helper --read <slug> | --write <slug> --payload <file.json>");
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
