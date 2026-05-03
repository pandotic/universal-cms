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

const ANTHROPIC_API = "https://api.anthropic.com";
const ANTHROPIC_BETA = process.env.ANTHROPIC_BETA ?? "managed-agents-2026-04-01";
const DEFAULT_MODEL = process.env.MANAGED_AGENT_MODEL ?? "claude-sonnet-4-6";

interface AgentSeed {
  slug: string;
  name: string;
  description: string;
  agent_type: string;
  // Managed-agent-specific fields. Only types listed in MANAGED_TYPES below
  // get an `agents.create()` call; the others are CLI-helper-only for now
  // and migrate in PR 6.
  instructions?: string;
}

// Set of agent_types that should be created as Managed Agents in Anthropic.
// Right now (PR 2) only Long-Form Writer is the pilot.
const MANAGED_TYPES = new Set<string>(["long_form_writer"]);

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
    instructions: [
      "You are a senior long-form content writer for the Pandotic Marketing Agency.",
      "Your job: draft a 1,500–3,000-word blog post grounded in the supplied brand voice, brand assets, and playbook.",
      "Hard rules:",
      "  • Match the brand voice's tone, vocabulary, sentence patterns, and humor guidelines exactly.",
      "  • Honor anti-examples — never produce something on that list.",
      "  • Use the target keyword naturally in the H1, first paragraph, and ~1% of body copy. Sprinkle secondary keywords.",
      "  • Structure: H1, intro hook, 3–6 H2 sections (with H3s as needed), conclusion with a CTA.",
      "  • Cite sources where you make factual claims; never fabricate statistics.",
      "Output format: end your turn by emitting a single ```json fenced block with this exact shape:",
      "  { \"title\": str, \"excerpt\": str, \"body\": str (markdown), \"metadata\": { brief, target_keyword, secondary_keywords, estimated_read_time_min } }",
      "After emitting that block, end your turn (do not write anything after it).",
    ].join("\n"),
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

// ─── Anthropic Managed Agents (beta) ─────────────────────────────────────

interface ManagedAgentRecord {
  id: string;
  version: number;
}

async function anthropicRequest<T>(
  apiKey: string,
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${ANTHROPIC_API}${path}`, {
    method,
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": ANTHROPIC_BETA,
      "content-type": "application/json",
    },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Anthropic ${method} ${path} → ${res.status} ${res.statusText}: ${text}`
    );
  }
  return (await res.json()) as T;
}

/**
 * Idempotent Managed Agent upsert. The Managed Agents beta doesn't expose a
 * "find-by-name", so we cache the agent_id in `hub_agents.managed_agent_id`
 * and only call POST /v1/agents the first time. Subsequent runs reuse the ID.
 */
async function ensureManagedAgent(
  supabase: SupabaseClient,
  apiKey: string,
  agent: AgentSeed
): Promise<ManagedAgentRecord | null> {
  if (!MANAGED_TYPES.has(agent.agent_type)) return null;
  if (!agent.instructions) {
    throw new Error(
      `agent ${agent.slug} (${agent.agent_type}) is in MANAGED_TYPES but has no 'instructions'`
    );
  }

  // Reuse if any hub_agents row of this type already has a managed_agent_id.
  const { data: existing, error: existingErr } = await supabase
    .from(AGENTS_TABLE)
    .select("managed_agent_id, managed_agent_version")
    .eq("agent_type", agent.agent_type)
    .not("managed_agent_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (existingErr) throw existingErr;
  if (existing?.managed_agent_id) {
    console.log(
      `[register-marketing-agents] reusing managed agent for '${agent.agent_type}' → ${existing.managed_agent_id} v${existing.managed_agent_version ?? "?"}`
    );
    return {
      id: existing.managed_agent_id,
      version: existing.managed_agent_version ?? 1,
    };
  }

  console.log(
    `[register-marketing-agents] creating Managed Agent for '${agent.agent_type}' on Anthropic…`
  );
  const created = await anthropicRequest<{ id: string; version: number }>(
    apiKey,
    "POST",
    "/v1/agents",
    {
      display_name: agent.name,
      description: agent.description,
      instructions: agent.instructions,
      model: DEFAULT_MODEL,
      tools: [],
      metadata: { agent_type: agent.agent_type, source: "register-marketing-agents" },
    }
  );
  console.log(
    `[register-marketing-agents] → ${created.id} v${created.version}`
  );
  return { id: created.id, version: created.version };
}

async function main() {
  const supabase = getSupabase();
  const slug = process.env.TARGET_PROPERTY_SLUG ?? DEFAULT_PROPERTY_SLUG;

  const property = await resolveProperty(supabase, slug);
  const createdBy = await resolveCreatedBy(supabase);

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!anthropicApiKey && [...MANAGED_TYPES].length > 0) {
    console.warn(
      `[register-marketing-agents] WARN: ANTHROPIC_API_KEY not set — skipping Managed Agent creation. Set it to register agents on Anthropic's side.`
    );
  }

  console.log(
    `[register-marketing-agents] upserting ${MARKETING_AGENTS.length} agents for '${property.name}' (${property.id})`
  );

  type AgentSummary = {
    slug: string;
    agent_id: string;
    action: "inserted" | "updated";
    managed_agent_id?: string;
    managed_agent_version?: number;
  };
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

    // For Managed-Agent types, ensure the agent exists on Anthropic's side
    // and reuse the ID across properties.
    let managed: ManagedAgentRecord | null = null;
    if (anthropicApiKey) {
      managed = await ensureManagedAgent(supabase, anthropicApiKey, agent);
    }

    const upsertRow: Record<string, unknown> = {
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
    };
    if (managed) {
      upsertRow.managed_agent_id = managed.id;
      upsertRow.managed_agent_version = managed.version;
    }

    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .upsert(upsertRow, { onConflict: "property_id,slug" })
      .select("id")
      .single();
    if (error) throw error;

    results.push({
      slug: agent.slug,
      agent_id: data.id,
      action: existing ? "updated" : "inserted",
      ...(managed ? { managed_agent_id: managed.id, managed_agent_version: managed.version } : {}),
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
