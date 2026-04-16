import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubContentPipelineItem,
  HubContentPipelineItemInsert,
  HubContentPipelineItemUpdate,
  ContentPipelineFilters,
  ContentPipelineStats,
  ContentPipelineStatus,
} from "../types/hub-content-pipeline";

const TABLE = "hub_content_pipeline";

export async function listContentPipelineItems(
  client: SupabaseClient,
  filters?: ContentPipelineFilters
): Promise<HubContentPipelineItem[]> {
  let query = client.from(TABLE).select("*");

  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.channel) query = query.eq("channel", filters.channel);
  if (filters?.platform) query = query.eq("platform", filters.platform);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.draftedByAgent) query = query.eq("drafted_by_agent", filters.draftedByAgent);
  if (filters?.briefId) query = query.eq("brief_id", filters.briefId);

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

export async function getContentPipelineItemById(
  client: SupabaseClient,
  id: string
): Promise<HubContentPipelineItem | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createContentPipelineItem(
  client: SupabaseClient,
  item: HubContentPipelineItemInsert
): Promise<HubContentPipelineItem> {
  const { data, error } = await client
    .from(TABLE)
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContentPipelineItem(
  client: SupabaseClient,
  id: string,
  updates: HubContentPipelineItemUpdate
): Promise<HubContentPipelineItem> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContentPipelineItem(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function transitionContentStatus(
  client: SupabaseClient,
  id: string,
  newStatus: ContentPipelineStatus
): Promise<HubContentPipelineItem> {
  const updates: HubContentPipelineItemUpdate = { status: newStatus };

  if (newStatus === "published") {
    updates.published_at = new Date().toISOString();
  }

  return updateContentPipelineItem(client, id, updates);
}

export async function getContentPipelineStats(
  client: SupabaseClient,
  propertyId: string
): Promise<ContentPipelineStats> {
  const { data, error } = await client
    .from(TABLE)
    .select("status, channel, published_at, scheduled_for")
    .eq("property_id", propertyId);

  if (error) throw error;

  const stats: ContentPipelineStats = {
    totalByStatus: {},
    totalByChannel: {},
    publishedCount: 0,
    scheduledCount: 0,
    pendingReviewCount: 0,
    lastPublishedAt: null,
  };

  if (!data) return stats;

  let lastPublished: string | null = null;

  for (const item of data) {
    const status = item.status as string;
    const channel = item.channel as string;

    stats.totalByStatus[status] = (stats.totalByStatus[status] ?? 0) + 1;
    stats.totalByChannel[channel] = (stats.totalByChannel[channel] ?? 0) + 1;

    if (status === "published") {
      stats.publishedCount += 1;
      if (item.published_at && (!lastPublished || item.published_at > lastPublished)) {
        lastPublished = item.published_at;
      }
    } else if (status === "approved" && item.scheduled_for) {
      stats.scheduledCount += 1;
    } else if (status === "needs_human_review" || status === "qa_review" || status === "review") {
      stats.pendingReviewCount += 1;
    }
  }

  stats.lastPublishedAt = lastPublished;
  return stats;
}
