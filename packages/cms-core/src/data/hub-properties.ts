import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubProperty,
  HubPropertyInsert,
  HubPropertyUpdate,
  PropertyFilters,
  HealthStatus,
} from "../types/hub";

const TABLE = "hub_properties";

export async function listProperties(
  client: SupabaseClient,
  filters?: PropertyFilters
): Promise<HubProperty[]> {
  let query = client.from(TABLE).select("*");

  if (filters?.type) query = query.eq("property_type", filters.type);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.healthStatus)
    query = query.eq("health_status", filters.healthStatus);
  if (filters?.ownershipType)
    query = query.eq("ownership_type", filters.ownershipType);
  if (filters?.businessStage)
    query = query.eq("business_stage", filters.businessStage);
  if (filters?.businessCategory)
    query = query.eq("business_category", filters.businessCategory);
  if (filters?.platformType)
    query = query.eq("platform_type", filters.platformType);

  // Filter by group: fetch property IDs from hub_group_properties, then filter
  if (filters?.groupId) {
    const { data: gp, error: gpError } = await client
      .from("hub_group_properties")
      .select("property_id")
      .eq("group_id", filters.groupId);

    if (gpError) throw gpError;
    const ids = (gp ?? []).map((r: { property_id: string }) => r.property_id);
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  const { data, error } = await query.order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getPropertyById(
  client: SupabaseClient,
  id: string
): Promise<HubProperty | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPropertyBySlug(
  client: SupabaseClient,
  slug: string
): Promise<HubProperty | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProperty(
  client: SupabaseClient,
  property: HubPropertyInsert
): Promise<HubProperty> {
  const { data, error } = await client
    .from(TABLE)
    .insert(property)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProperty(
  client: SupabaseClient,
  id: string,
  updates: HubPropertyUpdate
): Promise<HubProperty> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProperty(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function updatePropertyHealth(
  client: SupabaseClient,
  id: string,
  health: {
    health_status: HealthStatus;
    ssl_valid?: boolean;
    ssl_expires_at?: string | null;
    last_deploy_at?: string | null;
  }
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .update({ ...health, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
