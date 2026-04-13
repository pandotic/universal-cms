import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubAgent,
  HubAgentInsert,
  HubAgentUpdate,
  HubAgentRun,
  HubAgentRunInsert,
  HubAgentRunUpdate,
  AgentFilters,
  AgentRunFilters,
  AgentType,
  AgentRunStatus,
} from "../types/agent";

const AGENTS_TABLE = "hub_agents";
const AGENT_RUNS_TABLE = "hub_agent_runs";

// ─── Agents ────────────────────────────────────────────────────────────────

export async function listAgents(
  client: SupabaseClient,
  filters?: AgentFilters
): Promise<HubAgent[]> {
  let query = client.from(AGENTS_TABLE).select("*");

  if (filters?.propertyId) {
    query = query.eq("property_id", filters.propertyId);
  }

  if (filters?.agentType) {
    query = query.eq("agent_type", filters.agentType);
  }

  if (filters?.enabled !== undefined) {
    query = query.eq("enabled", filters.enabled);
  }

  const { data, error } = await query.order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getAgentById(
  client: SupabaseClient,
  id: string
): Promise<HubAgent | null> {
  const { data, error } = await client
    .from(AGENTS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAgentBySlug(
  client: SupabaseClient,
  slug: string,
  propertyId: string
): Promise<HubAgent | null> {
  const { data, error } = await client
    .from(AGENTS_TABLE)
    .select("*")
    .eq("slug", slug)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createAgent(
  client: SupabaseClient,
  agent: HubAgentInsert
): Promise<HubAgent> {
  const { data, error } = await client
    .from(AGENTS_TABLE)
    .insert(agent)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAgent(
  client: SupabaseClient,
  id: string,
  updates: HubAgentUpdate
): Promise<HubAgent> {
  const { data, error } = await client
    .from(AGENTS_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAgent(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from(AGENTS_TABLE).delete().eq("id", id);

  if (error) throw error;
}

// ─── Agent Runs ────────────────────────────────────────────────────────────

export async function listAgentRuns(
  client: SupabaseClient,
  agentId: string,
  filters?: AgentRunFilters
): Promise<HubAgentRun[]> {
  let query = client
    .from(AGENT_RUNS_TABLE)
    .select("*")
    .eq("agent_id", agentId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

export async function getAgentRunById(
  client: SupabaseClient,
  id: string
): Promise<HubAgentRun | null> {
  const { data, error } = await client
    .from(AGENT_RUNS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createAgentRun(
  client: SupabaseClient,
  run: HubAgentRunInsert
): Promise<HubAgentRun> {
  const { data, error } = await client
    .from(AGENT_RUNS_TABLE)
    .insert(run)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAgentRun(
  client: SupabaseClient,
  id: string,
  updates: HubAgentRunUpdate
): Promise<HubAgentRun> {
  const { data, error } = await client
    .from(AGENT_RUNS_TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLatestAgentRun(
  client: SupabaseClient,
  agentId: string
): Promise<HubAgentRun | null> {
  const { data, error } = await client
    .from(AGENT_RUNS_TABLE)
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAgentRunsByProperty(
  client: SupabaseClient,
  propertyId: string,
  filters?: { status?: AgentRunStatus; limit?: number }
): Promise<HubAgentRun[]> {
  let query = client
    .from(AGENT_RUNS_TABLE)
    .select("*")
    .eq("property_id", propertyId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 50);

  if (error) throw error;
  return data ?? [];
}
