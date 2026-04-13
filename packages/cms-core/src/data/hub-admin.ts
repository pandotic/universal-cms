import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UserProfile,
  UserRoleAssignment,
  UserSettings,
  NotificationPreference,
  Notification,
  OnboardingChecklist,
  Organization,
  OrganizationMember,
  PlatformModule,
  ModuleAccessControl,
  UserModuleAccess,
  ModuleSettings,
  AdminSetting,
  AdminAuditLog,
  SystemHealthMetric,
  AdminAlert,
  FeatureFlag,
  AdminUserRole,
  UserStatus,
} from "../types/admin";

// ─── User Profiles ─────────────────────────────────────────────────────────

export async function getUserProfile(
  client: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await client
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  client: SupabaseClient,
  userId: string,
  updates: Partial<
    Pick<
      UserProfile,
      | "display_name"
      | "avatar_url"
      | "phone"
      | "timezone"
      | "language"
      | "status"
    >
  >
): Promise<UserProfile> {
  const { data, error } = await client
    .from("user_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listUserProfiles(
  client: SupabaseClient,
  filters?: { status?: UserStatus; limit?: number; offset?: number }
): Promise<UserProfile[]> {
  let query = client.from("user_profiles").select("*");

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("display_name")
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

// ─── User Roles ────────────────────────────────────────────────────────────

export async function getUserRoles(
  client: SupabaseClient,
  userId: string
): Promise<UserRoleAssignment[]> {
  const { data, error } = await client
    .from("user_roles")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}

export async function assignUserRole(
  client: SupabaseClient,
  userId: string,
  role: AdminUserRole,
  scope: "platform" | "organization" | "group" | "property",
  scopeId: string | null = null
): Promise<UserRoleAssignment> {
  const { data, error } = await client
    .from("user_roles")
    .insert({
      user_id: userId,
      role,
      scope,
      scope_id: scopeId,
      granted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeUserRole(
  client: SupabaseClient,
  roleId: string
): Promise<void> {
  const { error } = await client.from("user_roles").delete().eq("id", roleId);

  if (error) throw error;
}

// ─── User Settings ────────────────────────────────────────────────────────

export async function getUserSettings(
  client: SupabaseClient,
  userId: string
): Promise<UserSettings | null> {
  const { data, error } = await client
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateUserSettings(
  client: SupabaseClient,
  userId: string,
  updates: Partial<
    Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">
  >
): Promise<UserSettings> {
  const { data, error } = await client
    .from("user_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Notification Preferences ──────────────────────────────────────────────

export async function getNotificationPreferences(
  client: SupabaseClient,
  userId: string
): Promise<NotificationPreference[]> {
  const { data, error } = await client
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}

export async function updateNotificationPreference(
  client: SupabaseClient,
  preferenceId: string,
  enabled: boolean
): Promise<NotificationPreference> {
  const { data, error } = await client
    .from("notification_preferences")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", preferenceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Notifications ────────────────────────────────────────────────────────

export async function listNotifications(
  client: SupabaseClient,
  userId: string,
  filters?: { unreadOnly?: boolean; limit?: number; offset?: number }
): Promise<Notification[]> {
  let query = client
    .from("notifications")
    .select("*")
    .eq("user_id", userId);

  if (filters?.unreadOnly) {
    query = query.is("read_at", null).is("archived_at", null);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

export async function markNotificationAsRead(
  client: SupabaseClient,
  notificationId: string
): Promise<Notification> {
  const { data, error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createNotification(
  client: SupabaseClient,
  notification: Omit<Notification, "id" | "created_at">
): Promise<Notification> {
  const { data, error } = await client
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Onboarding ────────────────────────────────────────────────────────────

export async function getOnboardingProgress(
  client: SupabaseClient,
  userId: string
): Promise<OnboardingChecklist[]> {
  const { data, error } = await client
    .from("onboarding_checklist")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}

export async function completeOnboardingItem(
  client: SupabaseClient,
  userId: string,
  itemKey: string
): Promise<OnboardingChecklist> {
  const { data, error } = await client
    .from("onboarding_checklist")
    .update({
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("item_key", itemKey)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Organizations ────────────────────────────────────────────────────────

export async function getOrganization(
  client: SupabaseClient,
  orgId: string
): Promise<Organization | null> {
  const { data, error } = await client
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listOrganizations(
  client: SupabaseClient
): Promise<Organization[]> {
  const { data, error } = await client
    .from("organizations")
    .select("*")
    .eq("status", "active");

  if (error) throw error;
  return data ?? [];
}

export async function updateOrganization(
  client: SupabaseClient,
  orgId: string,
  updates: Partial<
    Omit<Organization, "id" | "created_at" | "updated_at">
  >
): Promise<Organization> {
  const { data, error } = await client
    .from("organizations")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", orgId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Organization Members ──────────────────────────────────────────────────

export async function getOrganizationMembers(
  client: SupabaseClient,
  orgId: string
): Promise<OrganizationMember[]> {
  const { data, error } = await client
    .from("organization_members")
    .select("*")
    .eq("organization_id", orgId);

  if (error) throw error;
  return data ?? [];
}

export async function addOrganizationMember(
  client: SupabaseClient,
  orgId: string,
  userId: string,
  role: "owner" | "admin" | "member" | "viewer"
): Promise<OrganizationMember> {
  const { data, error } = await client
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: userId,
      role,
      invited_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Platform Modules ──────────────────────────────────────────────────────

export async function listPlatformModules(
  client: SupabaseClient
): Promise<PlatformModule[]> {
  const { data, error } = await client
    .from("platform_modules")
    .select("*")
    .eq("status", "active")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getPlatformModule(
  client: SupabaseClient,
  moduleId: string
): Promise<PlatformModule | null> {
  const { data, error } = await client
    .from("platform_modules")
    .select("*")
    .eq("id", moduleId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ─── User Module Access ────────────────────────────────────────────────────

export async function getUserModuleAccess(
  client: SupabaseClient,
  userId: string,
  orgId: string
): Promise<UserModuleAccess[]> {
  const { data, error } = await client
    .from("user_module_access")
    .select("*")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .eq("enabled", true);

  if (error) throw error;
  return data ?? [];
}

export async function enableModuleForUser(
  client: SupabaseClient,
  userId: string,
  orgId: string,
  moduleId: string
): Promise<UserModuleAccess> {
  const { data, error } = await client
    .from("user_module_access")
    .insert({
      user_id: userId,
      organization_id: orgId,
      module_id: moduleId,
      enabled: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Admin Audit Log ────────────────────────────────────────────────────────

export async function createAuditLog(
  client: SupabaseClient,
  log: Omit<AdminAuditLog, "id" | "created_at">
): Promise<AdminAuditLog> {
  const { data, error } = await client
    .from("admin_audit_log")
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listAuditLogs(
  client: SupabaseClient,
  filters?: {
    resourceType?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }
): Promise<AdminAuditLog[]> {
  let query = client.from("admin_audit_log").select("*");

  if (filters?.resourceType) {
    query = query.eq("resource_type", filters.resourceType);
  }

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

// ─── System Health Metrics ─────────────────────────────────────────────────

export async function recordHealthMetric(
  client: SupabaseClient,
  metric: Omit<SystemHealthMetric, "id">
): Promise<SystemHealthMetric> {
  const { data, error } = await client
    .from("system_health_metrics")
    .insert(metric)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRecentHealthMetrics(
  client: SupabaseClient,
  metricName: string,
  hoursBack: number = 24
): Promise<SystemHealthMetric[]> {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const { data, error } = await client
    .from("system_health_metrics")
    .select("*")
    .eq("metric_name", metricName)
    .gte("recorded_at", cutoffTime.toISOString())
    .order("recorded_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ─── Feature Flags ─────────────────────────────────────────────────────────

export async function getFeatureFlag(
  client: SupabaseClient,
  key: string
): Promise<FeatureFlag | null> {
  const { data, error } = await client
    .from("feature_flags")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function isFeatureEnabled(
  client: SupabaseClient,
  key: string,
  userId?: string,
  orgId?: string
): Promise<boolean> {
  const flag = await getFeatureFlag(client, key);
  if (!flag || !flag.enabled) return false;

  // Check rollout percentage
  if (flag.rollout_percentage < 100) {
    const randomValue = Math.random() * 100;
    if (randomValue > flag.rollout_percentage) return false;
  }

  // Check target organizations
  if (flag.target_organizations && orgId) {
    if (!flag.target_organizations.includes(orgId)) return false;
  }

  // Check target users
  if (flag.target_users && userId) {
    if (!flag.target_users.includes(userId)) return false;
  }

  return true;
}

export async function listFeatureFlags(
  client: SupabaseClient
): Promise<FeatureFlag[]> {
  const { data, error } = await client
    .from("feature_flags")
    .select("*")
    .order("key");

  if (error) throw error;
  return data ?? [];
}

export async function updateFeatureFlag(
  client: SupabaseClient,
  flagId: string,
  updates: Partial<Omit<FeatureFlag, "id" | "created_at" | "updated_at">>
): Promise<FeatureFlag> {
  const { data, error } = await client
    .from("feature_flags")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", flagId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
