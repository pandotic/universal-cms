// ─── Marketing Operations Types ───────────────────────────────────────────
// Press releases, influencers, podcasts, and research studies.

// ─── Press Releases ─────────────────────────────────────────────────────

export interface HubPressRelease {
  id: string;
  property_id: string | null;
  title: string | null;
  body: string | null;
  status: string | null;
  distributed_via: string | null;
  distributed_at: string | null;
  pickup_count: number;
  pickup_urls: string[];
  created_at: string;
  updated_at: string;
}

export type HubPressReleaseInsert = Omit<
  HubPressRelease,
  "id" | "created_at" | "updated_at"
>;

export type HubPressReleaseUpdate = Partial<
  Omit<HubPressRelease, "id" | "created_at">
>;

// ─── Influencers ────────────────────────────────────────────────────────

export interface HubInfluencer {
  id: string;
  property_id: string | null;
  name: string | null;
  handle: string | null;
  platform: string | null;
  tier: "tier_1" | "tier_2" | "tier_3" | null;
  niche: string | null;
  audience_size: number | null;
  engagement_rate: number | null;
  fit_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type HubInfluencerInsert = Omit<
  HubInfluencer,
  "id" | "created_at" | "updated_at"
>;

export type HubInfluencerUpdate = Partial<
  Omit<HubInfluencer, "id" | "created_at">
>;

// ─── Influencer Interactions ────────────────────────────────────────────

export interface HubInfluencerInteraction {
  id: string;
  influencer_id: string;
  interaction_type: string | null;
  notes: string | null;
  occurred_at: string | null;
  created_at: string;
}

export type HubInfluencerInteractionInsert = Omit<
  HubInfluencerInteraction,
  "id" | "created_at"
>;

// ─── Podcasts ───────────────────────────────────────────────────────────

export interface HubPodcast {
  id: string;
  property_id: string | null;
  podcast_name: string | null;
  host_name: string | null;
  niche: string | null;
  audience_size: number | null;
  status: string | null;
  pitched_at: string | null;
  recorded_at: string | null;
  episode_url: string | null;
  created_at: string;
  updated_at: string;
}

export type HubPodcastInsert = Omit<
  HubPodcast,
  "id" | "created_at" | "updated_at"
>;

export type HubPodcastUpdate = Partial<
  Omit<HubPodcast, "id" | "created_at">
>;

// ─── Research Studies ───────────────────────────────────────────────────

export interface HubResearchStudy {
  id: string;
  property_id: string | null;
  title: string | null;
  type: string | null;
  status: string | null;
  data_source: string | null;
  published_url: string | null;
  created_at: string;
  updated_at: string;
}

export type HubResearchStudyInsert = Omit<
  HubResearchStudy,
  "id" | "created_at" | "updated_at"
>;

export type HubResearchStudyUpdate = Partial<
  Omit<HubResearchStudy, "id" | "created_at">
>;

// ─── Filters ────────────────────────────────────────────────────────────

export interface MarketingOpsFilters {
  propertyId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}
