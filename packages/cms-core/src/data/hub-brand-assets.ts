import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubBrandAsset,
  HubBrandAssetInsert,
  HubBrandAssetUpdate,
} from "../types/hub-brand-assets";

const TABLE = "hub_brand_assets";

export async function getBrandAssets(
  client: SupabaseClient,
  propertyId: string
): Promise<HubBrandAsset | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertBrandAssets(
  client: SupabaseClient,
  assets: HubBrandAssetInsert
): Promise<HubBrandAsset> {
  const { data, error } = await client
    .from(TABLE)
    .upsert(
      { ...assets, updated_at: new Date().toISOString() },
      { onConflict: "property_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBrandAssets(
  client: SupabaseClient,
  propertyId: string,
  updates: HubBrandAssetUpdate
): Promise<HubBrandAsset> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("property_id", propertyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
