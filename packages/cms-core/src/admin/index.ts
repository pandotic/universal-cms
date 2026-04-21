// Types
export type {
  CoreRoleType,
  UserRole,
  AdminTier,
  AdminTierInfo,
  AccountStatus,
  AdminUser,
  OrganizationRole,
  Organization,
  OrganizationMember,
  AuditLogEntry,
  AuditLogFilters,
  FeatureFlag,
  AdminSetting,
  AlertSeverity,
  AdminAlert,
  PlatformModule,
  AuthAdapter,
  SupabaseClientAdapter,
} from './types.js';

// Adapters
export type { EntityAdapter, EntityField } from './adapters.js';

// RBAC
export {
  isPlatformAdmin,
  getUserRoles,
  getHighestRole,
  detectAdminTier,
  canAccessTier,
  getTierLabel,
  getAdminDashboardRoute,
  grantRole,
  revokeRole,
  logAdminAction,
  getAuditLogs,
} from './rbac.js';

// Services
export {
  createOrganization,
  getUserOrganizations,
  addOrganizationMember,
  removeOrganizationMember,
  updateAccountStatus,
  getAdminSettingsByCategory,
  updateAdminSetting,
  getFeatureFlags,
  isFeatureEnabled,
  toggleFeatureFlag,
} from './services.js';

// Hooks
export {
  useAdminTier,
  useIsPlatformAdmin,
  useUserRoles,
  useFeatureFlag,
  useFeatureFlags,
  useAdminSettings,
} from './hooks.js';
