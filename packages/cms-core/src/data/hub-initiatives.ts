import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubInitiative,
  HubInitiativeInsert,
  HubInitiativeUpdate,
  InitiativeFilters,
} from "../types/initiatives";

const TABLE = "hub_initiatives";

export async function listInitiatives(
  client: SupabaseClient,
  filters?: InitiativeFilters,
): Promise<HubInitiative[]> {
  let query = client.from(TABLE).select("*");

  if (filters?.kind) query = query.eq("kind", filters.kind);
  if (filters?.stage) query = query.eq("stage", filters.stage);
  if (filters?.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);

  const { data, error } = await query.order("last_update_at", {
    ascending: false,
  });
  if (error) throw error;
  return (data ?? []) as HubInitiative[];
}

export async function getInitiativeBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<HubInitiative | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as HubInitiative | null) ?? null;
}

export async function getInitiativeById(
  client: SupabaseClient,
  id: string,
): Promise<HubInitiative | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as HubInitiative | null) ?? null;
}

export async function createInitiative(
  client: SupabaseClient,
  input: HubInitiativeInsert,
): Promise<HubInitiative> {
  const { data, error } = await client
    .from(TABLE)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as HubInitiative;
}

export async function updateInitiative(
  client: SupabaseClient,
  id: string,
  updates: HubInitiativeUpdate,
): Promise<HubInitiative> {
  // Bump last_update_at whenever the row changes so the "stale" flag in
  // the Fleet review section stays meaningful.
  const patch: HubInitiativeUpdate = {
    ...updates,
    last_update_at: updates.last_update_at ?? new Date().toISOString(),
  };

  const { data, error } = await client
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as HubInitiative;
}

export async function deleteInitiative(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

/**
 * Active-plus-recently-updated initiatives, for the weekly Fleet review.
 * Deliberately excludes terminal stages so the agenda doesn't re-litigate
 * things that are already resolved.
 */
export async function listInitiativesForReview(
  client: SupabaseClient,
): Promise<HubInitiative[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .in("stage", ["idea", "active", "stalled"])
    .order("next_step_due", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as HubInitiative[];
}
