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
} from './types/index.js';

// Adapters
export type { EntityAdapter, EntityField } from './adapters/index.js';

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
} from './rbac/index.js';

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
} from './services/index.js';

// Hooks
export {
  useAdminTier,
  useIsPlatformAdmin,
  useUserRoles,
  useFeatureFlag,
  useFeatureFlags,
  useAdminSettings,
} from './hooks/index.js';
