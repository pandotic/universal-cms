import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubGroup,
  GroupType,
  HubUserGroupAccess,
  HubProperty,
} from "../types/hub";

const TABLE = "hub_groups";
const PROPS_TABLE = "hub_group_properties";
const ACCESS_TABLE = "hub_user_group_access";

// ─── Group CRUD ────────────────────────────────────────────────────────────

export async function listGroups(
  client: SupabaseClient,
  filters?: { type?: GroupType }
): Promise<HubGroup[]> {
  let query = client.from(TABLE).select("*");

  if (filters?.type) query = query.eq("group_type", filters.type);

  const { data, error } = await query.order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getGroupById(
  client: SupabaseClient,
  id: string
): Promise<HubGroup | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getGroupBySlug(
  client: SupabaseClient,
  slug: string
): Promise<HubGroup | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createGroup(
  client: SupabaseClient,
  group: {
    name: string;
    slug: string;
    description?: string;
    group_type?: GroupType;
    metadata?: Record<string, unknown>;
  }
): Promise<HubGroup> {
  const { data, error } = await client
    .from(TABLE)
    .insert({
      name: group.name,
      slug: group.slug,
      description: group.description ?? null,
      group_type: group.group_type ?? "custom",
      metadata: group.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGroup(
  client: SupabaseClient,
  id: string,
  updates: Partial<Pick<HubGroup, "name" | "slug" | "description" | "group_type" | "metadata">>
): Promise<HubGroup> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGroup(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

// ─── Group ↔ Property Assignments ──────────────────────────────────────────

export async function getGroupProperties(
  client: SupabaseClient,
  groupId: string
): Promise<HubProperty[]> {
  const { data, error } = await client
    .from(PROPS_TABLE)
    .select("property_id, hub_properties(*)")
    .eq("group_id", groupId);

  if (error) throw error;

  return (data ?? []).map(
    (row: Record<string, unknown>) => row.hub_properties as unknown as HubProperty
  );
}

export async function addPropertyToGroup(
  client: SupabaseClient,
  groupId: string,
  propertyId: string,
  addedBy?: string
): Promise<void> {
  const { error } = await client.from(PROPS_TABLE).insert({
    group_id: groupId,
    property_id: propertyId,
    added_by: addedBy ?? null,
  });

  if (error) throw error;
}

export async function removePropertyFromGroup(
  client: SupabaseClient,
  groupId: string,
  propertyId: string
): Promise<void> {
  const { error } = await client
    .from(PROPS_TABLE)
    .delete()
    .eq("group_id", groupId)
    .eq("property_id", propertyId);

  if (error) throw error;
}

export async function getPropertyGroups(
  client: SupabaseClient,
  propertyId: string
): Promise<HubGroup[]> {
  const { data, error } = await client
    .from(PROPS_TABLE)
    .select("group_id, hub_groups(*)")
    .eq("property_id", propertyId);

  if (error) throw error;

  return (data ?? []).map(
    (row: Record<string, unknown>) => row.hub_groups as unknown as HubGroup
  );
}

// ─── Group ↔ User Access ──────────────────────────────────────────────────

export async function getGroupMembers(
  client: SupabaseClient,
  groupId: string
): Promise<HubUserGroupAccess[]> {
  const { data, error } = await client
    .from(ACCESS_TABLE)
    .select("*")
    .eq("group_id", groupId);

  if (error) throw error;
  return data ?? [];
}

export async function addUserToGroup(
  client: SupabaseClient,
  groupId: string,
  userId: string,
  role: "group_admin" | "member" | "viewer" = "member",
  grantedBy?: string
): Promise<void> {
  const { error } = await client.from(ACCESS_TABLE).upsert(
    {
      group_id: groupId,
      user_id: userId,
      role,
      granted_by: grantedBy ?? null,
      granted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,group_id" }
  );

  if (error) throw error;
}

export async function removeUserFromGroup(
  client: SupabaseClient,
  groupId: string,
  userId: string
): Promise<void> {
  const { error } = await client
    .from(ACCESS_TABLE)
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getUserGroups(
  client: SupabaseClient,
  userId: string
): Promise<HubGroup[]> {
  const { data, error } = await client
    .from(ACCESS_TABLE)
    .select("group_id, hub_groups(*)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map(
    (row: Record<string, unknown>) => row.hub_groups as unknown as HubGroup
  );
}
