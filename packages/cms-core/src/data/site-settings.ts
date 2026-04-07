import type { SupabaseClient } from "@supabase/supabase-js";

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  group_name: string;
  updated_by: string | null;
  updated_at: string;
}

export async function getSetting(
  client: SupabaseClient,
  key: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await client
    .from("site_settings")
    .select("*")
    .eq("key", key)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data?.value ?? null;
}

export async function getSettingsByGroup(
  client: SupabaseClient,
  groupName: string
): Promise<SiteSetting[]> {
  const { data, error } = await client
    .from("site_settings")
    .select("*")
    .eq("group_name", groupName);

  if (error) throw error;
  return data ?? [];
}

export async function getAllSettings(client: SupabaseClient): Promise<SiteSetting[]> {
  const { data, error } = await client
    .from("site_settings")
    .select("*")
    .order("group_name")
    .order("key");

  if (error) throw error;
  return data ?? [];
}

export async function updateSetting(
  client: SupabaseClient,
  key: string,
  value: Record<string, unknown>,
  updatedBy?: string
): Promise<SiteSetting> {
  const { data, error } = await client
    .from("site_settings")
    .upsert(
      {
        key,
        value,
        updated_by: updatedBy,
      },
      { onConflict: "key" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSettings(
  client: SupabaseClient,
  settings: { key: string; value: Record<string, unknown> }[],
  updatedBy?: string
): Promise<void> {
  const { error } = await client.from("site_settings").upsert(
    settings.map((s) => ({
      key: s.key,
      value: s.value,
      updated_by: updatedBy,
    })),
    { onConflict: "key" }
  );

  if (error) throw error;
}

// Convenience: get analytics provider configs
// The value can be stored as an array directly OR as { providers: [...] }
export async function getAnalyticsProviders(
  client: SupabaseClient
): Promise<
  { provider: string; config: Record<string, unknown>; enabled: boolean }[]
> {
  const value = await getSetting(client, "analytics_providers");
  if (!value) return [];
  // Support both storage shapes: raw array or { providers: [...] }
  if (Array.isArray(value)) {
    return value as { provider: string; config: Record<string, unknown>; enabled: boolean }[];
  }
  if (Array.isArray(value.providers)) {
    return value.providers as { provider: string; config: Record<string, unknown>; enabled: boolean }[];
  }
  return [];
}
