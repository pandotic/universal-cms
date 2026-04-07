// ─── Generic CMS Types ──────────────────────────────────────────────────────
// Shared across all sites that use @pandotic/universal-cms.
// Domain-specific types (Entity, Category, Framework, etc.) stay in consuming projects.

// ─── SEO ────────────────────────────────────────────────────────────────────

export interface SEOMeta {
  title: string;
  description: string; // Max 160 chars
  ogImage?: string;
  keywords?: string[];
  canonicalPath?: string;
}

export type Slug = string; // Lowercase, hyphen-separated

// ─── Content Pages ──────────────────────────────────────────────────────────

export type PageType = "article" | "guide" | "landing" | "custom";
export type PageStatus = "draft" | "published" | "archived";

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  page_type: PageType;
  body: string | null;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  status: PageStatus;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Media ──────────────────────────────────────────────────────────────────

export interface MediaItem {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

export interface Review {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  display_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  multi_ratings: Record<string, number>;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Site Settings ──────────────────────────────────────────────────────────

export interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  group_name: string;
  updated_by: string | null;
  updated_at: string;
}

// ─── Activity Log ───────────────────────────────────────────────────────────

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "archive"
  | "login"
  | "bulk_import";

export interface ActivityLogEntry {
  id: string;
  user_id: string | null;
  action: ActivityAction;
  entity_type: string;
  entity_id: string | null;
  entity_title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Ratings (third-party review aggregation) ───────────────────────────────

export type ReviewSourceName =
  | "capterra"
  | "g2"
  | "getapp"
  | "software-advice"
  | "trustpilot"
  | "apple-app-store"
  | "google-play-store"
  | "gartner-peer-insights";

export type TrendDirection = "up" | "down" | "flat";

export interface SourceMetrics {
  current_score: number;
  total_reviews: number;
  score_delta: number | null;
  review_velocity: number | null;
  trend_direction: TrendDirection;
  url: string;
}

export interface EntityRatings {
  platform_slug: string;
  last_updated: string;
  aggregate_metrics: Partial<Record<ReviewSourceName, SourceMetrics>>;
}

// ─── Analytics Provider Config ──────────────────────────────────────────────

export interface AnalyticsProviderConfig {
  provider: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

// ─── Error Log ──────────────────────────────────────────────────────────────

export interface ErrorLogEntry {
  id: string;
  error_type: string;
  message: string;
  stack_trace: string | null;
  url: string | null;
  user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
