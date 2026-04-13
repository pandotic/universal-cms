// ─── Skill Library Types ──────────────────────────────────────────────────
// Types for the Pandotic Skill Library — skill definitions, deployments,
// fleet-wide scheduled execution, and site-level PR deployment.

// ─── Skill Scope ──────────────────────────────────────────────────────────

/** Where a skill lives and executes */
export type SkillScope = "fleet" | "site" | "both";

// ─── Skill Platforms ──────────────────────────────────────────────────────

/** Platform a skill targets */
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
  | "cross_platform"
  | "claude_code";

/** Category of skill */
export type SkillCategory =
  | "acquisition"
  | "retention"
  | "engagement"
  | "analytics"
  | "content_creation"
  | "brand_management"
  | "automation"
  | "documents"
  | "ai_automation"
  | "developer_tools"
  | "ui_components"
  | "knowledge_base";

// ─── Skill Definition ─────────────────────────────────────────────────────

/** Execution mode: how the skill runs */
export type SkillExecutionMode = "scheduled" | "manual" | "webhook" | "event";

/** Current status of a skill definition */
export type SkillStatus = "draft" | "active" | "paused" | "archived";

/** A reusable skill definition — fleet-level marketing or site-level implementation */
export interface SkillDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  platform: SkillPlatform;
  category: SkillCategory;
  execution_mode: SkillExecutionMode;
  scope: SkillScope;
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
  /** For site skills: path to SKILL.md content relative to skill-library root */
  content_path: string | null;
  /** For site skills: companion component IDs (e.g. ui-kit has modal, card, etc.) */
  component_ids: string[];
  /** Links this DB record to a flat-file manifest entry */
  manifest_id: string | null;
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
  /** Version deployed to this property */
  deployed_version: string;
  /** Latest version available in the skill library */
  current_version: string;
  /** If true, don't auto-update this deployment */
  pinned: boolean;
  /** GitHub PR URL that deployed/updated this skill */
  github_pr_url: string | null;
  /** Target GitHub repo (owner/name) for site-level deployments */
  github_repo: string | null;
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

// ─── Manifest Skill ───────────────────────────────────────────────────────
// Represents a skill from the flat-file manifest (skills-manifest.json).
// These are the source-of-truth definitions that live as SKILL.md files.

/** A skill entry from the flat-file manifest */
export interface ManifestSkill {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  triggers: string[];
  version: string;
  author: string;
  path: string;
  components?: string[];
  /** Added at sync time — not in the original manifest */
  scope?: SkillScope;
}

/** A knowledgebase entry from the flat-file manifest */
export interface ManifestKnowledgebase {
  id: string;
  name: string;
  icon: string;
  category: string;
  domain: string;
  description: string;
  triggers: string[];
  version: string;
  author: string;
  path: string;
  type: "knowledgebase";
}

// ─── Skill Version ────────────────────────────────────────────────────────

/** A version record tracking changes to a skill over time */
export interface SkillVersion {
  id: string;
  skill_id: string;
  version: string;
  changelog: string | null;
  /** SHA-256 hash of the SKILL.md content at this version */
  content_hash: string;
  created_at: string;
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
  scope?: SkillScope;
  tags?: string[];
  search?: string;
}

export interface DeploymentMatrixFilters {
  groupId?: string;
  scope?: SkillScope;
  category?: SkillCategory;
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
