// ─── Brand Setup Checklist Types ──────────────────────────────────────────
// One-time setup tasks per brand (claim profiles, create accounts, etc.).
// Separate from recurring agent work.

export type SetupCategory =
  | "social_profiles"
  | "directories"
  | "review_sites"
  | "email_platform"
  | "analytics"
  | "legal"
  | "brand_identity"
  | "press_kit"
  | "other";

export type SetupStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "blocked";

export type ExecutionMode = "automated" | "semi_automated" | "manual";

export interface HubBrandSetupTask {
  id: string;
  property_id: string;
  category: SetupCategory;
  task_name: string;
  platform: string | null;
  tier: "tier_1" | "tier_2" | "tier_3" | null;
  status: SetupStatus;
  execution_mode: ExecutionMode | null;
  completed_at: string | null;
  completed_by: string | null;
  result_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type HubBrandSetupTaskInsert = Omit<
  HubBrandSetupTask,
  "id" | "created_at" | "updated_at"
>;

export type HubBrandSetupTaskUpdate = Partial<
  Omit<HubBrandSetupTask, "id" | "property_id" | "created_at">
>;

export interface SetupTaskFilters {
  propertyId?: string;
  category?: SetupCategory;
  status?: SetupStatus;
  tier?: string;
  limit?: number;
  offset?: number;
}

export interface SetupProgress {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  skipped: number;
  blocked: number;
  byCategory: Record<string, { total: number; completed: number }>;
}
