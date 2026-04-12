// ─── Built-in Marketing Skill Templates ───────────────────────────────────
// Pre-configured skill templates the fleet manager can deploy with one click.
// Each template provides sensible defaults and a config schema.

import type { MarketingSkillTemplate } from "../../types/index";

// ─── SEO Audit ────────────────────────────────────────────────────────────

export const seoAudit: MarketingSkillTemplate = {
  name: "SEO Site Audit",
  slug: "seo-site-audit",
  description:
    "Crawls the site and reports on meta tags, broken links, page speed, structured data, and indexability issues.",
  platform: "seo",
  category: "analytics",
  execution_mode: "scheduled",
  default_config: {
    max_pages: 500,
    check_broken_links: true,
    check_meta_tags: true,
    check_structured_data: true,
    check_page_speed: true,
    check_mobile_friendly: true,
  },
  config_schema: {
    type: "object",
    properties: {
      max_pages: { type: "number", minimum: 1, maximum: 10000, default: 500 },
      check_broken_links: { type: "boolean", default: true },
      check_meta_tags: { type: "boolean", default: true },
      check_structured_data: { type: "boolean", default: true },
      check_page_speed: { type: "boolean", default: true },
      check_mobile_friendly: { type: "boolean", default: true },
    },
  },
  default_schedule: "0 3 * * 1", // Weekly Monday 3 AM
  tags: ["seo", "audit", "technical"],
};

// ─── Google Ads Performance ───────────────────────────────────────────────

export const googleAdsPerformance: MarketingSkillTemplate = {
  name: "Google Ads Performance Report",
  slug: "google-ads-performance",
  description:
    "Pulls campaign metrics from Google Ads and generates a performance summary with spend, CPC, conversions, and ROAS.",
  platform: "google_ads",
  category: "analytics",
  execution_mode: "scheduled",
  default_config: {
    lookback_days: 7,
    include_campaigns: true,
    include_ad_groups: true,
    include_keywords: true,
    alert_cpc_threshold: null,
    alert_roas_threshold: null,
  },
  config_schema: {
    type: "object",
    properties: {
      lookback_days: { type: "number", minimum: 1, maximum: 90, default: 7 },
      include_campaigns: { type: "boolean", default: true },
      include_ad_groups: { type: "boolean", default: true },
      include_keywords: { type: "boolean", default: true },
      alert_cpc_threshold: { type: ["number", "null"], default: null },
      alert_roas_threshold: { type: ["number", "null"], default: null },
    },
  },
  default_schedule: "0 8 * * 1", // Weekly Monday 8 AM
  tags: ["google-ads", "ppc", "reporting"],
};

// ─── Meta Ads Performance ─────────────────────────────────────────────────

export const metaAdsPerformance: MarketingSkillTemplate = {
  name: "Meta Ads Performance Report",
  slug: "meta-ads-performance",
  description:
    "Pulls campaign metrics from Meta Ads (Facebook/Instagram) and generates a performance summary.",
  platform: "meta_ads",
  category: "analytics",
  execution_mode: "scheduled",
  default_config: {
    lookback_days: 7,
    include_campaigns: true,
    include_ad_sets: true,
    include_ads: false,
    platforms: ["facebook", "instagram"],
  },
  config_schema: {
    type: "object",
    properties: {
      lookback_days: { type: "number", minimum: 1, maximum: 90, default: 7 },
      include_campaigns: { type: "boolean", default: true },
      include_ad_sets: { type: "boolean", default: true },
      include_ads: { type: "boolean", default: false },
      platforms: {
        type: "array",
        items: { type: "string", enum: ["facebook", "instagram", "messenger", "audience_network"] },
        default: ["facebook", "instagram"],
      },
    },
  },
  default_schedule: "0 8 * * 1", // Weekly Monday 8 AM
  tags: ["meta-ads", "facebook", "instagram", "reporting"],
};

// ─── Social Content Scheduler ─────────────────────────────────────────────

export const socialContentScheduler: MarketingSkillTemplate = {
  name: "Social Content Scheduler",
  slug: "social-content-scheduler",
  description:
    "Queues and publishes approved social content from the Hub to social platforms on a schedule.",
  platform: "social_organic",
  category: "content_creation",
  execution_mode: "scheduled",
  default_config: {
    platforms: ["twitter", "linkedin"],
    max_posts_per_run: 5,
    only_approved: true,
    timezone: "America/New_York",
  },
  config_schema: {
    type: "object",
    properties: {
      platforms: {
        type: "array",
        items: { type: "string", enum: ["twitter", "linkedin", "instagram", "facebook"] },
      },
      max_posts_per_run: { type: "number", minimum: 1, maximum: 50, default: 5 },
      only_approved: { type: "boolean", default: true },
      timezone: { type: "string", default: "America/New_York" },
    },
  },
  default_schedule: "0 9,12,17 * * 1-5", // Weekdays 9 AM, noon, 5 PM
  tags: ["social", "content", "scheduling"],
};

