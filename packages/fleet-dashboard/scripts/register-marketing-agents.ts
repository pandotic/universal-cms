/**
 * Registers the 5 Phase 3 marketing agents for the SPEED property on the
 * Pandotic Hub. Upserts on (property_id, slug) so re-running is idempotent.
 *
 * Usage:
 *   SUPABASE_URL=https://<project>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
 *   pnpm --filter @pandotic/fleet-dashboard register-marketing-agents
 *
 *   # Optionally scope to a different property + override the hub_users owner:
 *   CREATED_BY_HUB_USER_ID=<uuid> \
 *   TARGET_PROPERTY_SLUG=safemama \
 *   pnpm --filter @pandotic/fleet-dashboard register-marketing-agents
 *
 * The `hub_agents.created_by` column is a NOT NULL FK to hub_users(id).
 * If CREATED_BY_HUB_USER_ID is unset, the script picks the first hub_users row
 * with hub_role='super_admin'. If none exists, it aborts with a clear message.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_PROPERTY_SLUG = "speed";
const PROPERTY_TABLE = "hub_properties";
const USERS_TABLE = "hub_users";
const AGENTS_TABLE = "hub_agents";

interface AgentSeed {
  slug: string;
  name: string;
  description: string;
  agent_type: string;
}

const MARKETING_AGENTS: AgentSeed[] = [
  {
    slug: "marketing-director",
    name: "Marketing Director",
    description:
      "Reads a property's marketing state (playbook, recent pipeline activity, items awaiting review, setup gaps, agent errors) and synthesizes a weekly plan for the human. Read-only — no DB writes, no fanout.",
    agent_type: "marketing_director",
  },
  {
    slug: "marketing-skeptical-reviewer",
    name: "Skeptical Reviewer",
    description:
      "QA gate for every piece of content in the pipeline. Scores factual claims, hallucination risk, brand-voice match, AI tells, CTA clarity, grammar, and per-content-type rules. Writes hub_content_qa_reviews and transitions hub_content_pipeline.status.",
    agent_type: "skeptical_reviewer",
  },
  {
    slug: "marketing-brand-profile-builder",
    name: "Brand Profile Builder",
    description:
      "Generates derivative brand assets (descriptions at 5 lengths, per-platform social bios, press boilerplate, NAP, JSON-LD schema, hashtags, keywords) and upserts to hub_brand_assets. Idempotent.",
    agent_type: "brand_profile_builder",
  },
  {
    slug: "marketing-long-form-writer",
    name: "Long-Form Writer",
    description:
      "Drafts 1,500–3,000-word blog posts grounded in brand voice + playbook. Submits to hub_content_pipeline in qa_review and opens a pending QA review row pointing at the Skeptical Reviewer. Refuses without a brand voice brief.",
    agent_type: "long_form_writer",
  },
  {
    slug: "marketing-repurposing-specialist",
    name: "Repurposing Specialist",
    description:
      "Atomizes an approved blog into up to 9 child pieces (5 social posts, 1 newsletter excerpt, 3 quote cards), each linked via source_content_id and gated by the Skeptical Reviewer. Honors playbook gates.",
    agent_type: "repurposing_specialist",
  },
];

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveCreatedBy(supabase: SupabaseClient): Promise<string> {
  const explicit = process.env.CREATED_BY_HUB_USER_ID;
  if (explicit && explicit.trim().length > 0) {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select("id")
      .eq("id", explicit)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error(
        `CREATED_BY_HUB_USER_ID '${explicit}' does not match any row in ${USERS_TABLE}`
      );
    }
    return data.id;
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("id, display_name")
    .eq("hub_role", "super_admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      `No hub_users row with hub_role='super_admin' exists. Either sign in to the Hub as a founder first (so handle_new_user populates hub_users), or set CREATED_BY_HUB_USER_ID explicitly.`
    );
  }
  console.log(
    `[register-marketing-agents] created_by → ${data.id} (${data.display_name}, first super_admin)`
  );
  return data.id;
}

async function resolveProperty(
  supabase: SupabaseClient,
  slug: string
): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase
    .from(PROPERTY_TABLE)
    .select("id, name, slug, kill_switch, business_stage")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Property with slug '${slug}' not found in ${PROPERTY_TABLE}`);
  if (data.kill_switch) {
    throw new Error(`Property '${slug}' has kill_switch=true; refusing to register agents`);
  }
  if (data.business_stage !== "active") {
    console.warn(
      `[register-marketing-agents] WARN: property '${slug}' stage is '${data.business_stage}', not 'active' — proceeding, but most skills will gate at runtime.`
    );
  }
  return { id: data.id, name: data.name };
}

async function main() {
  const supabase = getSupabase();
  const slug = process.env.TARGET_PROPERTY_SLUG ?? DEFAULT_PROPERTY_SLUG;

  const property = await resolveProperty(supabase, slug);
  const createdBy = await resolveCreatedBy(supabase);

  console.log(
    `[register-marketing-agents] upserting ${MARKETING_AGENTS.length} agents for '${property.name}' (${property.id})`
  );

  type AgentSummary = { slug: string; agent_id: string; action: "inserted" | "updated" };
  const results: AgentSummary[] = [];

  for (const agent of MARKETING_AGENTS) {
    // Distinguish insert vs update for the summary (the upsert itself is atomic).
    const { data: existing, error: existErr } = await supabase
      .from(AGENTS_TABLE)
      .select("id")
      .eq("property_id", property.id)
      .eq("slug", agent.slug)
      .maybeSingle();
    if (existErr) throw existErr;

    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .upsert(
        {
          property_id: property.id,
          slug: agent.slug,
          name: agent.name,
          description: agent.description,
          agent_type: agent.agent_type,
          config: {},
          enabled: true,
          schedule: null,
          created_by: createdBy,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "property_id,slug" }
      )
      .select("id")
      .single();
    if (error) throw error;

    results.push({
      slug: agent.slug,
      agent_id: data.id,
      action: existing ? "updated" : "inserted",
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        property: { id: property.id, slug, name: property.name },
        created_by: createdBy,
        agents: results,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
