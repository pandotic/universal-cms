// ─── Admin Schema Types ────────────────────────────────────────────────────────
// Platform administration, user roles, organizations, modules, and health monitoring.
// Used exclusively by the Pandotic Hub (fleet-dashboard).

// ─── User Profiles & Settings ──────────────────────────────────────────────────

export type AdminUserRole = "super_admin" | "group_admin" | "member" | "viewer";

export type UserStatus = "active" | "invited" | "suspended" | "inactive";

export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  phone: string | null;
  timezone: string; // IANA timezone
  language: string; // ISO 639-1 code
  status: UserStatus;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role: AdminUserRole;
  scope: "platform" | "organization" | "group" | "property"; // Determines what ID applies
  scope_id: string | null; // Organization ID, Group ID, Property ID if scope is not platform
  granted_at: string;
  granted_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: "light" | "dark" | "auto";
  email_notifications: boolean;
  weekly_digest: boolean;
  marketing_emails: boolean;
  two_factor_enabled: boolean;
  session_timeout_minutes: number; // 15, 30, 60, 240 (4h), 1440 (24h)
  default_organization_id: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string; // e.g., "agent_run_failed", "property_down", "user_invited"
  channel: "email" | "in_app" | "slack";
  enabled: boolean;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  action_url: string | null;
  read_at: string | null;
  archived_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OnboardingChecklist {
  id: string;
  user_id: string;
  item_key: string; // e.g., "profile_complete", "first_property", "invite_team"
  completed_at: string | null;
  skipped_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Organizations ────────────────────────────────────────────────────────────

export type OrganizationStatus = "active" | "suspended" | "archived";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: "free" | "pro" | "enterprise";
  plan_expires_at: string | null;
  status: OrganizationStatus;
  owner_id: string;
  api_key_hash: string | null;
  webhook_url: string | null;
  webhook_secret_hash: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  invited_at: string;
  joined_at: string | null;
  created_at: string;
}

// ─── Platform Modules ─────────────────────────────────────────────────────────

export type ModuleType =
  | "analytics"
  | "seo"
  | "content"
  | "forms"
  | "reviews"
  | "social"
  | "agents"
  | "custom";

export type ModuleStatus = "active" | "beta" | "deprecated" | "disabled";

export interface PlatformModule {
  id: string;
  name: string;
  slug: string;
  description: string;
  module_type: ModuleType;
  status: ModuleStatus;
  icon_name: string; // lucide-react icon name
  documentation_url: string | null;
  version: string;
  min_plan: "free" | "pro" | "enterprise";
  requires_setup: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ModuleAccessControl {
  id: string;
  module_id: string;
  role: AdminUserRole;
  can_view: boolean;
  can_configure: boolean;
  can_delete: boolean;
  created_at: string;
}

export interface UserModuleAccess {
  id: string;
  user_id: string;
  organization_id: string;
  module_id: string;
  enabled: boolean;
  configured_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ModuleSettings {
  id: string;
  module_id: string;
  organization_id: string;
  key: string;
  value: Record<string, unknown>;
  updated_by: string | null;
  updated_at: string;
}

// ─── Admin Settings & Monitoring ───────────────────────────────────────────────

export interface AdminSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface AdminAuditLog {
  id: string;
  user_id: string | null;
  action: string; // e.g., "user_created", "role_changed", "module_disabled"
  resource_type: string; // e.g., "user", "organization", "module"
  resource_id: string | null;
  changes: Record<string, unknown>; // JSON of before/after values
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SystemHealthMetric {
  id: string;
  metric_name: string; // e.g., "api_response_time", "database_connections", "error_rate"
  value: number;
  unit: string; // e.g., "ms", "count", "percent"
  status: "normal" | "warning" | "critical";
  metadata: Record<string, unknown>;
  recorded_at: string;
}

export interface AdminAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  alert_type: string; // e.g., "rate_limit", "payment_failed", "security_issue"
  resource_id: string | null;
  resource_type: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number; // 0-100
  target_organizations: string[] | null; // Organization IDs, null = all
  target_users: string[] | null; // User IDs, null = all
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
