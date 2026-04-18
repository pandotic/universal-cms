// ─── Social Content Management Types ──────────────────────────────────────
// Brand voice briefs and social media content management for Pandotic Hub.
// Enables multi-platform content strategy and publishing workflows.

export type SocialPlatform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "other";

export type SocialContentType = "post" | "thread" | "story" | "reel" | "article";

export type SocialContentStatus =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "archived";

// ─── Brand Voice Briefs ────────────────────────────────────────────────────

export interface BrandVoiceBrief {
  id: string;
  property_id: string;
  name: string;
  platform: string; // Primary platform focus (e.g., "Twitter/LinkedIn strategy")
  tone: string[]; // e.g., ["professional", "friendly", "authoritative"]
  audience: string; // Target audience description
  key_messages: string[]; // Core messaging pillars
  dos: string[]; // What to do
  donts: string[]; // What to avoid
  example_posts: Record<string, unknown> | null; // {"twitter": [...], "linkedin": [...]}
  metadata: Record<string, unknown>;
  // Voice modeling extensions
  voice_attributes: string[];
  tone_variations: Record<string, unknown>;
  vocabulary: Record<string, unknown>;
  sentence_patterns: Record<string, unknown>;
  anti_examples: Record<string, unknown>[];
  humor_guidelines: string | null;
  corrections_journal: Record<string, unknown>[];
  // Visual identity
  primary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  font_family: string | null;
  photo_style_guide: string | null;
  photo_mood_keywords: string[] | null;
  use_ai_generation: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type BrandVoiceBriefInsert = Omit<
  BrandVoiceBrief,
  | "id"
  | "created_at"
  | "updated_at"
  | "voice_attributes"
  | "tone_variations"
  | "vocabulary"
  | "sentence_patterns"
  | "anti_examples"
  | "humor_guidelines"
  | "corrections_journal"
  | "primary_color"
  | "accent_color"
  | "logo_url"
  | "font_family"
  | "photo_style_guide"
  | "photo_mood_keywords"
  | "use_ai_generation"
> & {
  voice_attributes?: string[];
  tone_variations?: Record<string, unknown>;
  vocabulary?: Record<string, unknown>;
  sentence_patterns?: Record<string, unknown>;
  anti_examples?: Record<string, unknown>[];
  humor_guidelines?: string | null;
  corrections_journal?: Record<string, unknown>[];
  primary_color?: string | null;
  accent_color?: string | null;
  logo_url?: string | null;
  font_family?: string | null;
  photo_style_guide?: string | null;
  photo_mood_keywords?: string[] | null;
  use_ai_generation?: boolean;
};

export type BrandVoiceBriefUpdate = Partial<
  Omit<BrandVoiceBrief, "id" | "property_id" | "created_by" | "created_at">
>;

// ─── Social Content Items ──────────────────────────────────────────────────

export interface SocialContentItem {
  id: string;
  property_id: string;
  brief_id: string | null;
  platform: SocialPlatform;
  content_type: SocialContentType;
  title: string | null;
  body: string;
  media_urls: string[];
  hashtags: string[];
  status: SocialContentStatus;
  scheduled_for: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type SocialContentItemInsert = Omit<
  SocialContentItem,
  "id" | "created_at" | "updated_at"
>;

export type SocialContentItemUpdate = Partial<
  Omit<SocialContentItem, "id" | "property_id" | "created_by" | "created_at">
>;

// ─── Filters & Queries ─────────────────────────────────────────────────────

export interface BrandVoiceBriefFilters {
  propertyId?: string;
  name?: string;
  limit?: number;
  offset?: number;
}

export interface SocialContentFilters {
  propertyId?: string;
  briefId?: string;
  platform?: SocialPlatform;
  contentType?: SocialContentType;
  status?: SocialContentStatus;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

export interface SocialContentStats {
  totalByStatus: Record<SocialContentStatus, number>;
  totalByPlatform: Record<SocialPlatform, number>;
  publishedCount: number;
  scheduledCount: number;
  lastPublishedAt: string | null;
}
