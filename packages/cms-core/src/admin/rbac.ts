/**
 * Centralized RBAC — the single source of truth for permission checks.
 *
 * All route guards, component checks, and service-level authorization
 * should flow through `can()` instead of ad-hoc queries.
 */

import type { SupabaseClientAdapter, AdminTier, AdminTierInfo, UserRole, CoreRoleType } from './types.js';

// ---------------------------------------------------------------------------
// Tier hierarchy
// ---------------------------------------------------------------------------

const TIER_HIERARCHY: Record<AdminTier, number> = {
  PLATFORM_ADMIN: 3,
  GROUP_ADMIN: 2,
  ENTITY_ADMIN: 1,
  NONE: 0,
};

const ROLE_TO_TIER: Record<string, AdminTier> = {
  platform_admin: 'PLATFORM_ADMIN',
  org_admin: 'GROUP_ADMIN',
  entity_admin: 'ENTITY_ADMIN',
  standard_user: 'NONE',
  guest_viewer: 'NONE',
};

// ---------------------------------------------------------------------------
// Core permission checks
// ---------------------------------------------------------------------------

export async function isPlatformAdmin(
  supabase: SupabaseClientAdapter,
  userId?: string,
): Promise<boolean> {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }

  const { data, error } = await supabase.rpc('is_platform_admin', { check_user_id: userId });
  if (error) {
    console.error('Error checking platform admin:', error);
    return false;
  }
  return data === true;
}

export async function getUserRoles(
  supabase: SupabaseClientAdapter,
  userId: string,
): Promise<UserRole[]> {
  const result = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('created_at', { ascending: false });

  const { data, error } = result as unknown as { data: UserRole[] | null; error: unknown };
  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  return data ?? [];
}

export async function getHighestRole(
  supabase: SupabaseClientAdapter,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_user_highest_role', { check_user_id: userId });
  if (error) {
    console.error('Error fetching highest role:', error);
    return null;
  }
  return data as string | null;
}

// ---------------------------------------------------------------------------
// Tier detection
// ---------------------------------------------------------------------------

export async function detectAdminTier(
  supabase: SupabaseClientAdapter,
  userId?: string,
): Promise<AdminTierInfo> {
  const none: AdminTierInfo = {
    tier: 'NONE',
    isPlatformAdmin: false,
    isGroupAdmin: false,
    isEntityAdmin: false,
    managedEntities: 0,
    ownedEntities: 0,
  };

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return none;
    userId = user.id;
  }

  const roles = await getUserRoles(supabase, userId);
  const roleTypes = new Set(roles.map((r) => r.role_type));

  const isAdmin = roleTypes.has('platform_admin');
  const isOrgAdmin = roleTypes.has('org_admin');
  const isEntityAdmin = roleTypes.has('entity_admin');

  let tier: AdminTier = 'NONE';
  if (isAdmin) tier = 'PLATFORM_ADMIN';
  else if (isOrgAdmin) tier = 'GROUP_ADMIN';
  else if (isEntityAdmin) tier = 'ENTITY_ADMIN';

  return {
    tier,
    isPlatformAdmin: isAdmin,
    isGroupAdmin: isOrgAdmin || isAdmin,
    isEntityAdmin: isEntityAdmin || isOrgAdmin || isAdmin,
    managedEntities: 0, // populated by app-specific logic
    ownedEntities: 0,   // populated by app-specific logic
  };
}

// ---------------------------------------------------------------------------
// Tier comparison
// ---------------------------------------------------------------------------

export function canAccessTier(userTier: AdminTier, requiredTier: AdminTier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

export function getTierLabel(tier: AdminTier): string {
  switch (tier) {
    case 'PLATFORM_ADMIN': return 'Platform Administrator';
    case 'GROUP_ADMIN': return 'Group Administrator';
    case 'ENTITY_ADMIN': return 'Entity Administrator';
    default: return 'User';
  }
}

export function getAdminDashboardRoute(tier: AdminTier): string {
  switch (tier) {
    case 'PLATFORM_ADMIN': return '/admin';
    case 'GROUP_ADMIN': return '/group-admin';
    case 'ENTITY_ADMIN': return '/entity-admin';
    default: return '/';
  }
}

// ---------------------------------------------------------------------------
// Role management
// ---------------------------------------------------------------------------

export async function grantRole(
  supabase: SupabaseClientAdapter,
  userId: string,
  roleType: string,
  grantedBy: string,
  options?: { organizationId?: string; expiresAt?: string },
): Promise<UserRole> {
  const result = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_type: roleType,
      granted_by: grantedBy,
      organization_id: options?.organizationId ?? null,
      expires_at: options?.expiresAt ?? null,
      is_active: true,
    })
    .select('*')
    .maybeSingle();

  const { data, error } = result as unknown as { data: UserRole | null; error: unknown };

  if (error) throw error;
  if (!data) throw new Error('Failed to grant role');

  await logAdminAction(supabase, {
    admin_user_id: grantedBy,
    action_type: 'ROLE_GRANTED',
    action_details: { role_type: roleType, target_user_id: userId, organization_id: options?.organizationId },
  });

  return data;
}

export async function revokeRole(
  supabase: SupabaseClientAdapter,
  roleId: string,
  revokedBy: string,
): Promise<void> {
  // Capture before-state
  const existing = await supabase.from('user_roles').select('*').eq('id', roleId).maybeSingle();
  const { data: role } = existing as unknown as { data: UserRole | null; error: unknown };

  const result = await supabase.from('user_roles').update({ is_active: false }).eq('id', roleId);
  const { error } = result as unknown as { error: unknown };
  if (error) throw error;

  if (role) {
    await logAdminAction(supabase, {
      admin_user_id: revokedBy,
      action_type: 'ROLE_REVOKED',
      action_details: { role_type: role.role_type, role_id: roleId, target_user_id: role.user_id },
    });
  }
}

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------

export async function logAdminAction(
  supabase: SupabaseClientAdapter,
  action: {
    admin_user_id: string;
    action_type: string;
    action_details?: Record<string, unknown>;
    before_state?: Record<string, unknown>;
    after_state?: Record<string, unknown>;
    target_type?: string;
    target_id?: string;
  },
): Promise<void> {
  const result = await supabase.from('admin_audit_log').insert(action);
  const { error } = result as unknown as { error: unknown };
  if (error) {
    console.error('Error logging admin action:', error);
  }
}

export async function getAuditLogs(
  supabase: SupabaseClientAdapter,
  filters?: {
    adminUserId?: string;
    actionType?: string;
    targetType?: string;
    limit?: number;
    offset?: number;
  },
): Promise<Record<string, unknown>[]> {
  let query = supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.adminUserId) query = query.eq('admin_user_id', filters.adminUserId);
  if (filters?.actionType) query = query.eq('action_type', filters.actionType);
  if (filters?.targetType) query = query.eq('target_type', filters.targetType);
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);

  const { data, error } = await query as unknown as { data: Record<string, unknown>[] | null; error: unknown };
  if (error) throw error;
  return data ?? [];
}
