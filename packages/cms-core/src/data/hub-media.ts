import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubMediaAsset,
  HubMediaAssetInsert,
  HubMediaAssetUpdate,
  MediaAssetFilters,
  SyncApprovedMediaResult,
} from "../types/hub-media-assets";

const MEDIA_ASSETS_TABLE = "hub_media_assets";
const PIPELINE_TABLE = "hub_content_pipeline";

// ─── Media Assets ──────────────────────────────────────────────────────────

export async function listMediaAssets(
  client: SupabaseClient,
  filters?: MediaAssetFilters
): Promise<HubMediaAsset[]> {
  let query = client.from(MEDIA_ASSETS_TABLE).select("*");

  if (filters?.pipelineId) {
    query = query.eq("pipeline_id", filters.pipelineId);
  }

  if (filters?.assetType) {
    query = query.eq("asset_type", filters.assetType);
  }

  if (filters?.provider) {
    query = query.eq("provider", filters.provider);
  }

  const { data, error } = await query.order("created_at");

  if (error) throw error;
  return data ?? [];
}

export async function getMediaAssetById(
  client: SupabaseClient,
  id: string
): Promise<HubMediaAsset | null> {
  const { data, error } = await client
    .from(MEDIA_ASSETS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createMediaAsset(
  client: SupabaseClient,
  asset: HubMediaAssetInsert
): Promise<HubMediaAsset> {
  const { data, error } = await client
    .from(MEDIA_ASSETS_TABLE)
    .insert(asset)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMediaAsset(
  client: SupabaseClient,
  id: string,
  updates: HubMediaAssetUpdate
): Promise<HubMediaAsset> {
  const { data, error } = await client
    .from(MEDIA_ASSETS_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMediaAsset(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from(MEDIA_ASSETS_TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function incrementRegenCount(
  client: SupabaseClient,
  id: string
): Promise<HubMediaAsset> {
  const { data: current, error: fetchError } = await client
    .from(MEDIA_ASSETS_TABLE)
    .select("regen_count")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await client
    .from(MEDIA_ASSETS_TABLE)
    .update({
      regen_count: (current.regen_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── CMS Pull Sync ─────────────────────────────────────────────────────────

/**
 * Pull-based sync for consumer sites: finds approved, unsynced pipeline items
 * with their associated media assets and writes them to the site's local CMS
 * tables. Sites call this from a cron or route handler.
 *
 * Returns a summary of how many items were synced, skipped, or errored.
 */
export async function syncApprovedMedia(
  hubClient: SupabaseClient,
  propertyId: string,
  onSyncItem: (pipelineId: string, assets: HubMediaAsset[]) => Promise<void>
): Promise<SyncApprovedMediaResult> {
  const result: SyncApprovedMediaResult = {
    synced: 0,
    skipped: 0,
    errors: [],
  };

  // Fetch approved, unsynced pipeline items for this property
  const { data: items, error: fetchError } = await hubClient
    .from(PIPELINE_TABLE)
    .select("id")
    .eq("property_id", propertyId)
    .eq("status", "approved")
    .is("synced_at", null);

  if (fetchError) throw fetchError;
  if (!items || items.length === 0) return result;

  for (const item of items) {
    try {
      // Fetch associated media assets
      const assets = await listMediaAssets(hubClient, { pipelineId: item.id });

      // Delegate writing to the consumer site's handler
      await onSyncItem(item.id, assets);

      // Stamp synced_at on the Hub row
      const { error: updateError } = await hubClient
        .from(PIPELINE_TABLE)
        .update({ synced_at: new Date().toISOString() })
        .eq("id", item.id);

      if (updateError) throw updateError;

      result.synced++;
    } catch (err) {
      result.errors.push({
        pipeline_id: item.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
