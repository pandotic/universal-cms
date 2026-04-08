import type { SupabaseClient } from "@supabase/supabase-js";
import type { HubUser, HubRole } from "../types/hub";

const TABLE = "hub_users";

export async function getHubUser(
  client: SupabaseClient,
  authUserId: string
): Promise<HubUser | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getOrCreateHubUser(
  client: SupabaseClient,
  authUser: { id: string; email: string; display_name?: string }
): Promise<HubUser> {
  const existing = await getHubUser(client, authUser.id);
  if (existing) {
    // Update last_active_at
    await client
      .from(TABLE)
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing;
  }

  const { data, error } = await client
    .from(TABLE)
    .insert({
      auth_user_id: authUser.id,
      email: authUser.email,
      display_name: authUser.display_name ?? authUser.email.split("@")[0],
      hub_role: "viewer" as HubRole,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHubUser(
  client: SupabaseClient,
  id: string,
  updates: Partial<Pick<HubUser, "display_name" | "avatar_url" | "hub_role">>
): Promise<HubUser> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listHubUsers(
  client: SupabaseClient
): Promise<HubUser[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .order("display_name");

  if (error) throw error;
  return data ?? [];
}
