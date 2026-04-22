/**
 * Helper for the marketing-skeptical-reviewer skill.
 *
 * Two modes:
 *   --read <pipeline-item-id>                    → prints JSON context for Claude to QA the draft
 *   --write <pipeline-item-id> --payload <file>  → inserts hub_content_qa_reviews row + flips pipeline status
 *
 * Reads credentials from env:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run via:
 *   pnpm --filter @pandotic/fleet-dashboard skeptical-reviewer-helper --read <uuid>
 *   pnpm --filter @pandotic/fleet-dashboard skeptical-reviewer-helper --write <uuid> --payload /tmp/review.json
 *
 * Types inlined intentionally — keeps this tsx-invoked script CJS-friendly and avoids
 * cross-package subpath import issues (matches brand-profile-helper.ts + marketing-plan-helper.ts).
 */

import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const REVIEWER_AGENT = "marketing-skeptical-reviewer";
const PIPELINE_TABLE = "hub_content_pipeline";
const QA_TABLE = "hub_content_qa_reviews";
const VOICE_TABLE = "hub_brand_voice_briefs";
const AUTOPILOT_TABLE = "hub_auto_pilot_settings";
const LEARNING_TABLE = "hub_qa_learning_log";
const PROPERTY_TABLE = "hub_properties";

type ReviewStatus = "passed" | "flagged" | "failed";

// Default auto-pilot setting when no row exists for (property_id, content_type).
// Matches the migration 00114 defaults.
const DEFAULT_AUTOPILOT = {
  auto_pilot_enabled: false,
  confidence_threshold: 0.85,
  trust_score: 0.5,
};

interface PipelineRow {
  id: string;
  property_id: string;
  brief_id: string | null;
  channel: string;
  platform: string | null;
  content_type: string | null;
  title: string | null;
  body: string;
  status: string;
  drafted_by_agent: string | null;
  qa_confidence: number | null;
  source_content_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface PropertyRow {
  id: string;
  name: string;
  slug: string;
  relationship_type: string | null;
  site_profile: string | null;
  business_stage: string | null;
  business_category: string | null;
  kill_switch: boolean;
}

interface ReadContext {
  pipeline_item: PipelineRow;
  property: PropertyRow;
  brand_voice: Record<string, unknown> | null;
  recent_learnings: Array<Record<string, unknown>>;
  auto_pilot_setting: {
    auto_pilot_enabled: boolean;
    confidence_threshold: number;
    trust_score: number;
  };
  existing_reviews: Array<Record<string, unknown>>;
  gate: {
    allowed: boolean;
    reason?: string;
  };
}

interface WritePayload {
  overall_confidence: number;
  status: ReviewStatus;
  checks: Record<string, unknown>;
  suggested_fixes?: string[];
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

  const { data: pipelineItem, error: pipelineErr } = await supabase
    .from(PIPELINE_TABLE)
    .select(
      "id, property_id, brief_id, channel, platform, content_type, title, body, status, drafted_by_agent, qa_confidence, source_content_id, metadata, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (pipelineErr) throw pipelineErr;
  if (!pipelineItem) {
    console.error(
      JSON.stringify({ error: `Pipeline item with id '${id}' not found` }, null, 2)
    );
    process.exit(1);
  }

  const { data: property, error: propErr } = await supabase
    .from(PROPERTY_TABLE)
    .select(
      "id, name, slug, relationship_type, site_profile, business_stage, business_category, kill_switch"
    )
    .eq("id", pipelineItem.property_id)
    .maybeSingle();

  if (propErr) throw propErr;
  if (!property) {
    console.error(
      JSON.stringify(
        { error: `Property '${pipelineItem.property_id}' for pipeline item not found` },
        null,
        2
      )
    );
    process.exit(1);
  }

  const [voiceRes, learningsRes, autopilotRes, reviewsRes] = await Promise.all([
    supabase
      .from(VOICE_TABLE)
      .select("*")
      .eq("property_id", property.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from(LEARNING_TABLE)
      .select("id, check_type, outcome, human_feedback, created_at")
      .eq("property_id", property.id)
      .order("created_at", { ascending: false })
      .limit(50),
    pipelineItem.content_type
      ? supabase
          .from(AUTOPILOT_TABLE)
          .select("auto_pilot_enabled, confidence_threshold, trust_score")
          .eq("property_id", property.id)
          .eq("content_type", pipelineItem.content_type)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from(QA_TABLE)
      .select("*")
      .eq("content_id", pipelineItem.id)
      .eq("content_table", PIPELINE_TABLE)
      .order("created_at", { ascending: false }),
  ]);

  if (voiceRes.error) throw voiceRes.error;
  if (learningsRes.error) throw learningsRes.error;
  if (autopilotRes.error) throw autopilotRes.error;
  if (reviewsRes.error) throw reviewsRes.error;

  const gate: ReadContext["gate"] = property.kill_switch
    ? { allowed: false, reason: "Kill switch is active" }
    : property.business_stage !== "active"
      ? {
          allowed: false,
          reason: `Property stage is '${property.business_stage}', not 'active'`,
        }
      : { allowed: true };

  const ctx: ReadContext = {
    pipeline_item: pipelineItem as PipelineRow,
    property: property as PropertyRow,
    brand_voice: (voiceRes.data as Record<string, unknown> | null) ?? null,
    recent_learnings: (learningsRes.data ?? []) as Array<Record<string, unknown>>,
    auto_pilot_setting: autopilotRes.data ?? DEFAULT_AUTOPILOT,
    existing_reviews: (reviewsRes.data ?? []) as Array<Record<string, unknown>>,
    gate,
  };

  console.log(JSON.stringify(ctx, null, 2));
}

function validatePayload(raw: unknown): WritePayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("payload must be a JSON object");
  }
  const p = raw as Record<string, unknown>;

