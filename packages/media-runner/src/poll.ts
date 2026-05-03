// Atomically claims a single pending hub_agent_runs row.
//
// Strategy: SELECT id WHERE status='pending' ORDER BY created_at LIMIT 1,
// then UPDATE ... WHERE id=$ AND status='pending' RETURNING. If 0 rows
// were updated, another worker beat us — try again on the next tick.
//
// We also join hub_agents to filter on agent_type and require a
// managed_agent_id (otherwise this run can't be dispatched yet).

import type { SupabaseClient } from "@supabase/supabase-js";
import { log } from "./log.js";

export interface ClaimedRun {
  run_id: string;
  agent_id: string;
  agent_slug: string;
  agent_type: string;
  managed_agent_id: string;
  managed_agent_version: number | null;
  property_id: string;
  // The original input the helper enqueued (topic, keyword, brand context, etc.)
  input: Record<string, unknown>;
}

export async function claimNextRun(
  supabase: SupabaseClient,
  agentTypes: string[]
): Promise<ClaimedRun | null> {
  // Step 1: find candidate. We can't do the join + atomic update in one
  // call via PostgREST, so we read first and confirm-via-update.
  const { data: candidates, error: candidateErr } = await supabase
    .from("hub_agent_runs")
    .select(
      "id, agent_id, property_id, result, hub_agents!inner(slug, agent_type, managed_agent_id, managed_agent_version)"
    )
    .eq("status", "pending")
    .in("hub_agents.agent_type", agentTypes)
    .not("hub_agents.managed_agent_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(1);

  if (candidateErr) {
    log.error("claimNextRun: select failed", { error: candidateErr.message });
    return null;
  }
  if (!candidates || candidates.length === 0) return null;

  const row = candidates[0]!;
  const agent = row.hub_agents as unknown as {
    slug: string;
    agent_type: string;
    managed_agent_id: string;
    managed_agent_version: number | null;
  };

  // Step 2: atomic claim — only succeeds if status is still pending.
  const { data: updated, error: updateErr } = await supabase
    .from("hub_agent_runs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateErr) {
    log.error("claimNextRun: claim update failed", {
      run_id: row.id,
      error: updateErr.message,
    });
    return null;
  }
  if (!updated) {
    // Lost the race — another worker claimed it.
    log.debug("claimNextRun: lost race", { run_id: row.id });
    return null;
  }

  const result = (row.result ?? {}) as Record<string, unknown>;
  const input = (result.input ?? {}) as Record<string, unknown>;

  return {
    run_id: row.id,
    agent_id: row.agent_id,
    agent_slug: agent.slug,
    agent_type: agent.agent_type,
    managed_agent_id: agent.managed_agent_id,
    managed_agent_version: agent.managed_agent_version,
    property_id: row.property_id,
    input,
  };
}
