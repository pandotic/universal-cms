import type { SupabaseClient } from "@supabase/supabase-js";
import type { HubActivityLogEntry, ActivityFilters } from "../types/hub";

const TABLE = "hub_activity_log";

export async function logHubActivity(
  client: SupabaseClient,
  entry: {
    user_id?: string;
    property_id?: string;
    group_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await client.from(TABLE).insert({
    user_id: entry.user_id ?? null,
    property_id: entry.property_id ?? null,
    group_id: entry.group_id ?? null,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    description: entry.description ?? null,
    metadata: entry.metadata ?? {},
  });

  if (error) {
    console.error("Failed to log hub activity:", error);
  }
}

export async function getHubActivityLog(
  client: SupabaseClient,
  filters?: ActivityFilters
): Promise<{ entries: HubActivityLogEntry[]; total: number }> {
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  let query = client.from(TABLE).select("*", { count: "exact" });

  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.userId) query = query.eq("user_id", filters.userId);
  if (filters?.action) query = query.eq("action", filters.action);
  if (filters?.entityType) query = query.eq("entity_type", filters.entityType);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { entries: data ?? [], total: count ?? 0 };
}

export async function getRecentHubActivity(
  client: SupabaseClient,
  limit = 10
): Promise<HubActivityLogEntry[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
