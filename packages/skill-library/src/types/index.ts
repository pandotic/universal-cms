// ─── Skill Library Types ──────────────────────────────────────────────────
// Types for the Pandotic Skill Library — marketing skill definitions,
// deployments, and fleet-wide scheduled execution.

// ─── Skill Platforms ──────────────────────────────────────────────────────

/** Marketing platform a skill targets */
export type SkillPlatform =
  | "google_ads"
  | "meta_ads"
  | "linkedin"
  | "twitter"
  | "tiktok"
  | "email"
  | "seo"
  | "analytics"
  | "content"
  | "social_organic"
  | "cross_platform";

/** Category of marketing skill */
export type SkillCategory =
  | "acquisition"
  | "retention"
  | "engagement"
  | "analytics"
  | "content_creation"
  | "brand_management"
  | "automation";

// ─── Skill Definition ─────────────────────────────────────────────────────

/** Execution mode: how the skill runs */
export type SkillExecutionMode = "scheduled" | "manual" | "webhook" | "event";

/** Current status of a skill definition */
export type SkillStatus = "draft" | "active" | "paused" | "archived";

/** A reusable marketing skill definition */
export interface SkillDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  platform: SkillPlatform;
  category: SkillCategory;
  execution_mode: SkillExecutionMode;
  /** Default config template — deployments can override */
  default_config: Record<string, unknown>;
  /** JSON schema for config validation */
  config_schema: Record<string, unknown> | null;
  /** Cron expression for scheduled skills */
  default_schedule: string | null;
  status: SkillStatus;
  /** Version string (semver) */
  version: string;
  /** Tags for filtering/search */
  tags: string[];
  /** Who created this skill definition */
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SkillDefinitionInsert = Omit<
  SkillDefinition,
  "id" | "created_at" | "updated_at" | "version"
> & {
  version?: string;
};

export type SkillDefinitionUpdate = Partial<
  Omit<SkillDefinition, "id" | "created_at" | "updated_at">
>;

// ─── Skill Deployment ─────────────────────────────────────────────────────
// A deployment is a skill definition applied to a specific property.
// The fleet manager deploys skills to sites (CMS or WordPress) on a schedule.

/** Target platform type — what kind of site is this deployed to? */
export type DeployTargetType = "universal_cms" | "wordpress" | "static" | "custom";

/** Deployment status */
export type DeploymentStatus = "pending" | "active" | "paused" | "failed" | "removed";

/** A skill deployed to a specific property */
export interface SkillDeployment {
  id: string;
  skill_id: string;
  /** FK to hub_properties — which site/app this is deployed to */
  property_id: string;
  /** Override the skill's default config for this property */
  config_overrides: Record<string, unknown>;
  /** Override the default schedule for this property */
  schedule: string | null;
  /** What kind of site is the target? */
  target_type: DeployTargetType;
  status: DeploymentStatus;
  /** Last time this deployment executed */
  last_run_at: string | null;
  /** Result of the last execution */
  last_run_status: DeploymentRunStatus | null;
  /** Who deployed this */
  deployed_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SkillDeploymentInsert = Omit<
  SkillDeployment,
  "id" | "created_at" | "updated_at" | "last_run_at" | "last_run_status"
> & {
  last_run_at?: string | null;
  last_run_status?: DeploymentRunStatus | null;
};

export type SkillDeploymentUpdate = Partial<
  Omit<SkillDeployment, "id" | "skill_id" | "property_id" | "created_at" | "updated_at">
>;

// ─── Deployment Runs ──────────────────────────────────────────────────────

/** Run status for a single execution */
export type DeploymentRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

/** Trigger type for a run */
export type RunTrigger = "schedule" | "manual" | "webhook" | "event";

/** A single execution record of a deployed skill */
export interface SkillDeploymentRun {
  id: string;
  deployment_id: string;
  skill_id: string;
  property_id: string;
  status: DeploymentRunStatus;
  triggered_by: RunTrigger;
  /** Effective config used for this run (merged default + overrides) */
  effective_config: Record<string, unknown>;
  /** Structured result data */
  result: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export type SkillDeploymentRunInsert = Omit<
  SkillDeploymentRun,
  "id" | "created_at" | "started_at" | "completed_at" | "result" | "error_message"
> & {
  started_at?: string | null;
  completed_at?: string | null;
  result?: Record<string, unknown> | null;
  error_message?: string | null;
};

export type SkillDeploymentRunUpdate = Partial<
  Omit<SkillDeploymentRun, "id" | "deployment_id" | "skill_id" | "property_id" | "created_at">
>;

// ─── Deploy Adapter ───────────────────────────────────────────────────────

/** Interface for platform-specific deploy adapters */
export interface DeployAdapter {
  targetType: DeployTargetType;
  /** Execute a skill against the target property */
  execute(context: DeployContext): Promise<DeployResult>;
  /** Validate that this adapter can reach the target */
  validate(context: DeployContext): Promise<boolean>;
}

export interface DeployContext {
  skill: SkillDefinition;
  deployment: SkillDeployment;
  property: {
    id: string;
    name: string;
    url: string;
    metadata: Record<string, unknown>;
  };
  /** Merged config (default + overrides) */
  config: Record<string, unknown>;
}

export interface DeployResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  /** Metrics from the execution */
  metrics?: {
    duration_ms: number;
    [key: string]: unknown;
  };
}

// ─── Marketing Skill Template ─────────────────────────────────────────────

/** A built-in marketing skill template with sensible defaults */
export interface MarketingSkillTemplate {
  name: string;
  slug: string;
  description: string;
  platform: SkillPlatform;
  category: SkillCategory;
  execution_mode: SkillExecutionMode;
  default_config: Record<string, unknown>;
  config_schema: Record<string, unknown>;
  default_schedule: string | null;
  tags: string[];
}

// ─── Filters ──────────────────────────────────────────────────────────────

export interface SkillFilters {
  platform?: SkillPlatform;
  category?: SkillCategory;
  status?: SkillStatus;
  tags?: string[];
  search?: string;
}

export interface DeploymentFilters {
  skillId?: string;
  propertyId?: string;
  status?: DeploymentStatus;
  targetType?: DeployTargetType;
}

export interface RunFilters {
  deploymentId?: string;
  skillId?: string;
  propertyId?: string;
  status?: DeploymentRunStatus;
  triggeredBy?: RunTrigger;
  limit?: number;
  offset?: number;
}
