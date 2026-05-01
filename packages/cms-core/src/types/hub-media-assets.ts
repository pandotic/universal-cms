// ─── Hub Media Assets Types ───────────────────────────────────────────────
// Generated media (images, video) produced for hub_content_pipeline items
// by the Multimedia Content Engine via Anthropic Managed Agents.

export type MediaAssetType = "hero" | "pillar" | "social_li" | "social_x" | "video";

export type MediaProvider = "gemini" | "heygen";

export type MediaStatus = "pending" | "generating" | "ready" | "failed";

export interface HubMediaAsset {
  id: string;
  pipeline_id: string;
  asset_type: MediaAssetType;
  url: string;
  prompt: string | null;
  prompts_json: Record<string, unknown> | null;
  provider: MediaProvider;
  regen_count: number;
  created_at: string;
  updated_at: string;
}

export type HubMediaAssetInsert = Omit<
  HubMediaAsset,
  "id" | "created_at" | "updated_at" | "regen_count"
> & {
  regen_count?: number;
};

export type HubMediaAssetUpdate = Partial<
  Omit<HubMediaAsset, "id" | "pipeline_id" | "created_at">
>;

export interface MediaAssetFilters {
  pipelineId?: string;
  assetType?: MediaAssetType;
  provider?: MediaProvider;
}

export interface SyncApprovedMediaResult {
  synced: number;
  skipped: number;
  errors: Array<{ pipeline_id: string; error: string }>;
}
