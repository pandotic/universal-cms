import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HubPressRelease,
  HubPressReleaseInsert,
  HubPressReleaseUpdate,
  HubInfluencer,
  HubInfluencerInsert,
  HubInfluencerUpdate,
  HubInfluencerInteraction,
  HubInfluencerInteractionInsert,
  HubPodcast,
  HubPodcastInsert,
  HubPodcastUpdate,
  HubResearchStudy,
  HubResearchStudyInsert,
  HubResearchStudyUpdate,
  MarketingOpsFilters,
} from "../types/hub-marketing-ops";

// ─── Press Releases ─────────────────────────────────────────────────────

const PRESS_TABLE = "hub_press_releases";

export async function listPressReleases(
  client: SupabaseClient,
  filters?: MarketingOpsFilters
): Promise<HubPressRelease[]> {
  let query = client.from(PRESS_TABLE).select("*");
  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(filters?.limit ?? 50);
  if (error) throw error;
  return data ?? [];
}

export async function createPressRelease(
  client: SupabaseClient,
  pr: HubPressReleaseInsert
): Promise<HubPressRelease> {
  const { data, error } = await client.from(PRESS_TABLE).insert(pr).select().single();
  if (error) throw error;
  return data;
}

export async function updatePressRelease(
  client: SupabaseClient,
  id: string,
  updates: HubPressReleaseUpdate
): Promise<HubPressRelease> {
  const { data, error } = await client
    .from(PRESS_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// ─── Influencers ────────────────────────────────────────────────────────

const INFLUENCER_TABLE = "hub_influencers";

export async function listInfluencers(
  client: SupabaseClient,
  filters?: MarketingOpsFilters & { tier?: string }
): Promise<HubInfluencer[]> {
  let query = client.from(INFLUENCER_TABLE).select("*");
  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.tier) query = query.eq("tier", filters.tier);

  const { data, error } = await query.order("fit_score", { ascending: false, nullsFirst: false }).limit(filters?.limit ?? 50);
  if (error) throw error;
  return data ?? [];
}

export async function createInfluencer(
  client: SupabaseClient,
  influencer: HubInfluencerInsert
): Promise<HubInfluencer> {
  const { data, error } = await client.from(INFLUENCER_TABLE).insert(influencer).select().single();
  if (error) throw error;
  return data;
}

export async function updateInfluencer(
  client: SupabaseClient,
  id: string,
  updates: HubInfluencerUpdate
): Promise<HubInfluencer> {
  const { data, error } = await client
    .from(INFLUENCER_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInfluencer(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from(INFLUENCER_TABLE).delete().eq("id", id);
  if (error) throw error;
}

// ─── Influencer Interactions ────────────────────────────────────────────

const INTERACTION_TABLE = "hub_influencer_interactions";

export async function listInfluencerInteractions(
  client: SupabaseClient,
  influencerId: string
): Promise<HubInfluencerInteraction[]> {
  const { data, error } = await client
    .from(INTERACTION_TABLE)
    .select("*")
    .eq("influencer_id", influencerId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInfluencerInteraction(
  client: SupabaseClient,
  interaction: HubInfluencerInteractionInsert
): Promise<HubInfluencerInteraction> {
  const { data, error } = await client.from(INTERACTION_TABLE).insert(interaction).select().single();
  if (error) throw error;
  return data;
}

// ─── Podcasts ───────────────────────────────────────────────────────────

const PODCAST_TABLE = "hub_podcasts";

export async function listPodcasts(
  client: SupabaseClient,
  filters?: MarketingOpsFilters
): Promise<HubPodcast[]> {
  let query = client.from(PODCAST_TABLE).select("*");
  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(filters?.limit ?? 50);
  if (error) throw error;
  return data ?? [];
}

export async function createPodcast(
  client: SupabaseClient,
  podcast: HubPodcastInsert
): Promise<HubPodcast> {
  const { data, error } = await client.from(PODCAST_TABLE).insert(podcast).select().single();
  if (error) throw error;
  return data;
}

export async function updatePodcast(
  client: SupabaseClient,
  id: string,
  updates: HubPodcastUpdate
): Promise<HubPodcast> {
  const { data, error } = await client
    .from(PODCAST_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// ─── Research Studies ───────────────────────────────────────────────────

const RESEARCH_TABLE = "hub_research_studies";

export async function listResearchStudies(
  client: SupabaseClient,
  filters?: MarketingOpsFilters
): Promise<HubResearchStudy[]> {
  let query = client.from(RESEARCH_TABLE).select("*");
  if (filters?.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(filters?.limit ?? 50);
  if (error) throw error;
  return data ?? [];
}

export async function createResearchStudy(
  client: SupabaseClient,
  study: HubResearchStudyInsert
): Promise<HubResearchStudy> {
  const { data, error } = await client.from(RESEARCH_TABLE).insert(study).select().single();
  if (error) throw error;
  return data;
}

export async function updateResearchStudy(
  client: SupabaseClient,
  id: string,
  updates: HubResearchStudyUpdate
): Promise<HubResearchStudy> {
  const { data, error } = await client
    .from(RESEARCH_TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}
