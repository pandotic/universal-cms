/**
 * Database service functions for the universal admin system.
 *
 * These mirror the service layer from HomeDoc but are parameterized
 * to accept a Supabase client instance rather than importing a global one.
 */

import type {
  SupabaseClientAdapter,
  Organization,
  OrganizationMember,
  OrganizationRole,
  AdminSetting,
  FeatureFlag,
  AdminUser,
  AccountStatus,
} from '../types/index.js';
import { logAdminAction } from '../rbac/index.js';

// ---------------------------------------------------------------------------
// Organization service
// ---------------------------------------------------------------------------

export async function createOrganization(
  supabase: SupabaseClientAdapter,
  data: {
    name: string;
    slug: string;
    organization_type?: string;
    description?: string;
    contact_email?: string;
    website?: string;
  },
  createdBy: string,
): Promise<Organization> {
  const result = await supabase
    .from('organizations')
    .insert({ ...data, created_by: createdBy, is_active: true })
    .select('*')
    .maybeSingle();

  const { data: org, error } = result as unknown as { data: Organization | null; error: unknown };
  if (error) throw error;
  if (!org) throw new Error('Failed to create organization');

  // Add creator as OWNER
  await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: createdBy,
    role: 'OWNER',
    invited_by: createdBy,
    joined_at: new Date().toISOString(),
    is_active: true,
  });

  await logAdminAction(supabase, {
    admin_user_id: createdBy,
    action_type: 'ORG_CREATED',
    action_details: { organization_id: org.id, name: org.name },
    target_type: 'organization',
    target_id: org.id,
  });

  return org;
}

export async function getUserOrganizations(
  supabase: SupabaseClientAdapter,
  userId: string,
): Promise<Organization[]> {
  const memberships = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('is_active', true);

  const { data: members, error: mErr } = memberships as unknown as { data: Array<{ organization_id: string }> | null; error: unknown };
  if (mErr || !members?.length) return [];

  const orgIds = members.map((m) => m.organization_id);
  const orgs = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds)
    .eq('is_active', true)
    .order('name');

  const { data, error } = orgs as unknown as { data: Organization[] | null; error: unknown };
  if (error) return [];
  return data ?? [];
}

export async function addOrganizationMember(
  supabase: SupabaseClientAdapter,
  orgId: string,
  userId: string,
  role: OrganizationRole,
  addedBy: string,
): Promise<void> {
  const result = await supabase.from('organization_members').insert({
    organization_id: orgId,
    user_id: userId,
    role,
    invited_by: addedBy,
    joined_at: new Date().toISOString(),
    is_active: true,
  });

  const { error } = result as unknown as { error: unknown };
  if (error) throw error;

  await logAdminAction(supabase, {
    admin_user_id: addedBy,
    action_type: 'ORG_MEMBER_ADDED',
    action_details: { organization_id: orgId, user_id: userId, role },
    target_type: 'organization_member',
    target_id: orgId,
  });
}

export async function removeOrganizationMember(
  supabase: SupabaseClientAdapter,
  orgId: string,
  userId: string,
  removedBy: string,
): Promise<void> {
  const result = await supabase
    .from('organization_members')
    .update({ is_active: false })
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  const { error } = result as unknown as { error: unknown };
  if (error) throw error;

  await logAdminAction(supabase, {
    admin_user_id: removedBy,
    action_type: 'ORG_MEMBER_REMOVED',
    action_details: { organization_id: orgId, user_id: userId },
    target_type: 'organization_member',
    target_id: orgId,
  });
}

// ---------------------------------------------------------------------------
// User management service
// ---------------------------------------------------------------------------

