// ─── QA & Auto-Pilot Types ────────────────────────────────────────────────
// Content QA reviews, auto-pilot settings, and learning log for the
// Skeptical Reviewer and auto-pilot system.

export type QAReviewStatus = "passed" | "flagged" | "failed";

export type QALearningOutcome =
  | "human_agreed"
  | "human_overrode"
  | "false_positive"
  | "false_negative";

export interface HubContentQAReview {
  id: string;
  content_id: string;
  content_table: string;
  reviewer_agent: string;
  overall_confidence: number | null;
  status: QAReviewStatus | null;
  checks: Record<string, unknown> | null;
  suggested_fixes: string[];
  human_override: boolean;
  override_reason: string | null;
  created_at: string;
}

export type HubContentQAReviewInsert = Omit<
  HubContentQAReview,
  "id" | "created_at"
>;

export interface HubAutoPilotSettings {
  property_id: string;
  content_type: string;
  auto_pilot_enabled: boolean;
  confidence_threshold: number;
  trust_score: number;
  max_per_day: number | null;
  created_at: string;
  updated_at: string;
}

export type HubAutoPilotSettingsUpsert = Omit<
  HubAutoPilotSettings,
  "created_at" | "updated_at"
>;

export interface HubQALearningLog {
  id: string;
  property_id: string | null;
  check_type: string | null;
  outcome: QALearningOutcome | null;
  human_feedback: string | null;
  created_at: string;
}

export type HubQALearningLogInsert = Omit<
  HubQALearningLog,
  "id" | "created_at"
>;
