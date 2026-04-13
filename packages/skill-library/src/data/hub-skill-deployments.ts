import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SkillDeployment,
  SkillDeploymentInsert,
  SkillDeploymentUpdate,
  SkillDeploymentRun,
  SkillDeploymentRunInsert,
  SkillDeploymentRunUpdate,
  DeploymentFilters,
  RunFilters,
} from "../types/index";

const DEPLOYMENTS_TABLE = "hub_skill_deployments";
const RUNS_TABLE = "hub_skill_deployment_runs";

// ─── Deployments ──────────────────────────────────────────────────────────

export async function listDeployments(
  client: SupabaseClient,
  filters?: DeploymentFilters
): Promise<SkillDeployment[]> {
  let query = client.from(DEPLOYMENTS_TABLE).select("*");

  if (filters?.skillId) query = query.eq("skill_id", filters.skillId);
  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.targetType) query = query.eq("target_type", filters.targetType);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDeploymentById(
  client: SupabaseClient,
  id: string
): Promise<SkillDeployment | null> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listDeploymentsForProperty(
  client: SupabaseClient,
  propertyId: string
): Promise<SkillDeployment[]> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createDeployment(
  client: SupabaseClient,
  deployment: SkillDeploymentInsert
): Promise<SkillDeployment> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .insert(deployment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDeployment(
  client: SupabaseClient,
  id: string,
  updates: SkillDeploymentUpdate
): Promise<SkillDeployment> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeDeployment(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from(DEPLOYMENTS_TABLE)
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

// ─── Deployment Runs ──────────────────────────────────────────────────────

export async function listRuns(
  client: SupabaseClient,
  filters?: RunFilters
): Promise<SkillDeploymentRun[]> {
  let query = client.from(RUNS_TABLE).select("*");

  if (filters?.deploymentId) query = query.eq("deployment_id", filters.deploymentId);
  if (filters?.skillId) query = query.eq("skill_id", filters.skillId);
  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.triggeredBy) query = query.eq("triggered_by", filters.triggeredBy);

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

export async function getRunById(
  client: SupabaseClient,
  id: string
): Promise<SkillDeploymentRun | null> {
  const { data, error } = await client
    .from(RUNS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLatestRun(
  client: SupabaseClient,
  deploymentId: string
): Promise<SkillDeploymentRun | null> {
  const { data, error } = await client
    .from(RUNS_TABLE)
    .select("*")
    .eq("deployment_id", deploymentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createRun(
  client: SupabaseClient,
  run: SkillDeploymentRunInsert
): Promise<SkillDeploymentRun> {
  const { data, error } = await client
    .from(RUNS_TABLE)
    .insert(run)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRun(
  client: SupabaseClient,
  id: string,
  updates: SkillDeploymentRunUpdate
): Promise<SkillDeploymentRun> {
  const { data, error } = await client
    .from(RUNS_TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeRun(
  client: SupabaseClient,
  id: string,
  result: Record<string, unknown>
): Promise<SkillDeploymentRun> {
  return updateRun(client, id, {
    status: "completed",
    result,
    completed_at: new Date().toISOString(),
  });
}

export async function failRun(
  client: SupabaseClient,
  id: string,
  errorMessage: string
): Promise<SkillDeploymentRun> {
  return updateRun(client, id, {
    status: "failed",
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
  });
}

// ─── Version Pinning ──────────────────────────────────────────────────────

export async function pinDeployment(
  client: SupabaseClient,
  id: string
): Promise<SkillDeployment> {
  return updateDeployment(client, id, { pinned: true });
}

export async function unpinDeployment(
  client: SupabaseClient,
  id: string
): Promise<SkillDeployment> {
  return updateDeployment(client, id, { pinned: false });
}

// ─── Outdated Detection ───────────────────────────────────────────────────

export async function getOutdatedDeployments(
  client: SupabaseClient,
  skillId?: string
): Promise<SkillDeployment[]> {
  let query = client
    .from(DEPLOYMENTS_TABLE)
    .select("*")
    .eq("pinned", false)
    .neq("status", "removed");

  if (skillId) query = query.eq("skill_id", skillId);

  const { data, error } = await query;
  if (error) throw error;

  // Filter where deployed_version !== current_version
  return (data ?? []).filter((d) => d.deployed_version !== d.current_version);
}

// ─── PR Recording ─────────────────────────────────────────────────────────

export async function recordPRDeployment(
  client: SupabaseClient,
  id: string,
  prUrl: string,
  repo: string
): Promise<SkillDeployment> {
  return updateDeployment(client, id, {
    github_pr_url: prUrl,
    github_repo: repo,
    status: "active",
  });
}

// ─── Deployment Matrix ────────────────────────────────────────────────────

export interface MatrixCell {
  deployment_id: string;
  skill_id: string;
  property_id: string;
  status: string;
  deployed_version: string;
  current_version: string;
  pinned: boolean;
  last_run_status: string | null;
}

export async function listDeploymentMatrix(
  client: SupabaseClient
): Promise<MatrixCell[]> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .select(
      "id, skill_id, property_id, status, deployed_version, current_version, pinned, last_run_status"
    )
    .neq("status", "removed")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((d) => ({
    deployment_id: d.id,
    skill_id: d.skill_id,
    property_id: d.property_id,
    status: d.status,
    deployed_version: d.deployed_version,
    current_version: d.current_version,
    pinned: d.pinned,
    last_run_status: d.last_run_status,
  }));
}