export async function updateAccountStatus(
  supabase: SupabaseClientAdapter,
  userId: string,
  status: AccountStatus,
  adminId: string,
): Promise<void> {
  // Capture before state
  const before = await supabase.from('user_profiles').select('account_status').eq('id', userId).maybeSingle();
  const { data: beforeData } = before as unknown as { data: { account_status: string } | null; error: unknown };

  const result = await supabase.from('user_profiles').update({ account_status: status }).eq('id', userId);
  const { error } = result as unknown as { error: unknown };
  if (error) throw error;

  await logAdminAction(supabase, {
    admin_user_id: adminId,
    action_type: 'USER_STATUS_CHANGED',
    action_details: { user_id: userId, new_status: status },
    before_state: beforeData ? { account_status: beforeData.account_status } : undefined,
    after_state: { account_status: status },
    target_type: 'user',
    target_id: userId,
  });
}

// ---------------------------------------------------------------------------
// Admin settings service
// ---------------------------------------------------------------------------

export async function getAdminSettingsByCategory(
  supabase: SupabaseClientAdapter,
  category: string,
): Promise<AdminSetting[]> {
  const result = await supabase
    .from('admin_settings')
    .select('*')
    .eq('setting_category', category)
    .order('setting_key');

  const { data, error } = result as unknown as { data: AdminSetting[] | null; error: unknown };
  if (error) throw error;
  return data ?? [];
}

export async function updateAdminSetting(
  supabase: SupabaseClientAdapter,
  settingKey: string,
  value: unknown,
  updatedBy: string,
): Promise<void> {
  const result = await supabase
    .from('admin_settings')
    .update({ setting_value: value, updated_by: updatedBy })
    .eq('setting_key', settingKey);

  const { error } = result as unknown as { error: unknown };
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Feature flags service
// ---------------------------------------------------------------------------

export async function getFeatureFlags(
  supabase: SupabaseClientAdapter,
): Promise<FeatureFlag[]> {
  const result = await supabase
    .from('feature_flags')
    .select('*')
    .order('flag_key');

  const { data, error } = result as unknown as { data: FeatureFlag[] | null; error: unknown };
  if (error) throw error;
  return data ?? [];
}

export async function isFeatureEnabled(
  supabase: SupabaseClientAdapter,
  flagKey: string,
  context?: { userId?: string; orgId?: string; roleType?: string },
): Promise<boolean> {
  const result = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', flagKey)
    .maybeSingle();

  const { data, error } = result as unknown as { data: FeatureFlag | null; error: unknown };
  if (error || !data) return false;
  if (!data.is_enabled) return false;

  // Check targeting
  if (context?.userId && data.target_user_ids.length > 0) {
    if (data.target_user_ids.includes(context.userId)) return true;
  }
  if (context?.orgId && data.target_org_ids.length > 0) {
    if (data.target_org_ids.includes(context.orgId)) return true;
  }
  if (context?.roleType && data.target_roles.length > 0) {
    if (data.target_roles.includes(context.roleType)) return true;
  }

  // If targeting rules exist but none matched, deny
  const hasTargeting = data.target_user_ids.length > 0 || data.target_org_ids.length > 0 || data.target_roles.length > 0;
  if (hasTargeting) return false;

  // No targeting rules — use rollout percentage
  if (data.rollout_percentage >= 100) return true;
  if (data.rollout_percentage <= 0) return false;

  // Deterministic rollout based on userId
  if (context?.userId) {
    const hash = simpleHash(context.userId + flagKey);
    return (hash % 100) < data.rollout_percentage;
  }

  return data.rollout_percentage >= 50; // fallback
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export async function toggleFeatureFlag(
  supabase: SupabaseClientAdapter,
  flagKey: string,
  enabled: boolean,
  adminId: string,
): Promise<void> {
  const result = await supabase
    .from('feature_flags')
    .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('flag_key', flagKey);

  const { error } = result as unknown as { error: unknown };
  if (error) throw error;

  await logAdminAction(supabase, {
    admin_user_id: adminId,
    action_type: enabled ? 'FEATURE_FLAG_ENABLED' : 'FEATURE_FLAG_DISABLED',
    action_details: { flag_key: flagKey },
    target_type: 'feature_flag',
    target_id: flagKey,
  });
}
