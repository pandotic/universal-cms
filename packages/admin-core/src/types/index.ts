/**
 * Core types for the universal admin system.
 *
 * Apps extend these by providing entity adapters (see ../adapters).
 */

// ---------------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------------

/** Core role types. Apps can extend with additional string values. */
export type CoreRoleType =
  | 'platform_admin'
  | 'org_admin'
  | 'entity_admin'
  | 'standard_user'
  | 'guest_viewer';

export interface UserRole {
  id: string;
  user_id: string;
  role_type: string; // CoreRoleType or app-specific extension
  organization_id: string | null;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export type AdminTier = 'PLATFORM_ADMIN' | 'GROUP_ADMIN' | 'ENTITY_ADMIN' | 'NONE';

export interface AdminTierInfo {
  tier: AdminTier;
  isPlatformAdmin: boolean;
  isGroupAdmin: boolean;
  isEntityAdmin: boolean;
  managedEntities: number;
  ownedEntities: number;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type AccountStatus = 'active' | 'suspended' | 'deactivated';

export interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  timezone: string;
  locale: string;
  account_status: AccountStatus;
  onboarding_completed: boolean;
  onboarding_step: number;
  last_active_at: string | null;
  preferences: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  organization_type: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  current_tier: string;
  is_active: boolean;
  white_label_enabled: boolean;
  branding_config: Record<string, unknown>;
  powered_by_visible: boolean;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  is_primary_admin: boolean;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  admin_user_id: string | null;
  action_type: string;
  action_details: Record<string, unknown>;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  adminUserId?: string;
  actionType?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Feature Flags
// ---------------------------------------------------------------------------

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_roles: string[];
  target_org_ids: string[];
  target_user_ids: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Admin Settings
// ---------------------------------------------------------------------------

export interface AdminSetting {
  id: string;
  setting_category: string;
  setting_key: string;
  setting_value: unknown;
  setting_type: string;
  display_name: string | null;
  description: string | null;
  is_public: boolean;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AdminAlert {
  id: string;
  organization_id: string | null;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  is_read: boolean;
  is_dismissed: boolean;
  action_url: string | null;
  action_label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------

export interface PlatformModule {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  category: string;
  icon: string | null;
  is_enabled_globally: boolean;
  requires_subscription: boolean;
  subscription_tier: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Auth Adapter (provided by consuming app)
// ---------------------------------------------------------------------------

export interface AuthAdapter {
  /** Returns the current authenticated user or null */
  getCurrentUser(): Promise<{ id: string; email?: string } | null>;
  /** Returns whether auth state is still loading */
  isLoading(): boolean;
}

// ---------------------------------------------------------------------------
// Supabase Client Adapter
// ---------------------------------------------------------------------------

export interface SupabaseClientAdapter {
  from(table: string): {
    select(columns?: string): ReturnType<SupabaseClientAdapter['from']>;
    insert(data: Record<string, unknown> | Record<string, unknown>[]): ReturnType<SupabaseClientAdapter['from']>;
    update(data: Record<string, unknown>): ReturnType<SupabaseClientAdapter['from']>;
    delete(): ReturnType<SupabaseClientAdapter['from']>;
    eq(column: string, value: unknown): ReturnType<SupabaseClientAdapter['from']>;
    in(column: string, values: unknown[]): ReturnType<SupabaseClientAdapter['from']>;
    or(filter: string): ReturnType<SupabaseClientAdapter['from']>;
    order(column: string, options?: { ascending?: boolean }): ReturnType<SupabaseClientAdapter['from']>;
    limit(count: number): ReturnType<SupabaseClientAdapter['from']>;
    range(from: number, to: number): ReturnType<SupabaseClientAdapter['from']>;
    maybeSingle(): Promise<{ data: unknown; error: unknown }>;
    then(resolve: (value: { data: unknown; error: unknown }) => void): void;
  };
  rpc(fn: string, params?: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
  auth: {
    getUser(): Promise<{ data: { user: { id: string; email?: string } | null }; error: unknown }>;
  };
}
