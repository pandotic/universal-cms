import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  group_name: string;
  updated_by: string | null;
  updated_at: string;
}

// Settings cache for build-time / request-time reads
let settingsCache: Map<string, SiteSetting> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

async function loadSettings(): Promise<Map<string, SiteSetting>> {
  const now = Date.now();
  if (settingsCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return settingsCache;
  }

  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*");

  if (error) throw error;

  const map = new Map<string, SiteSetting>();
  for (const row of data ?? []) {
    map.set(row.key, row);
  }

  settingsCache = map;
  cacheTimestamp = now;
  return map;
}

export async function getSetting(key: string): Promise<Record<string, unknown> | null> {
  const settings = await loadSettings();
  const setting = settings.get(key);
  return setting?.value ?? null;
}

export async function getSettingsByGroup(
  groupName: string
): Promise<SiteSetting[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("group_name", groupName);

  if (error) throw error;
  return data ?? [];
}

export async function getAllSettings(): Promise<SiteSetting[]> {
  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("group_name")
    .order("key");

  if (error) throw error;
  return data ?? [];
}

export async function updateSetting(
  key: string,
  value: Record<string, unknown>,
  updatedBy?: string
): Promise<SiteSetting> {
  // Invalidate cache
  settingsCache = null;

  const supabase = await getSupabaseAdmin();
  const { data, error } = await supabase
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
  settings: { key: string; value: Record<string, unknown> }[],
  updatedBy?: string
): Promise<void> {
  settingsCache = null;

  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.from("site_settings").upsert(
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
export async function getAnalyticsProviders(): Promise<
  { provider: string; config: Record<string, unknown>; enabled: boolean }[]
> {
  const value = await getSetting("analytics_providers");
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
