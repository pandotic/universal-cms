import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubPackageDeployment,
  HubPackageDeploymentInsert,
  HubPackageDeploymentUpdate,
  HubPackageDeploymentEvent,
  HubPackageDeploymentEventInsert,
  PackageDeploymentFilters,
  PackageMatrixCell,
} from "../types/hub-package-deployments";

const DEPLOYMENTS_TABLE = "hub_package_deployments";
const EVENTS_TABLE = "hub_package_deployment_events";

// ─── Deployments ──────────────────────────────────────────────────────────

export async function listPackageDeployments(
  client: SupabaseClient,
  filters?: PackageDeploymentFilters
): Promise<HubPackageDeployment[]> {
  let query = client.from(DEPLOYMENTS_TABLE).select("*");

  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.packageName) query = query.eq("package_name", filters.packageName);
  if (filters?.packageCategory) query = query.eq("package_category", filters.packageCategory);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPackageDeployment(
  client: SupabaseClient,
  propertyId: string,
  packageName: string = "@pandotic/universal-cms"
): Promise<HubPackageDeployment | null> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .eq("package_name", packageName)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPackageDeploymentById(
  client: SupabaseClient,
  id: string
): Promise<HubPackageDeployment | null> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertPackageDeployment(
  client: SupabaseClient,
  deployment: HubPackageDeploymentInsert
): Promise<HubPackageDeployment> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .upsert(
      { ...deployment, updated_at: new Date().toISOString() },
      { onConflict: "property_id,package_name" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePackageDeployment(
  client: SupabaseClient,
  id: string,
  updates: HubPackageDeploymentUpdate
): Promise<HubPackageDeployment> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Version Pinning ──────────────────────────────────────────────────────

export async function pinPackageDeployment(
  client: SupabaseClient,
  id: string
): Promise<HubPackageDeployment> {
  return updatePackageDeployment(client, id, { pinned: true });
}

export async function unpinPackageDeployment(
  client: SupabaseClient,
  id: string
): Promise<HubPackageDeployment> {
  return updatePackageDeployment(client, id, { pinned: false });
}

// ─── Outdated Detection ───────────────────────────────────────────────────

export async function getOutdatedPackageDeployments(
  client: SupabaseClient,
  packageName?: string
): Promise<HubPackageDeployment[]> {
  let query = client
    .from(DEPLOYMENTS_TABLE)
    .select("*")
    .eq("pinned", false)
    .eq("status", "active");

  if (packageName) query = query.eq("package_name", packageName);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).filter(
    (d) => d.installed_version && d.latest_version && d.installed_version !== d.latest_version
  );
}

// ─── Deployment Matrix ────────────────────────────────────────────────────

export async function listPackageDeploymentMatrix(
  client: SupabaseClient
): Promise<PackageMatrixCell[]> {
  const { data, error } = await client
    .from(DEPLOYMENTS_TABLE)
    .select(
      "id, property_id, package_name, package_category, installed_version, latest_version, status, pinned, enabled_modules"
    )
    .order("package_name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((d) => ({
    deployment_id: d.id,
    property_id: d.property_id,
    package_name: d.package_name,
    package_category: d.package_category,
    installed_version: d.installed_version,
    latest_version: d.latest_version,
    status: d.status,
    pinned: d.pinned,
    module_count: (d.enabled_modules as string[])?.length ?? 0,
  }));
}

// ─── Health Check Sync ────────────────────────────────────────────────────

export async function syncPropertyCmsDeployment(
  client: SupabaseClient,
  propertyId: string,
  healthData: {
    version: string;
    enabledModules: string[];
    disabledModules?: string[];
    siteName?: string;
  },
  latestVersion: string
): Promise<HubPackageDeployment> {
  const now = new Date().toISOString();

  return upsertPackageDeployment(client, {
    property_id: propertyId,
    package_name: "@pandotic/universal-cms",
    package_category: "cms",
    installed_version: healthData.version,
    latest_version: latestVersion,
    enabled_modules: healthData.enabledModules,
    bespoke_modules: [],
    preset: null,
    pinned: false,
    status: "active",
    github_repo: null,
    github_pr_url: null,
    deployed_by: null,
    deployed_at: null,
    last_health_check_at: now,
    health_check_data: healthData as Record<string, unknown>,
  });
}

// ─── Deployment Events ────────────────────────────────────────────────────

export async function logPackageDeploymentEvent(
  client: SupabaseClient,
  event: HubPackageDeploymentEventInsert
): Promise<HubPackageDeploymentEvent> {
  const { data, error } = await client
    .from(EVENTS_TABLE)
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listPackageDeploymentEvents(
  client: SupabaseClient,
  deploymentId: string,
  limit: number = 50
): Promise<HubPackageDeploymentEvent[]> {
  const { data, error } = await client
    .from(EVENTS_TABLE)
    .select("*")
    .eq("deployment_id", deploymentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