  const confidence = p.overall_confidence;
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1 || Number.isNaN(confidence)) {
    throw new Error("overall_confidence must be a number between 0 and 1");
  }

  const status = p.status;
  if (status !== "passed" && status !== "flagged" && status !== "failed") {
    throw new Error("status must be one of: passed, flagged, failed");
  }

  const checks = p.checks;
  if (!checks || typeof checks !== "object" || Array.isArray(checks)) {
    throw new Error("checks must be an object");
  }

  const suggestedFixes = p.suggested_fixes ?? [];
  if (!Array.isArray(suggestedFixes) || !suggestedFixes.every((s) => typeof s === "string")) {
    throw new Error("suggested_fixes must be an array of strings (or omitted)");
  }

  return {
    overall_confidence: confidence,
    status,
    checks: checks as Record<string, unknown>,
    suggested_fixes: suggestedFixes as string[],
  };
}

async function writeCommand(id: string, payloadFile: string): Promise<void> {
  const supabase = getSupabase();

  const { data: pipelineItem, error: pipelineErr } = await supabase
    .from(PIPELINE_TABLE)
    .select("id, property_id, content_type, status")
    .eq("id", id)
    .maybeSingle();

  if (pipelineErr) throw pipelineErr;
  if (!pipelineItem) throw new Error(`Pipeline item with id '${id}' not found`);

  const { data: property, error: propErr } = await supabase
    .from(PROPERTY_TABLE)
    .select("id, kill_switch, business_stage")
    .eq("id", pipelineItem.property_id)
    .maybeSingle();

  if (propErr) throw propErr;
  if (!property) throw new Error(`Property for pipeline item not found`);
  if (property.kill_switch) throw new Error("Kill switch is active; aborting");
  if (property.business_stage !== "active") {
    throw new Error(
      `Property stage is '${property.business_stage}', not 'active'; aborting`
    );
  }

  const raw = readFileSync(payloadFile, "utf8");
  const payload = validatePayload(JSON.parse(raw));

  // Step 1: insert the QA review row.
  const { data: review, error: reviewErr } = await supabase
    .from(QA_TABLE)
    .insert({
      content_id: pipelineItem.id,
      content_table: PIPELINE_TABLE,
      reviewer_agent: REVIEWER_AGENT,
      overall_confidence: payload.overall_confidence,
      status: payload.status,
      checks: payload.checks,
      suggested_fixes: payload.suggested_fixes ?? [],
      human_override: false,
      override_reason: null,
    })
    .select()
    .single();

  if (reviewErr) throw reviewErr;

  // Step 2: look up the auto-pilot setting for this (property, content_type).
  let autoPilot = { ...DEFAULT_AUTOPILOT };
  if (pipelineItem.content_type) {
    const { data: setting, error: settingErr } = await supabase
      .from(AUTOPILOT_TABLE)
      .select("auto_pilot_enabled, confidence_threshold")
      .eq("property_id", property.id)
      .eq("content_type", pipelineItem.content_type)
      .maybeSingle();
    if (settingErr) throw settingErr;
    if (setting) {
      autoPilot = { ...autoPilot, ...setting };
    }
  }

  // Step 3: decide the new pipeline status.
  const meetsThreshold =
    payload.overall_confidence >= autoPilot.confidence_threshold;
  const shouldAutoApprove = autoPilot.auto_pilot_enabled && meetsThreshold;
  const newStatus = shouldAutoApprove ? "approved" : "needs_human_review";

  // Step 4: transition the pipeline row + stamp qa_confidence.
  const { error: updateErr } = await supabase
    .from(PIPELINE_TABLE)
    .update({
      status: newStatus,
      qa_confidence: payload.overall_confidence,
    })
    .eq("id", pipelineItem.id);

  if (updateErr) throw updateErr;

  console.log(
    JSON.stringify(
      {
        ok: true,
        review_id: review.id,
        pipeline_id: pipelineItem.id,
        pipeline_status: newStatus,
        auto_pilot_enabled: autoPilot.auto_pilot_enabled,
        confidence_threshold: autoPilot.confidence_threshold,
        overall_confidence: payload.overall_confidence,
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
      "Usage: skeptical-reviewer-helper --read <pipeline-id> | --write <pipeline-id> --payload <file.json>"
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
