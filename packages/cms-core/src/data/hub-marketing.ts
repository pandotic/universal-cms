import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubMarketingService,
  HubMarketingServiceInsert,
  HubMarketingServiceUpdate,
  MarketingServiceFilters,
} from "../types/hub-marketing";

const TABLE = "hub_marketing_services";

// ─── List & Query ─────────────────────────────────────────────────────────

export async function listMarketingServices(
  client: SupabaseClient,
  filters?: MarketingServiceFilters
): Promise<HubMarketingService[]> {
  let query = client.from(TABLE).select("*");

  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.serviceType) query = query.eq("service_type", filters.serviceType);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMarketingServicesForProperty(
  client: SupabaseClient,
  propertyId: string
): Promise<HubMarketingService[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .order("service_type", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getMarketingServiceById(
  client: SupabaseClient,
  id: string
): Promise<HubMarketingService | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ─── Create & Update ──────────────────────────────────────────────────────

export async function upsertMarketingService(
  client: SupabaseClient,
  service: HubMarketingServiceInsert
): Promise<HubMarketingService> {
  const { data, error } = await client
    .from(TABLE)
    .upsert(
      { ...service, updated_at: new Date().toISOString() },
      { onConflict: "property_id,service_type" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMarketingService(
  client: SupabaseClient,
  id: string,
  updates: HubMarketingServiceUpdate
): Promise<HubMarketingService> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Delete ───────────────────────────────────────────────────────────────

export async function deleteMarketingService(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