// ─── Email Campaign Digest ────────────────────────────────────────────────

export const emailCampaignDigest: MarketingSkillTemplate = {
  name: "Email Campaign Digest",
  slug: "email-campaign-digest",
  description:
    "Compiles email campaign metrics (open rate, CTR, unsubscribes) into a weekly digest per property.",
  platform: "email",
  category: "analytics",
  execution_mode: "scheduled",
  default_config: {
    lookback_days: 7,
    include_automations: true,
    include_campaigns: true,
    alert_unsubscribe_threshold: 2.0,
  },
  config_schema: {
    type: "object",
    properties: {
      lookback_days: { type: "number", minimum: 1, maximum: 90, default: 7 },
      include_automations: { type: "boolean", default: true },
      include_campaigns: { type: "boolean", default: true },
      alert_unsubscribe_threshold: { type: "number", minimum: 0, default: 2.0 },
    },
  },
  default_schedule: "0 9 * * 1", // Weekly Monday 9 AM
  tags: ["email", "digest", "reporting"],
};

// ─── Content Freshness Check ──────────────────────────────────────────────

export const contentFreshnessCheck: MarketingSkillTemplate = {
  name: "Content Freshness Check",
  slug: "content-freshness-check",
  description:
    "Scans published content for stale pages that haven't been updated in a configurable period and flags them for review.",
  platform: "content",
  category: "content_creation",
  execution_mode: "scheduled",
  default_config: {
    stale_threshold_days: 90,
    include_blog: true,
    include_landing_pages: true,
    exclude_paths: ["/legal/", "/terms/"],
  },
  config_schema: {
    type: "object",
    properties: {
      stale_threshold_days: { type: "number", minimum: 7, maximum: 365, default: 90 },
      include_blog: { type: "boolean", default: true },
      include_landing_pages: { type: "boolean", default: true },
      exclude_paths: { type: "array", items: { type: "string" }, default: [] },
    },
  },
  default_schedule: "0 6 1 * *", // Monthly 1st at 6 AM
  tags: ["content", "freshness", "audit"],
};

// ─── LinkedIn Post Generator ──────────────────────────────────────────────

export const linkedinPostGenerator: MarketingSkillTemplate = {
  name: "LinkedIn Post Generator",
  slug: "linkedin-post-generator",
  description:
    "Uses AI to generate LinkedIn posts from recent blog content or product updates, following brand voice guidelines.",
  platform: "linkedin",
  category: "content_creation",
  execution_mode: "manual",
  default_config: {
    source: "blog", // "blog" | "product_updates" | "custom"
    tone: "professional",
    max_length: 1300,
    include_hashtags: true,
    hashtag_count: 5,
  },
  config_schema: {
    type: "object",
    properties: {
      source: { type: "string", enum: ["blog", "product_updates", "custom"], default: "blog" },
      tone: { type: "string", enum: ["professional", "casual", "thought_leader"], default: "professional" },
      max_length: { type: "number", minimum: 100, maximum: 3000, default: 1300 },
      include_hashtags: { type: "boolean", default: true },
      hashtag_count: { type: "number", minimum: 0, maximum: 30, default: 5 },
    },
  },
  default_schedule: null, // Manual
  tags: ["linkedin", "ai", "content-generation"],
};

// ─── Cross-Platform Analytics Rollup ──────────────────────────────────────

export const crossPlatformRollup: MarketingSkillTemplate = {
  name: "Cross-Platform Analytics Rollup",
  slug: "cross-platform-analytics-rollup",
  description:
    "Aggregates analytics from Google Analytics, ad platforms, and email into a unified marketing dashboard per property.",
  platform: "cross_platform",
  category: "analytics",
  execution_mode: "scheduled",
  default_config: {
    lookback_days: 7,
    sources: ["google_analytics", "google_ads", "meta_ads", "email"],
    include_attribution: true,
  },
  config_schema: {
    type: "object",
    properties: {
      lookback_days: { type: "number", minimum: 1, maximum: 90, default: 7 },
      sources: {
        type: "array",
        items: {
          type: "string",
          enum: ["google_analytics", "google_ads", "meta_ads", "linkedin_ads", "email", "social_organic"],
        },
      },
      include_attribution: { type: "boolean", default: true },
    },
  },
  default_schedule: "0 7 * * 1", // Weekly Monday 7 AM
  tags: ["analytics", "cross-platform", "rollup", "reporting"],
};

// ─── Template Registry ────────────────────────────────────────────────────

export const marketingSkillTemplates: MarketingSkillTemplate[] = [
  seoAudit,
  googleAdsPerformance,
  metaAdsPerformance,
  socialContentScheduler,
  emailCampaignDigest,
  contentFreshnessCheck,
  linkedinPostGenerator,
  crossPlatformRollup,
];

export function getTemplateBySlug(slug: string): MarketingSkillTemplate | undefined {
  return marketingSkillTemplates.find((t) => t.slug === slug);
}
