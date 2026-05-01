// ─── Content Pipeline Types ───────────────────────────────────────────────
// Unified content pipeline: social, blog, email, press, and all content types
// flow through a single pipeline with channel-based filtering.

export type ContentChannel =
  | "social"
  | "blog"
  | "email"
  | "press"
  | "featured_pitch"
  | "newsletter"
  | "landing_page"
  | "case_study"
  | "guest_post";

export type ContentPipelineStatus =
  | "draft"
  | "drafted"
  | "qa_review"
  | "review"
  | "needs_human_review"
  | "revision_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

export interface HubContentPipelineItem {
  id: string;
  property_id: string;
  brief_id: string | null;
  channel: ContentChannel;
  platform: string | null;
  content_type: string | null;
  title: string | null;
  body: string;
  excerpt: string | null;
  media_urls: string[];
  hashtags: string[];
  status: ContentPipelineStatus;
  drafted_by_agent: string | null;
  qa_confidence: number | null;
  source_content_id: string | null;
  published_url: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
  // Media engine additions (00522)
  synced_at: string | null;
  media_status: import("./hub-media-assets").MediaStatus | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type HubContentPipelineItemInsert = Omit<
  HubContentPipelineItem,
  "id" | "created_at" | "updated_at"
>;

export type HubContentPipelineItemUpdate = Partial<
  Omit<HubContentPipelineItem, "id" | "property_id" | "created_by" | "created_at">
>;

export interface ContentPipelineFilters {
  propertyId?: string;
  channel?: ContentChannel;
  platform?: string;
  status?: ContentPipelineStatus;
  draftedByAgent?: string;
  briefId?: string;
  limit?: number;
  offset?: number;
}

export interface ContentPipelineStats {
  totalByStatus: Record<string, number>;
  totalByChannel: Record<string, number>;
  publishedCount: number;
  scheduledCount: number;
  pendingReviewCount: number;
  lastPublishedAt: string | null;
}
