import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BrandVoiceBrief,
  BrandVoiceBriefInsert,
  BrandVoiceBriefUpdate,
  SocialContentItem,
  SocialContentItemInsert,
  SocialContentItemUpdate,
  BrandVoiceBriefFilters,
  SocialContentFilters,
  SocialContentStats,
  SocialPlatform,
  SocialContentStatus,
} from "../types/social";

const BRIEFS_TABLE = "hub_brand_voice_briefs";
const SOCIAL_CONTENT_TABLE = "hub_social_content";

// ─── Brand Voice Briefs ────────────────────────────────────────────────────

export async function listBriefs(
  client: SupabaseClient,
  filters?: BrandVoiceBriefFilters
): Promise<BrandVoiceBrief[]> {
  let query = client.from(BRIEFS_TABLE).select("*");

  if (filters?.propertyId) {
    query = query.eq("property_id", filters.propertyId);
  }

  if (filters?.name) {
    query = query.ilike("name", `%${filters.name}%`);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

export async function getBriefById(
  client: SupabaseClient,
  id: string
): Promise<BrandVoiceBrief | null> {
  const { data, error } = await client
    .from(BRIEFS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getBriefByName(
  client: SupabaseClient,
  name: string,
  propertyId: string
): Promise<BrandVoiceBrief | null> {
  const { data, error } = await client
    .from(BRIEFS_TABLE)
    .select("*")
    .eq("name", name)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createBrief(
  client: SupabaseClient,
  brief: BrandVoiceBriefInsert
): Promise<BrandVoiceBrief> {
  const { data, error } = await client
    .from(BRIEFS_TABLE)
    .insert(brief)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBrief(
  client: SupabaseClient,
  id: string,
  updates: BrandVoiceBriefUpdate
): Promise<BrandVoiceBrief> {
  const { data, error } = await client
    .from(BRIEFS_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBrief(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from(BRIEFS_TABLE).delete().eq("id", id);

  if (error) throw error;
}

// ─── Social Content Items ──────────────────────────────────────────────────

export async function listSocialContent(
  client: SupabaseClient,
  filters?: SocialContentFilters
): Promise<SocialContentItem[]> {
  let query = client.from(SOCIAL_CONTENT_TABLE).select("*");

  if (filters?.propertyId) {
    query = query.eq("property_id", filters.propertyId);
  }

  if (filters?.briefId) {
    query = query.eq("brief_id", filters.briefId);
  }

  if (filters?.platform) {
    query = query.eq("platform", filters.platform);
  }

  if (filters?.contentType) {
    query = query.eq("content_type", filters.contentType);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.createdBy) {
    query = query.eq("created_by", filters.createdBy);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

export async function getSocialContentById(
  client: SupabaseClient,
  id: string
): Promise<SocialContentItem | null> {
  const { data, error } = await client
    .from(SOCIAL_CONTENT_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createSocialContent(
  client: SupabaseClient,
  content: SocialContentItemInsert
): Promise<SocialContentItem> {
  const { data, error } = await client
    .from(SOCIAL_CONTENT_TABLE)
    .insert(content)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSocialContent(
  client: SupabaseClient,
  id: string,
  updates: SocialContentItemUpdate
): Promise<SocialContentItem> {
  const { data, error } = await client
    .from(SOCIAL_CONTENT_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSocialContent(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client
    .from(SOCIAL_CONTENT_TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ─── Bulk Operations ───────────────────────────────────────────────────────

export async function publishSocialContent(
  client: SupabaseClient,
  id: string
): Promise<SocialContentItem> {
  return updateSocialContent(client, id, {
    status: "published",
    published_at: new Date().toISOString(),
  });
}

export async function archiveSocialContent(
  client: SupabaseClient,
  id: string
): Promise<SocialContentItem> {
  return updateSocialContent(client, id, {
    status: "archived",
  });
}

export async function scheduleContentForLater(
  client: SupabaseClient,
  id: string,
  scheduledFor: string
): Promise<SocialContentItem> {
  return updateSocialContent(client, id, {
    status: "approved",
    scheduled_for: scheduledFor,
  });
}

// ─── Statistics & Analytics ────────────────────────────────────────────────

export async function getSocialContentStats(
  client: SupabaseClient,
  propertyId: string
): Promise<SocialContentStats> {
  const { data, error } = await client
    .from(SOCIAL_CONTENT_TABLE)
    .select("status, platform, published_at")
    .eq("property_id", propertyId);

  if (error) throw error;

  const stats: SocialContentStats = {
    totalByStatus: {
      draft: 0,
      review: 0,
      approved: 0,
      published: 0,
      archived: 0,
    },
    totalByPlatform: {
      twitter: 0,
      linkedin: 0,
      instagram: 0,
      facebook: 0,
      tiktok: 0,
      youtube: 0,
      other: 0,
    },
    publishedCount: 0,
    scheduledCount: 0,
    lastPublishedAt: null,
  };

  if (!data) return stats;

  let lastPublished: string | null = null;

  for (const item of data) {
    const status = item.status as SocialContentStatus;
    const platform = item.platform as SocialPlatform;

    stats.totalByStatus[status] = (stats.totalByStatus[status] ?? 0) + 1;
    stats.totalByPlatform[platform] = (stats.totalByPlatform[platform] ?? 0) + 1;

    if (status === "published") {
      stats.publishedCount += 1;
      if (item.published_at && (!lastPublished || item.published_at > lastPublished)) {
        lastPublished = item.published_at;
      }
    }
  }

  stats.lastPublishedAt = lastPublished;

  return stats;
}

export async function getScheduledContent(
  client: SupabaseClient,
  propertyId: string
): Promise<SocialContentItem[]> {
  const { data, error } = await client
    .from(SOCIAL_CONTENT_TABLE)
    .select("*")
    .eq("property_id", propertyId)
    .eq("status", "approved")
    .not("scheduled_for", "is", null)
    .order("scheduled_for", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getContentByBrief(
  client: SupabaseClient,
  briefId: string
): Promise<SocialContentItem[]> {
  const { data, error } = await client
    .from(SOCIAL_CONTENT_TABLE)
    .select("*")
    .eq("brief_id", briefId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
