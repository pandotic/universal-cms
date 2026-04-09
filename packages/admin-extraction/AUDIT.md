# HomeDoc Admin System — Extraction Audit

> **Date:** 2026-04-07
> **Scope:** Read-only audit of `/home/user/homedoc`
> **Purpose:** Document the full surface area of HomeDoc's three-tier admin system to inform extraction into a universal `@universal-cms` package set.

---

## 1. Surface Area

### 1.1 Routes

#### Platform Admin

| Route | File | Guard | Notes |
|-------|------|-------|-------|
| `/admin` | `src/pages/admin.tsx` | `PlatformAdminRoute` | Main admin dashboard. 17 tabs via `?tab=` query param. |
| `/platform-admin/dashboard` | `src/pages/platform-admin/dashboard.tsx` | `PlatformAdminRoute` | Dedicated dashboard page |
| `/platform-admin/bugs` | `BugManagementPanel` (lazy) | `PlatformAdminRoute` | Bug report management |
| `/bootstrap-admin` | `src/pages/bootstrap-admin.tsx` | None (self-guarded) | First-admin bootstrapping. Only works when no admins exist. |
| `/grant-admin` | `src/pages/grant-admin.tsx` | Auth required | Grant admin privileges |

**Platform Admin Tabs** (all at `/admin?tab={tab}`):
`overview` · `modules` · `users` · `organizations` · `properties` · `demo` · `apis` · `ai` · `notifications` · `widgets` · `analytics` · `bugs` · `audit` · `health` · `system` · `pwa` · `tco-kb`

#### Group Admin

| Route | File | Guard | Notes |
|-------|------|-------|-------|
| `/group-admin` | `src/pages/group-admin.tsx` | Self-guarded via `detectAdminTier()` | Org-scoped admin. Supports `?org={id}&tab={tab}` params. |

**Group Admin Tabs:**
`overview` · `customers` · `properties` · `buildings` · `projects` · `catalog` · `invitations` · `referrals` · `opt-in` · `modules` · `work-docs` · `branding` · `widgets` · `analytics`

#### Home Admin (Individual)

| Route | File | Guard | Notes |
|-------|------|-------|-------|
| `/home-admin` | `src/pages/home-admin.tsx` | Self-guarded via `detectAdminTier()` | Per-home data management |

**Home Admin Tabs:**
`overview` · `data-sharing` · `access-control` · `service-providers` · `privacy` · `audit-log` · `settings`

#### User Settings (Individual)

| Route | File | Guard | Notes |
|-------|------|-------|-------|
| `/settings` | `src/pages/settings.tsx` | Auth required | Profile, notifications, preferences, cache, data export |

#### Domain-Specific Admin Routes

| Route | File | Notes |
|-------|------|-------|
| `/fireshield-admin` | `src/pages/fireshield-admin.tsx` | FireShield certification admin |
| `/contractor/settings` | `src/pages/contractor/settings.tsx` | Contractor-specific settings |

---

### 1.2 Components — Platform Admin Only

These 48 components are used exclusively by the Platform Admin tier (`/admin` page):

| Component | File | Size | Purpose |
|-----------|------|------|---------|
| PlatformAdminLayout | `admin/PlatformAdminLayout.tsx` | — | Layout wrapper for platform admin |
| PlatformAdminSidebarNav | `admin/PlatformAdminSidebarNav.tsx` | ~234 lines | Sidebar navigation |
| UnifiedModuleManagementPanel | `admin/UnifiedModuleManagementPanel.tsx` | 54.2 KB | Master module management |
| WidgetDeploymentPanel | `admin/WidgetDeploymentPanel.tsx` | 44.1 KB | Widget deploy & manage |
| AIModelManagementPanel | `admin/AIModelManagementPanel.tsx` | 39.8 KB | AI model config |
| UserManagementPanel | `admin/UserManagementPanel.tsx` | 29.7 KB | User CRUD + role management |
| UnifiedAPIBreakdown | `admin/UnifiedAPIBreakdown.tsx` | 28.3 KB | API cost breakdown |
| TCOKnowledgeBasePanel | `admin/TCOKnowledgeBasePanel.tsx` | 27.3 KB | TCO knowledge base |
| OrganizationManagementPanel | `admin/OrganizationManagementPanel.tsx` | 26.2 KB | Organization CRUD |
| DocumentManagementAdminDashboard | `admin/DocumentManagementAdminDashboard.tsx` | 26.2 KB | Document admin |
| HomeTestingProductsPanel | `admin/HomeTestingProductsPanel.tsx` | 25.9 KB | Testing products |
| PropertyDetailPanel | `admin/PropertyDetailPanel.tsx` | 24.8 KB | Property detail view |
| BugManagementPanel | `admin/BugManagementPanel.tsx` | 23.5 KB | Bug reports |
| HomespyAPIKeyPanel | `admin/HomespyAPIKeyPanel.tsx` | 23.3 KB | HomeSpy API key management |
| BulkPropertyRefreshPanel | `admin/BulkPropertyRefreshPanel.tsx` | 22.6 KB | Bulk property refresh |
| ProjectCatalogImportWizard | `admin/ProjectCatalogImportWizard.tsx` | 21.4 KB | Project template import |
| EnhancedAPIIntegrationsPanel | `admin/EnhancedAPIIntegrationsPanel.tsx` | 21.2 KB | Enhanced API integrations |
| RiskRecommendationsPanel | `admin/RiskRecommendationsPanel.tsx` | 20.8 KB | Risk recommendations |
| NotificationManagementPanel | `admin/NotificationManagementPanel.tsx` | 19.2 KB | Notification templates |
| UserDetailModal | `admin/UserDetailModal.tsx` | 19.2 KB | User detail & edit |
| UniversalAPICredentialPanel | `admin/UniversalAPICredentialPanel.tsx` | 19.2 KB | API credential management |
| EnhancedPropertyManagementPanel | `admin/EnhancedPropertyManagementPanel.tsx` | 19.0 KB | Property management |
| ProjectCatalogPanel | `admin/ProjectCatalogPanel.tsx` | 17.9 KB | Project catalog |
| EditBundleModal | `admin/EditBundleModal.tsx` | 17.9 KB | Edit project bundle |
| SystemSettingsPanel | `admin/SystemSettingsPanel.tsx` | 17.6 KB | System settings |
| APISummaryDashboard | `admin/APISummaryDashboard.tsx` | 17.3 KB | API overview |
| APIUsageMetrics | `admin/APIUsageMetrics.tsx` | 16.8 KB | API usage analytics |
| PerformanceMonitoringDashboard | `admin/PerformanceMonitoringDashboard.tsx` | 16.6 KB | Performance monitoring |
| CountyCacheManager | `admin/CountyCacheManager.tsx` | 16.6 KB | Cache management |
| ModuleManagementPanel | `admin/ModuleManagementPanel.tsx` | 16.5 KB | Module management |
| GoogleMapsStatusPanel | `admin/GoogleMapsStatusPanel.tsx` | 16.0 KB | Google Maps status |
| HealthScoreConfigPanel | `admin/HealthScoreConfigPanel.tsx` | 15.8 KB | Health score config |
| PropertyManagementPanel | `admin/PropertyManagementPanel.tsx` | 15.2 KB | Property CRUD |
| DemoHomeManagementPanel | `admin/DemoHomeManagementPanel.tsx` | 14.7 KB | Demo home management |
| APICostConfigPanel | `admin/APICostConfigPanel.tsx` | 14.7 KB | API cost config |
| TierAndWhiteLabelPanel | `admin/TierAndWhiteLabelPanel.tsx` | 14.7 KB | Tier & white label |
| AddUserToPropertyModal | `admin/AddUserToPropertyModal.tsx` | 14.7 KB | Assign user to property |
| WidgetEmbedGenerator | `admin/WidgetEmbedGenerator.tsx` | 14.4 KB | Widget embed codes |
| OptimizationDashboard | `admin/OptimizationDashboard.tsx` | 14.4 KB | Optimization recs |
| ModuleSettingsPanel | `admin/ModuleSettingsPanel.tsx` | 14.3 KB | Module settings |
| APIDetailPanel | `admin/APIDetailPanel.tsx` | 13.4 KB | Individual API config |
| FeatureReleasePanel | `admin/FeatureReleasePanel.tsx` | 13.4 KB | Feature releases |
| HomespyIntegrationPanel | `admin/HomespyIntegrationPanel.tsx` | 13.0 KB | HomeSpy integration |
| WidgetAnalyticsDashboard | `admin/WidgetAnalyticsDashboard.tsx` | 13.0 KB | Widget analytics |
| AddProjectModal | `admin/AddProjectModal.tsx` | 12.0 KB | Add project |
| APIIntegrationsPanel | `admin/APIIntegrationsPanel.tsx` | 10.8 KB | API integrations |
| APIStatusPanel | `admin/APIStatusPanel.tsx` | 10.8 KB | API health status |
| RealTimeCostDashboard | `admin/RealTimeCostDashboard.tsx` | 10.8 KB | Real-time costs |

### 1.3 Components — Group Admin Only

| Component | File | Purpose |
|-----------|------|---------|
| WidgetDeploymentManager | `group-admin/WidgetDeploymentManager.tsx` | Group-scoped widget deployment |

### 1.4 Components — Used by Group Admin (from `admin/` directory)

These components live in `src/components/admin/` but are imported by `src/pages/group-admin.tsx`:

| Component | Also Used by Platform Admin? | Purpose |
|-----------|------------------------------|---------|
| MyCustomersPanel | No | Customer management |
| CustomerPropertyManagementPanel | No | Customer property management |
| CustomerInvitationPanel | No | Customer invitations |
| ReferralPartnerManagementPanel | No | Referral partners |
| ServiceProviderReferralPanel | No | Service provider referrals |
| HomeownerOptInPanel | No | Homeowner opt-in |
| OrganizationModuleManagementPanel | Yes | Module management per org |
| TierUpgradeModal | Yes (from OrgManagement) | Tier upgrade dialog |
| GroupProjectsPanel | No | Group project management |
| WorkDocumentationPanel | No | Work documentation |
| BrandingManagementPanel | Yes (from OrgManagement) | Branding/white-label |
| OrganizationMembersModal | Yes (from OrgManagement) | Member management |
| ProjectCatalogPanel | Yes | Project catalog |
| GroupAdminAnalyticsDashboard | No | Group analytics |
| B2BOnboardingBanner | No | Onboarding banner |

### 1.5 Components — Shared Across Tiers

These components are used by 2 or more admin tiers:

| Component | Platform | Group | Home | Purpose |
|-----------|----------|-------|------|---------|
| AdminLayout | ✅ | ✅ | ✅ | Shared layout: breadcrumbs, title, actions area |
| StatCard | ✅ | ✅ | ✅ | Stat display card with icon and color |
| MultiPropertySelector | ✅ | ✅ | ✅ | Property selection dropdown |
| PropertySwitcher | ✅ | ✅ | — | Property switching (used by AdminLayout) |
| DatabaseConnectionIndicator | ✅ | ✅ | — | DB connection status badge |
| OrganizationSwitcher | ✅ | ✅ | — | Switch between organizations |
| AuditLogViewer | ✅ | — | — | Audit log (currently platform only, should be shared) |
| AdminPanelErrorFallback | ✅ | ✅ | ✅ | Error boundary fallback |
| AdminRedirect | ✅ | — | — | Legacy redirect |
| GroupAdminRedirect | — | ✅ | — | Legacy redirect |

### 1.6 Auth Components

| Component | File | Purpose |
|-----------|------|---------|
| PlatformAdminRoute | `auth/PlatformAdminRoute.tsx` | Route guard: checks `isSuperAdmin()` OR `isPlatformAdmin()` |
| ProtectedRoute | `auth/ProtectedRoute.tsx` | Auth-required route guard |
| OnboardingGuard | `auth/OnboardingGuard.tsx` | Redirects to onboarding if incomplete |

### 1.7 Components — Contractor Portal

| Component | Purpose |
|-----------|---------|
| ContractorLayout | Layout for contractor pages |
| ContractorSidebarNav | Contractor sidebar nav |

### 1.8 Utility Components Used by Admin

| Component | File | Purpose |
|-----------|------|---------|
| SettingsEditor | `admin/SettingsEditor.tsx` | Generic settings key-value editor |
| SettingsTemplateManager | `admin/SettingsTemplateManager.tsx` | Settings template CRUD |
| PortalSetupWizard | `admin/PortalSetupWizard.tsx` | Portal config wizard |
| AlertCenter | `admin/AlertCenter.tsx` | System alerts |
| ActivityFeed | `common/ActivityFeed.tsx` | Recent activity display |
| PWASettingsPanel | `admin/PWASettingsPanel.tsx` | PWA config |
| AnalyticsDashboard | `admin/AnalyticsDashboard.tsx` | Platform analytics |
| ApiConfigPanel | `admin/ApiConfigPanel.tsx` | General API config |
| ApiManagementOverview | `admin/ApiManagementOverview.tsx` | API overview |
| ApiUsageAnalytics | `admin/ApiUsageAnalytics.tsx` | API analytics |
| APIAlertsPanel | `admin/APIAlertsPanel.tsx` | API alerts |
| CreateTemplateModal | `admin/CreateTemplateModal.tsx` | Create template dialog |
| EditTemplateModal | `admin/EditTemplateModal.tsx` | Edit template dialog |
| WidgetLeadManagement | `admin/WidgetLeadManagement.tsx` | Widget lead mgmt |

---

## 2. Data Layer

### 2.1 Database Tables Used by Admin

#### Core Admin Tables (created for admin functionality)

| Table | Created In | Read By | Written By | Purpose |
|-------|-----------|---------|------------|---------|
| `user_roles` | `006_user_profiles_and_roles.sql` | Platform, Group, Home | Platform | Role assignments. Columns: user_id, role (text), role_type (text, added later), organization_id, granted_by, granted_at, expires_at, is_active |
| `user_profiles` | `006_user_profiles_and_roles.sql` | Platform, Group, Home | Platform, Self | Extended user info. Includes `is_super_admin` boolean flag. Auto-created on signup via `handle_new_user()` trigger. |
| `organizations` | `004_organizations_and_modules.sql` | Platform, Group | Platform, Group | B2B orgs. Columns: name, slug, description, logo_url, primary_color, secondary_color, tier, branding_config, white_label_enabled, portal_published |
| `organization_members` | `004_organizations_and_modules.sql` | Platform, Group | Platform, Group | Org membership. Columns: organization_id, user_id, role (text), is_primary_admin, invited_by, joined_at |
| `admin_audit_log` | `004_organizations_and_modules.sql` | Platform | Platform, Group | Audit trail. Columns: admin_user_id, action_type, action_details (jsonb), target_type, target_id, ip_address, user_agent |
| `platform_modules` | `004_organizations_and_modules.sql` | Platform, Group | Platform | Global module registry. Columns: module_key, module_name, category, is_enabled_globally, requires_subscription, subscription_tier, dependencies |
| `module_access_control` | `004_organizations_and_modules.sql` | Platform, Group | Platform, Group | Per-org module enablement. Columns: organization_id, module_key, is_enabled, show_in_top_nav, nav_display_order |
| `user_module_access` | `004_organizations_and_modules.sql` | Platform | Platform | Per-user module overrides. Columns: user_id, module_key, is_enabled, configured_by, expires_at |
| `admin_settings` | `004_organizations_and_modules.sql` | Platform | Platform | Global settings. Columns: setting_category, setting_key, setting_value (jsonb), is_editable |
| `system_health_metrics` | `004_organizations_and_modules.sql` | Platform | System | Health metrics. Columns: metric_name, metric_value, status, threshold_warning, threshold_critical |
| `module_settings` | `004_organizations_and_modules.sql` | Platform | Platform | Per-module settings. Columns: module_key, setting_key, setting_value (jsonb) |
| `module_usage_analytics` | `004_organizations_and_modules.sql` | Platform | System | Module usage tracking |
| `module_components` | `004_organizations_and_modules.sql` | Platform | Platform | Component registry for embeddable widgets |
| `admin_alerts` | `20260216_add_admin_alerts.sql` | Platform, Group | System | Alert system. Types: api_budget, widget_error, lead, security, webhook_failure. Severities: info, warning, critical |

#### User-Facing Tables (managed via admin)

| Table | Read By | Written By | Purpose |
|-------|---------|------------|---------|
| `user_settings` | Settings page | Settings page | Per-user preferences (notifications, units, theme) |
| `notification_preferences` | Platform, Self | Self | Per-user notification toggles |
| `notifications` | Self | System | User notifications |
| `onboarding_checklist` | Platform, Self | Self | Onboarding task tracking |

#### Property & Access Tables (admin-managed)

| Table | Read By | Written By | Purpose |
|-------|---------|------------|---------|
| `property_access` | Platform, Group, Home | Platform, Group | Per-property access grants (user_id, home_id, access_level, granted_by, expires_at) |
| `property_groups` | Platform, Group | Platform, Group | Groups of properties (owner_id, organization_id) |
| `property_group_members` | Platform, Group | Platform, Group | Property-to-group assignments |

#### Domain Tables (read by admin for management)

| Table | Admin Use |
|-------|-----------|
| `homes` | Property management panels |
| `appliances` / `home_appliances` | Property detail view |
| `documents` | Document management dashboard |
| `home_projects` / `projects` | Project management |
| `home_systems` | Property detail |
| `property_photos` | Property detail |

### 2.2 RLS Policies

#### Core Admin RLS

| Policy | Table | Effect | Source Migration |
|--------|-------|--------|-----------------|
| Users can view own profile | `user_profiles` | SELECT where id = auth.uid() | `006_user_profiles_and_roles.sql` |
| Users can insert/update own profile | `user_profiles` | INSERT/UPDATE where id = auth.uid() | `006_user_profiles_and_roles.sql` |
| Users can view own roles | `user_roles` | SELECT where user_id = auth.uid() | `006_user_profiles_and_roles.sql` |
| Users can view orgs they belong to | `organizations` | SELECT if member OR is_active = true | `004_organizations_and_modules.sql` |
| Org members can view their alerts | `admin_alerts` | SELECT where org_id in user's orgs | `20260216_add_admin_alerts.sql` |
| Org admins can manage alerts | `admin_alerts` | UPDATE for org admins | `20260216_add_admin_alerts.sql` |

#### Platform Admin RLS Overrides

| Policy | Table | Effect | Source Migration |
|--------|-------|--------|-----------------|
| Platform admins can view all homes | `homes` | SELECT if user has `role_type = 'platform_admin'` in `user_roles` | `20260130_add_admin_homes_policy.sql` |
| Platform admins can update all homes | `homes` | UPDATE same check | `20260130_add_admin_homes_policy.sql` |
| Platform admins can view all properties | `properties` | SELECT same check | `20260130_add_admin_homes_policy.sql` |
| Platform admins can view all appliances | `appliances` | SELECT same check | `20260130_add_admin_homes_policy.sql` |
| Platform admins can view all documents | `documents` | SELECT same check | `20260130_add_admin_homes_policy.sql` |
| Super admins can view all orgs | `organizations` | SELECT if `is_super_admin = true` OR `role_type = 'platform_admin'` | `20260201_ensure_superadmin_group_access.sql` |
| Super admins can update all orgs | `organizations` | UPDATE same dual check | `20260201_ensure_superadmin_group_access.sql` |
| Super admins can view all org members | `organization_members` | SELECT same dual check | `20260201_ensure_superadmin_group_access.sql` |
| Super admins can manage org members | `organization_members` | ALL same dual check | `20260201_ensure_superadmin_group_access.sql` |

**Note:** RLS policies use `role_type` column (added by fix migration), but the original `user_roles` table was created with a `role` column. Both columns exist and should contain the same data.

### 2.3 Database Services

| Service File | Used By | Key Functions |
|-------------|---------|--------------|
| `lib/database/roleService.ts` | Platform, Group | `getUserRoles()`, `getHighestRole()`, `isPlatformAdmin()`, `hasModuleAccess()`, `grantRole()`, `revokeRole()`, `logAdminAction()`, `getAuditLogs()`, `makeUserPlatformAdmin()` |
| `lib/services/adminTierService.ts` | Platform, Group, Home | `detectAdminTier()`, `getPropertyAccess()`, `getOwnedHomes()`, `getAllManagedProperties()`, `canAccessAdminDashboard()`, `getAdminDashboardRoute()` |
| `lib/database/propertyAccessService.ts` | Platform, Group | `isSuperAdmin()`, `makeUserSuperAdmin()`, `revokeSuperAdmin()`, `getAllUsers()`, `getAllProperties()`, property access CRUD |
| `lib/database/organizationService.ts` | Platform, Group | `createOrganization()`, `getUserOrganizations()`, `getOrganizationById()`, member management, org CRUD |
| `lib/database/professionalTierService.ts` | Platform, Group | `TIER_DEFINITIONS`, `getOrganizationTierUsage()`, `recordTierChange()` |
| `lib/database/userSettingsService.ts` | Settings | `getUserSettings()`, `updateUserSettings()`, `exportUserData()` |
| `lib/database/moduleService.ts` | Platform, Group | Module CRUD, `getLatestHealthMetrics()` |
| `lib/database/customerInvitationService.ts` | Group | Invitation CRUD, status tracking, email delivery |
| `lib/database/notificationTemplateService.ts` | Platform | Template CRUD |
| `lib/services/webhookService.ts` | Platform, Group | Webhook config, delivery, testing |
| `lib/database/backfillQueueService.ts` | Platform | Job queue for backfill operations |
| `lib/database/dataSharingService.ts` | Home | `getAllSharingPreferencesForHome()` |
| `lib/database/buildingService.ts` | Group | `getBuilding()` |

### 2.4 Admin-Related Migrations

| Migration | Purpose |
|-----------|---------|
| `20260113192635_004_organizations_and_modules.sql` | Core admin schema: organizations, org_members, platform_modules, module_access_control, user_module_access, module_components, module_settings, module_usage_analytics, admin_settings, system_health_metrics, admin_audit_log + RLS |
| `20260113192736_006_user_profiles_and_roles.sql` | User schema: user_profiles, user_roles, onboarding_checklist, user_settings, notification_preferences, notifications + `handle_new_user()` trigger + RLS |
| `20260113224452_010_add_bootstrap_admin_function.sql` | `bootstrap_first_admin()` RPC function. Creates first admin + two default orgs (FireShield Defense, HomeDoc Platform). |
| `20260130_add_admin_homes_policy.sql` | Platform admin RLS overrides for homes, properties, appliances, documents |
| `20260201_ensure_superadmin_group_access.sql` | Super admin RLS for organizations and organization_members. Also hardcodes `theman@danielgolden.com` as super admin. |
| `20260205_fix_user_roles_column_mismatch.sql` | Adds `role_type` column to fix `role` vs `role_type` mismatch. Copies data, adds unique constraint and indexes. |
| `20260216_add_admin_alerts.sql` | `admin_alerts` table with severity levels, org scoping, read/dismiss status |
| `20260216_create_demo_organization.sql` | Creates demo organization with test data |
| `20260222_02_property_home_tables.sql` | `property_access`, `property_groups`, `property_group_members` tables |
| `20260325_tco_admin_knowledge_base.sql` | TCO knowledge base tables (HomeDoc-specific) |

### 2.5 RPC Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `bootstrap_first_admin()` | Create first platform admin when none exist | Bootstrap page |
| `get_user_highest_role(check_user_id)` | Return highest role for a user | roleService |
| `is_platform_admin(check_user_id)` | Check if user is platform admin | roleService, route guards |
| `has_module_access(check_user_id, check_module_name)` | Check module access | roleService |
| `is_super_admin(check_user_id)` | Check super admin flag | propertyAccessService |

---

## 3. Auth & RBAC

### 3.1 Role Definitions

**Platform Roles** (defined in `roleService.ts:3-8` as TypeScript union type):

| Role | Scope | Purpose |
|------|-------|---------|
| `PLATFORM_ADMIN` | Global | Full platform control. Can manage all users, orgs, properties, modules, settings. |
| `ORG_ADMIN` | Per-organization | Manage users and data within their organization. |
| `HOME_ADMIN` | Per-property | Manage their own home's data sharing and access. |
| `STANDARD_USER` | Self | Default role. Access own data only. |
| `GUEST_VIEWER` | Limited | Read-only access to shared data. |

**Organization Roles** (defined in `organizationService.ts:5` as TypeScript type):

| Role | Purpose |
|------|---------|
| `OWNER` | Full org control. Can delete org, manage billing, transfer ownership. |
| `ADMIN` | Manage members and settings. Cannot delete org. |
| `MEMBER` | Standard member access. |
| `VIEWER` | Read-only access to org data. |

**Property Access Levels** (defined in `propertyAccessService.ts:41`):

| Level | Purpose |
|-------|---------|
| `OWNER` | Full property control. |
| `ADMIN` | Manage property data and sharing. |
| `EDITOR` | Modify property data. |
| `VIEWER` | Read-only property access. |

**Organization Tiers** (defined in `professionalTierService.ts:6`):

| Tier | Home Limit | Price/mo | Notable Features |
|------|-----------|----------|-----------------|
| `FREE` | 10 | $0 | Basic access |
| `STARTER` | 50 | $49 | Priority support, analytics, custom branding |
| `PRO` | 200 | $149 | API access, advanced analytics, white-label (with "Powered by" required) |
| `ENTERPRISE` | 1000 | $499 | Dedicated support, white-label (no "Powered by"), custom integrations |
| `CUSTOM` | Unlimited | Custom | Enterprise+ |

### 3.2 How Role Checks Happen

There are **five distinct check mechanisms**, not one centralized system:

| Mechanism | Location | What It Checks | Used By |
|-----------|----------|---------------|---------|
| `isPlatformAdmin(userId)` | `roleService.ts:64` | RPC `is_platform_admin` — checks `user_roles.role_type = 'PLATFORM_ADMIN'` | Route guards, admin pages |
| `isSuperAdmin(userId)` | `propertyAccessService.ts:496` | RPC `is_super_admin` — checks `user_profiles.is_super_admin` flag | Route guards, admin pages |
| `detectAdminTier(userId)` | `adminTierService.ts:66` | Runs 5 parallel queries (super admin, platform admin, property access, owned homes, org membership) and returns highest tier | Group admin, Home admin access checks |
| `PlatformAdminRoute` component | `auth/PlatformAdminRoute.tsx` | Calls both `isSuperAdmin()` AND `isPlatformAdmin()` in parallel; allows access if either is true | Route-level guard for `/admin`, `/platform-admin/*` |
| `hasModuleAccess(userId, module)` | `roleService.ts:82` | RPC `has_module_access` — checks user/org module access tables | Module-level access gating |

**There is no centralized `can(user, action, resource)` function.** Each admin page performs its own access check inline.

### 3.3 Role Hierarchy

```
PLATFORM_ADMIN (3)     ← Full platform control
    │
    ├── isSuperAdmin() ← user_profiles.is_super_admin flag (legacy)
    └── isPlatformAdmin() ← user_roles.role_type = 'PLATFORM_ADMIN'
    
GROUP_ADMIN (2)        ← Has property_access records OR organization_members
    │
    └── Organization roles: OWNER > ADMIN > MEMBER > VIEWER
    
HOME_ADMIN (1)         ← Owns homes (homes.user_id = auth.uid())

NONE (0)               ← No admin access
```

Hierarchy comparison: `adminTierService.ts:278-283`
```typescript
const tierHierarchy: Record<AdminTier, number> = {
  'PLATFORM_ADMIN': 3,
  'GROUP_ADMIN': 2,
  'HOME_ADMIN': 1,
  'NONE': 0
};
```

### 3.4 How Users Are Elevated/Demoted

| Action | Method | Audit Logged? |
|--------|--------|--------------|
| Grant PLATFORM_ADMIN | `roleService.ts:grantRole()` → inserts into `user_roles` | ✅ via `logAdminAction()` |
| Revoke PLATFORM_ADMIN | `roleService.ts:revokeRole()` → sets `is_active = false` | ✅ via `logAdminAction()` |
| Make super admin | `propertyAccessService.ts:makeUserSuperAdmin()` → sets `is_super_admin = true` on `user_profiles` | ✅ via `logAdminAction()` |
| Revoke super admin | `propertyAccessService.ts:revokeSuperAdmin()` → sets `is_super_admin = false` | ✅ via `logAdminAction()` |
| Bootstrap first admin | `bootstrap_first_admin()` RPC → inserts PLATFORM_ADMIN role + creates default orgs | ✅ logged in `admin_audit_log` |
| Change org member role | `organizationService.ts:updateOrganizationMemberRole()` | ✅ via `logAdminAction()` |
| Grant property access | `propertyAccessService.ts` CRUD functions | Varies |

### 3.5 Impersonation / View-As

**No true impersonation exists.** The only "view-as" capability is:

- `OrganizationManagementPanel.tsx:282` — "View Admin" button navigates to `/group-admin?org={id}`
- This scopes the group admin page to a specific org but the admin is still logged in as themselves
- No session switching, no impersonation banner, no impersonation audit trail

### 3.6 Dev Mode Bypass

`VITE_ADMIN_DEV_MODE` environment variable (checked as `import.meta.env.VITE_ADMIN_DEV_MODE === 'true' && import.meta.env.DEV`):
- Bypasses all admin auth checks in `PlatformAdminRoute.tsx`
- Bypasses tier checks in `group-admin.tsx` and `home-admin.tsx`
- Shows a yellow "DEV MODE" banner via `AdminLayout.tsx`
- Only active when both the env var is set AND Vite is in dev mode

---

## 4. Features Per Tier

### 4.1 Platform Admin Features

| Feature | Component(s) | Tables Touched | Notes |
|---------|-------------|---------------|-------|
| **Dashboard overview** | `admin.tsx` overview tab | `user_profiles`, `homes`, `organizations`, `platform_modules`, `system_health_metrics` | Stats: total users, properties, orgs, active modules, system health |
| **User management** | `UserManagementPanel`, `UserDetailModal` | `user_profiles`, `user_roles`, `homes`, `organization_members` | List, search, filter (11 filters), view detail, grant/revoke admin, toggle module access |
| **Organization management** | `OrganizationManagementPanel`, `OrganizationMembersModal`, `EditOrganizationModal` | `organizations`, `organization_members`, `user_roles` | Full CRUD, member management, tier display, "View as Group Admin" link |
| **Property management** | `EnhancedPropertyManagementPanel`, `PropertyDetailPanel`, `PropertyManagementPanel`, `AddUserToPropertyModal` | `homes`, `property_access`, `appliances`, `documents`, `property_photos` | Property CRUD, user assignment, detail view |
| **Module management** | `UnifiedModuleManagementPanel`, `ModuleManagementPanel`, `ModuleSettingsPanel` | `platform_modules`, `module_access_control`, `user_module_access`, `module_settings` | Global module registry, per-org/per-user access control, settings |
| **Demo home management** | `DemoHomeManagementPanel` | `homes`, `appliances` | Manage demo properties for testing |
| **API management** | `UniversalAPICredentialPanel`, `APIStatusPanel`, `APIUsageMetrics`, `APISummaryDashboard`, `UnifiedAPIBreakdown`, `APICostConfigPanel`, `APIIntegrationsPanel`, `EnhancedAPIIntegrationsPanel`, `APIDetailPanel`, `APIAlertsPanel`, `RealTimeCostDashboard`, `OptimizationDashboard`, `HomespyAPIKeyPanel`, `HomespyIntegrationPanel`, `GoogleMapsStatusPanel`, `ApiConfigPanel`, `ApiManagementOverview`, `ApiUsageAnalytics` | `api_integrations`, `api_usage_logs`, `api_cost_tracking`, `platform_api_credentials`, `api_rate_limits` | Credential management, health checks, usage analytics, cost tracking, alerts |
| **AI model management** | `AIModelManagementPanel` | AI-related settings | Model configuration and deployment status |
| **Notification management** | `NotificationManagementPanel` | `notification_templates`, `notifications` | Template CRUD, delivery management |
| **Widget management** | `WidgetDeploymentPanel`, `WidgetEmbedGenerator`, `WidgetAnalyticsDashboard`, `WidgetLeadManagement` | `widget_deployments`, `widget_analytics`, `widget_leads` | Deploy widgets, generate embed codes, analytics, lead management |
| **Analytics** | `AnalyticsDashboard` | Various | Platform-level analytics |
| **Bug management** | `BugManagementPanel` | Bug report tables | Bug collection and management |
| **Audit logs** | `AuditLogViewer` | `admin_audit_log` | View admin actions with search and filter |
| **System health** | `PerformanceMonitoringDashboard`, `DatabaseConnectionIndicator` | `system_health_metrics` | Performance metrics, DB status |
| **System settings** | `SystemSettingsPanel`, `SettingsEditor`, `SettingsTemplateManager` | `admin_settings` | Runtime configuration (6 categories) |
| **PWA settings** | `PWASettingsPanel` | `admin_settings` | PWA configuration |
| **TCO knowledge base** | `TCOKnowledgeBasePanel` | TCO-related tables | TCO calculator knowledge base |
| **Tier & white-label** | `TierAndWhiteLabelPanel`, `TierUpgradeModal` | `organizations` | Tier management, white-label config |
| **Branding** | `BrandingManagementPanel` | `organizations.branding_config` | Logo, colors, company info |
| **Feature releases** | `FeatureReleasePanel` | Feature release tables | Feature release management |
| **Bulk property refresh** | `BulkPropertyRefreshPanel` | `homes`, property cache | Bulk refresh via RentCast |
| **County cache** | `CountyCacheManager` | `county_risk_cache` | Cache invalidation UI |
| **Health score config** | `HealthScoreConfigPanel` | Health score tables | Configure health scoring |
| **Risk recommendations** | `RiskRecommendationsPanel` | Risk recommendation tables | Manage risk recommendations |
| **Project catalog** | `ProjectCatalogPanel`, `ProjectCatalogImportWizard`, `CreateTemplateModal`, `EditTemplateModal`, `EditBundleModal`, `AddProjectModal` | `project_templates` | Project template management and import |
| **Home testing products** | `HomeTestingProductsPanel` | `test_products`, `test_profiles` | Testing product management |
| **Document management** | `DocumentManagementAdminDashboard` | `documents` | Document admin dashboard |
| **Alert center** | `AlertCenter` | `admin_alerts` | System alerts |
| **Portal setup** | `PortalSetupWizard` | Portal configuration | Portal configuration wizard |

### 4.2 Group Admin Features

| Feature | Component(s) | Tables Touched | Notes |
|---------|-------------|---------------|-------|
| **Dashboard overview** | `group-admin.tsx` overview tab | `homes`, `organization_members`, `customer_invitations` | Stats: properties, projects, invitations, referral partners |
| **Customer management** | `MyCustomersPanel`, `CustomerPropertyManagementPanel` | `homes`, `property_access`, `organization_members` | View and manage customer properties |
| **Customer invitations** | `CustomerInvitationPanel` | `customer_invitations` | Invite customers via email with tracking |
| **Referral partners** | `ReferralPartnerManagementPanel`, `ServiceProviderReferralPanel` | Referral tables | Manage referral network |
| **Homeowner opt-in** | `HomeownerOptInPanel` | Opt-in tables | Manage homeowner opt-in preferences |
| **Module management** | `OrganizationModuleManagementPanel` | `module_access_control` | Per-org module enablement |
| **Tier upgrade** | `TierUpgradeModal` | `organizations` | Request tier upgrade |
| **Project management** | `GroupProjectsPanel`, `ProjectCatalogPanel` | `home_projects`, `project_templates` | Manage group projects |
| **Organization switching** | `OrganizationSwitcher` | `organizations`, `organization_members` | Switch between managed orgs |
| **Work documentation** | `WorkDocumentationPanel` | `work_completion_photos` | Work documentation and photos |
| **Branding** | `BrandingManagementPanel` | `organizations.branding_config` | Org branding (tier-gated) |
| **Member management** | `OrganizationMembersModal` | `organization_members` | Add/remove/update org members |
| **Widget deployment** | `WidgetDeploymentManager` | `widget_deployments` | Group-scoped widget management |
| **Analytics** | `GroupAdminAnalyticsDashboard` | Various | Group-level analytics |
| **Building management** | `BuildingListPanel`, `BuildingDetailView` | `buildings` | Multi-unit building management |
| **B2B onboarding** | `B2BOnboardingBanner` | — | Onboarding guidance banner |

### 4.3 Home Admin (Individual) Features

| Feature | Component(s) | Tables Touched | Status |
|---------|-------------|---------------|--------|
| **Dashboard overview** | `home-admin.tsx` overview tab | `homes`, `property_access` | ✅ Working — stats + privacy status + recent activity |
| **Data sharing controls** | Overview tab only | `data_sharing_preferences` | 🟡 Placeholder UI — "Data sharing configuration interface" text |
| **Access control** | Overview tab only | — | ❌ Placeholder — "Access control management coming soon" |
| **Service providers** | Overview tab only | — | ❌ Placeholder — "Service provider management coming soon" |
| **Privacy & security** | Overview tab only | — | ❌ Placeholder — "Privacy settings coming soon" |
| **Audit log** | Overview tab only | — | ❌ Placeholder — "No audit log entries" (static text, no data query) |
| **Settings** | Overview tab only | — | ❌ Placeholder — "Settings coming soon" |

### 4.4 User Settings Features

| Feature | Component(s) | Tables Touched |
|---------|-------------|---------------|
| **Profile editing** | `settings.tsx` | `user_settings` |
| **Notification preferences** | `settings.tsx` | `user_settings` |
| **Display preferences** | `settings.tsx` | `user_settings` (units, currency, date format) |
| **Theme** | `settings.tsx` + `ThemeContext` | `user_settings.theme` |
| **Cache management** | `settings.tsx` | Browser caches via `cacheManager.ts` |
| **Data export** | `settings.tsx` | Reads `user_settings`, `homes`, `home_projects` |

---

## 5. Universal vs HomeDoc-Specific Split

### Classification Key

- **UNIVERSAL** — Would apply to any SaaS app. Extract into `@universal-cms` packages.
- **DOMAIN-ADAPTABLE** — Universal pattern with HomeDoc-specific fields. Extract the pattern, parameterize the entity.
- **HOMEDOC-SPECIFIC** — Only makes sense for HomeDoc. Leave in HomeDoc, do not extract.

### 5.1 Components Classification

#### UNIVERSAL — Extract as-is

| Component | Why Universal |
|-----------|--------------|
| AdminLayout | Generic layout with breadcrumbs, title, actions slot. Zero domain knowledge. |
| StatCard | Generic stat display. Accepts title, value, icon, color. |
| AdminPanelErrorFallback | Generic error boundary fallback. |
| PlatformAdminRoute | Route guard pattern. Parameterize the admin-check function. |
| AdminRedirect / GroupAdminRedirect | Redirect patterns. |
| AuditLogViewer | Audit log display. Reads from generic audit table. |
| UserManagementPanel | User list, search, filter. Entity-specific fields (completion score, etc.) could be slots. |
| UserDetailModal | User detail view. Extensible with domain-specific sections. |
| OrganizationManagementPanel | Org CRUD. Universal B2B pattern. |
| OrganizationMembersModal | Org member management. Standard B2B pattern. |
| EditOrganizationModal | Org edit form. |
| OrganizationSwitcher | Multi-org switching. |
| SystemSettingsPanel | Generic key-value settings editor with categories. |
| SettingsEditor | Generic settings editor. |
| SettingsTemplateManager | Settings template CRUD. |
| NotificationManagementPanel | Notification template management. |
| AlertCenter | Alert system (types are configurable). |
| DatabaseConnectionIndicator | DB connection status. |
| TierUpgradeModal | Tier upgrade dialog (tier definitions are configurable). |
| TierAndWhiteLabelPanel | Tier + white-label management (universal B2B pattern). |
| BrandingManagementPanel | Logo, colors, company info. Universal white-label. |
| PWASettingsPanel | PWA config (applicable to any PWA). |
| BugManagementPanel | Bug/feedback collection. |
| FeatureReleasePanel | Feature release management. |

#### DOMAIN-ADAPTABLE — Extract the pattern, adapt the entity

| Component | Universal Pattern | HomeDoc Entity | Adapter Needed |
|-----------|------------------|---------------|----------------|
| PropertyManagementPanel | **Entity management panel** | Home/Property | Entity name, schema, display fields |
| EnhancedPropertyManagementPanel | **Enhanced entity management** | Home/Property | Same as above with advanced features |
| PropertyDetailPanel | **Entity detail view** | Home/Property | Detail sections, related data |
| PropertySwitcher | **Entity switcher** | Home/Property | Entity type, display format |
| MultiPropertySelector | **Multi-entity selector** | Home/Property | Entity type, query |
| AddUserToPropertyModal | **Add user to entity** | Home/Property | Entity type, access levels |
| CustomerPropertyManagementPanel | **Customer entity management** | Home/Property | Entity type |
| CustomerInvitationPanel | **Invitation panel** | Customer (to manage home) | Invitation context, entity type |
| GroupManagedHomesPanel | **Group entity panel** | Home/Property | Entity type |
| ModuleManagementPanel | **Module management** | Platform modules | Module definitions (universal but module list is app-specific) |
| UnifiedModuleManagementPanel | **Master module panel** | Platform modules | Same as above |
| ModuleSettingsPanel | **Module settings** | Per-module config | Module-specific settings schema |
| OrganizationModuleManagementPanel | **Org module access** | Platform modules | Module list |
| GroupProjectsPanel | **Group entity management** | Projects | Entity type |
| ProjectCatalogPanel | **Catalog/template panel** | Project templates | Template schema |
| WidgetDeploymentPanel | **Embeddable deployment** | Widgets | Widget types (app-specific) |
| WidgetEmbedGenerator | **Embed code generator** | Widgets | Embed parameters |
| WidgetAnalyticsDashboard | **Embed analytics** | Widget analytics | Analytics schema |
| WidgetLeadManagement | **Lead management** | Widget leads | Lead schema |
| WidgetDeploymentManager | **Group embed manager** | Widgets | Widget types |
| AnalyticsDashboard | **Analytics dashboard** | Platform metrics | Metric definitions |
| GroupAdminAnalyticsDashboard | **Group analytics** | Group metrics | Metric definitions |
| PerformanceMonitoringDashboard | **Performance dashboard** | System metrics | Metric sources |
| WorkDocumentationPanel | **Work documentation** | Work photos/docs | Document types |
| ReferralPartnerManagementPanel | **Partner management** | Referral partners | Partner types, fields |
| ServiceProviderReferralPanel | **Provider referrals** | Service providers | Provider types |
| PortalSetupWizard | **Portal setup** | Portal config | Portal fields |

#### HOMEDOC-SPECIFIC — Do not extract

| Component | Why HomeDoc-Specific |
|-----------|---------------------|
| APIStatusPanel | Monitors HomeDoc's specific API integrations (RentCast, HomeSpy, Google, etc.) |
| APIUsageMetrics | HomeDoc API cost tracking |
| APISummaryDashboard | HomeDoc API overview |
| UnifiedAPIBreakdown | HomeDoc API cost breakdown |
| APICostConfigPanel | HomeDoc API cost thresholds |
| APIIntegrationsPanel | HomeDoc third-party integrations |
| EnhancedAPIIntegrationsPanel | HomeDoc enhanced integrations |
| APIDetailPanel | HomeDoc individual API config |
| APIAlertsPanel | HomeDoc API alerts |
| RealTimeCostDashboard | HomeDoc real-time API costs |
| OptimizationDashboard | HomeDoc optimization recommendations |
| UniversalAPICredentialPanel | HomeDoc API credential management |
| HomespyAPIKeyPanel | HomeSpy-specific API key management |
| HomespyIntegrationPanel | HomeSpy-specific integration |
| GoogleMapsStatusPanel | Google Maps-specific status |
| ApiConfigPanel | HomeDoc API config |
| ApiManagementOverview | HomeDoc API overview |
| ApiUsageAnalytics | HomeDoc API analytics |
| AIModelManagementPanel | HomeDoc AI model management |
| TCOKnowledgeBasePanel | HomeDoc TCO knowledge base |
| RiskRecommendationsPanel | HomeDoc risk recommendations |
| HealthScoreConfigPanel | HomeDoc health score config |
| HomeTestingProductsPanel | HomeDoc testing products |
| DemoHomeManagementPanel | HomeDoc demo homes |
| BulkPropertyRefreshPanel | HomeDoc RentCast bulk refresh |
| CountyCacheManager | HomeDoc county risk cache |
| DocumentManagementAdminDashboard | HomeDoc document management |
| HomeownerOptInPanel | HomeDoc homeowner opt-in |
| B2BOnboardingBanner | HomeDoc B2B onboarding |
| MyCustomersPanel | HomeDoc customer management |
| ContractorLayout | HomeDoc contractor portal |
| ContractorSidebarNav | HomeDoc contractor nav |

### 5.2 Services Classification

| Service | Classification | Notes |
|---------|---------------|-------|
| `roleService.ts` | **UNIVERSAL** | Role CRUD, audit logging, permission checks. Core RBAC. |
| `adminTierService.ts` | **UNIVERSAL** | Tier detection, hierarchy, dashboard routing. |
| `propertyAccessService.ts` | **DOMAIN-ADAPTABLE** | Entity access control. Replace "property" with generic "entity." |
| `organizationService.ts` | **UNIVERSAL** | Org CRUD, member management. |
| `professionalTierService.ts` | **DOMAIN-ADAPTABLE** | Tier definitions are universal; tier names and limits are app-specific. |
| `userSettingsService.ts` | **UNIVERSAL** | User preferences. |
| `moduleService.ts` | **UNIVERSAL** | Module registry and access control. |
| `customerInvitationService.ts` | **DOMAIN-ADAPTABLE** | Invitation pattern is universal; invitation context (property, org) is app-specific. |
| `notificationTemplateService.ts` | **UNIVERSAL** | Notification templates. |
| `webhookService.ts` | **UNIVERSAL** | Webhook config and delivery. |
| `backfillQueueService.ts` | **DOMAIN-ADAPTABLE** | Job queue pattern is universal; job types are app-specific. |
| `dataSharingService.ts` | **HOMEDOC-SPECIFIC** | Home data sharing preferences. |
| `buildingService.ts` | **HOMEDOC-SPECIFIC** | Building management. |

### 5.3 Database Tables Classification

| Table | Classification | Notes |
|-------|---------------|-------|
| `user_roles` | **UNIVERSAL** | Core RBAC |
| `user_profiles` | **UNIVERSAL** | Extended user info |
| `organizations` | **UNIVERSAL** | B2B orgs |
| `organization_members` | **UNIVERSAL** | Org membership |
| `admin_audit_log` | **UNIVERSAL** | Audit trail |
| `platform_modules` | **UNIVERSAL** | Module registry |
| `module_access_control` | **UNIVERSAL** | Per-org module access |
| `user_module_access` | **UNIVERSAL** | Per-user module overrides |
| `admin_settings` | **UNIVERSAL** | Platform settings |
| `system_health_metrics` | **UNIVERSAL** | Health metrics |
| `admin_alerts` | **UNIVERSAL** | Alert system |
| `user_settings` | **UNIVERSAL** | User preferences |
| `notification_preferences` | **UNIVERSAL** | Notification prefs |
| `notifications` | **UNIVERSAL** | User notifications |
| `onboarding_checklist` | **UNIVERSAL** | Onboarding tracking |
| `module_settings` | **UNIVERSAL** | Per-module settings |
| `module_usage_analytics` | **UNIVERSAL** | Module usage |
| `module_components` | **DOMAIN-ADAPTABLE** | Component registry (widget types are app-specific) |
| `property_access` | **DOMAIN-ADAPTABLE** | Entity access → rename to `entity_access` |
| `property_groups` | **DOMAIN-ADAPTABLE** | Entity groups → rename to `entity_groups` |
| `property_group_members` | **DOMAIN-ADAPTABLE** | → `entity_group_members` |
| `homes` | **HOMEDOC-SPECIFIC** | Domain entity |
| `appliances` | **HOMEDOC-SPECIFIC** | Domain entity |
| `documents` | **HOMEDOC-SPECIFIC** | Domain entity |

### 5.4 Migrations Classification

| Migration | Classification | Notes |
|-----------|---------------|-------|
| `004_organizations_and_modules.sql` | **UNIVERSAL** | Core admin schema. Port entirely. |
| `006_user_profiles_and_roles.sql` | **UNIVERSAL** | User + role schema. Port entirely. |
| `010_add_bootstrap_admin_function.sql` | **DOMAIN-ADAPTABLE** | Bootstrap pattern is universal; default org names (FireShield, HomeDoc) are app-specific. |
| `20260130_add_admin_homes_policy.sql` | **DOMAIN-ADAPTABLE** | Admin RLS override pattern is universal; table names (homes, appliances) are app-specific. |
| `20260201_ensure_superadmin_group_access.sql` | **PARTIALLY UNIVERSAL** | RLS policies are universal; hardcoded email address is app-specific and should not be in migrations. |
| `20260205_fix_user_roles_column_mismatch.sql` | **FIX — DO NOT PORT** | Fix for a bug. The universal package should have the correct schema from the start. |
| `20260216_add_admin_alerts.sql` | **UNIVERSAL** | Alert system schema. |
| `20260222_02_property_home_tables.sql` | **DOMAIN-ADAPTABLE** | `property_access` and `property_groups` patterns are universal. |
| `20260325_tco_admin_knowledge_base.sql` | **HOMEDOC-SPECIFIC** | TCO knowledge base. |
| `20260216_create_demo_organization.sql` | **HOMEDOC-SPECIFIC** | Demo data. |

---

## 6. Dependencies

### 6.1 npm Packages Used by Admin Code

| Package | Usage in Admin | Peer Dep? |
|---------|---------------|-----------|
| `react` (18.3.1) | All components | ✅ Peer |
| `react-dom` (18.3.1) | Rendering | ✅ Peer |
| `react-router-dom` (6.22.3) | Route guards, navigation, `useSearchParams`, `useNavigate` | ✅ Peer |
| `@supabase/supabase-js` (2.39.3) | All database operations | ✅ Peer |
| `lucide-react` (0.344.0) | Icons throughout all admin panels | ✅ Peer |
| `recharts` (3.7.0) | Analytics dashboards, usage charts, performance metrics | ✅ Peer (optional — only needed for analytics components) |
| `tailwind-merge` (2.2.1) | Class merging in UI components | ✅ Peer |
| `clsx` (2.1.0) | Conditional class names | ✅ Peer |
| `class-variance-authority` (0.7.0) | Variant-based component styling | ✅ Peer |
| `html2canvas` (1.4.1) | Screenshot/export functionality | Bundle (only BugManagementPanel) |
| `jspdf` (2.5.1) | PDF export | Bundle (only specific panels) |

### 6.2 Internal Contexts/Utilities the Admin Code Depends On

| Dependency | File | Used By | Extraction Impact |
|-----------|------|---------|-------------------|
| `AuthContext` | `src/context/AuthContext.tsx` | All admin pages (provides `user`, `isLoading`) | **Must abstract.** Universal package needs an auth adapter interface. |
| `PropertyContext` | `src/context/PropertyContext.tsx` | Group admin, Home admin (provides `currentHome`, `selectedHome`, `setCurrentHome`) | **Domain-adaptable.** Replace with generic "entity context" adapter. |
| `ThemeContext` | `src/context/ThemeContext.tsx` | Settings page (provides `theme`, `setTheme`) | **Universal.** Port or require as peer. |
| `supabaseClient` | `src/lib/supabaseClient.ts` | All database services | **Must abstract.** Universal package should accept a Supabase client instance, not import its own. |
| `ErrorBoundary` | `src/components/ErrorBoundary.tsx` | AdminLayout | **Universal.** Generic error boundary. |
| `AsyncErrorBoundary` | `src/components/common/AsyncErrorBoundary.tsx` | Admin pages | **Universal.** Async error handling wrapper. |
| `LoadingState` / `EmptyState` | `src/components/common/EmptyState.tsx` | Admin pages | **Universal.** Loading and empty state components. |
| `SkeletonTable` | `src/components/common/SkeletonTable.tsx` | Admin panels | **Universal.** Loading skeleton for tables. |
| `ActivityFeed` | `src/components/common/ActivityFeed.tsx` | Admin dashboard | **Universal.** Activity feed component. |
| `logger` | `src/lib/logger.ts` | professionalTierService | **Universal.** Logging utility. |
| `cacheManager` | `src/lib/utils/cacheManager.ts` | Settings page | **Universal.** Cache control utility. |

### 6.3 shadcn/ui Components Used

Admin panels use standard shadcn/ui components from `src/components/ui/`:
- `Button`, `Card`, `CardHeader`, `CardContent`, `Dialog`, `Input`, `Select`, `Badge`, `Tabs`, `TabsContent`, `Tooltip`

These are **peer dependencies** — the consuming app must have shadcn/ui installed with Tailwind.

---

## 7. Gaps & Inconsistencies

### 7.1 Schema Issues — Fix Before Extraction

| Issue | Details | Recommendation |
|-------|---------|----------------|
| **Dual admin check: `is_super_admin` flag + `PLATFORM_ADMIN` role** | `user_profiles.is_super_admin` (boolean) and `user_roles.role_type = 'PLATFORM_ADMIN'` are checked independently and in parallel. They can be out of sync. `PlatformAdminRoute` allows access if EITHER is true. | **Unify to one mechanism.** The universal package should use only the `user_roles` table. Drop the `is_super_admin` flag. |
| **`role` vs `role_type` column on `user_roles`** | The table was created with `role` column (`006_user_profiles_and_roles.sql`), but all RLS policies reference `role_type`. Fix migration `20260205` added `role_type` and copied data. Both columns now exist. | **Universal package should have only `role_type` from the start.** Do not port the bug or its fix. |
| **Hardcoded email in migration** | `20260201_ensure_superadmin_group_access.sql` hardcodes `theman@danielgolden.com` as super admin. | **Do not port.** Universal package bootstrap should not contain any specific email addresses. |
| **Hardcoded org IDs in bootstrap** | `010_add_bootstrap_admin_function.sql` creates two orgs with fixed UUIDs (`00000000-0000-0000-0000-000000000001` for FireShield, `00000000-0000-0000-0000-000000000002` for HomeDoc). | **Parameterize.** Bootstrap function should accept org name/slug as parameters, not hardcode them. |
| **Organization table column drift** | The migration creates `organizations` with `slug`, `primary_color`, `secondary_color`, `website_url`, `tier`, `settings` (jsonb). The TypeScript `Organization` interface uses `organization_type`, `contact_email`, `contact_phone`, `address`, `website`, `current_tier`, `white_label_enabled`, `branding_config`. These don't fully align. | **Reconcile during extraction.** Define a clean schema that matches the TypeScript types. |
| **Organization member role column** | Migration defines `organization_members.role` as `text DEFAULT 'member'`. TypeScript type defines `OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'`. These are inconsistent (lowercase 'member' default vs uppercase MEMBER type). | **Standardize to uppercase in universal package.** |

### 7.2 Architectural Inconsistencies

| Issue | Details | Recommendation |
|-------|---------|----------------|
| **Permission checks are scattered** | Five different check mechanisms (see Section 3.2). No single entry point. Admin pages call different combinations of checks. | **Build a centralized `can(user, action, resource)` function** in `admin-core`. All route guards and component checks should delegate to it. |
| **Circuit breaker duplication** | The same circuit breaker implementation is copy-pasted in both `adminTierService.ts` (lines 6-40) and `propertyAccessService.ts` (lines 5-39). | **Extract into a shared utility** in `admin-core`. |
| **Home admin is mostly placeholder** | 5 of 7 tabs in the Home Admin page are "coming soon" placeholders with no functionality. The overview tab works but data-sharing, access-control, service-providers, privacy, audit-log, and settings tabs are empty. | **Decide before extraction:** either build these out in the universal package (as they represent important individual-tier capabilities) or explicitly mark them as v2 scope. |
| **Three different entity detail patterns** | User → modal (`UserDetailModal`), Org → modal (`EditOrganizationModal`), Property → inline panel (`PropertyDetailPanel`). | **Standardize on one pattern** in the universal package. |
| **Admin layout divergence** | Platform admin uses `PlatformAdminLayout` (with sidebar nav). Group admin and Home admin use `AdminLayout` (with breadcrumbs). These are different components with different structures. | **Unify into a single configurable layout** in `admin-ui` that supports both sidebar and breadcrumb modes. |
| **No TypeScript enums for roles** | Roles are TypeScript union types (`'PLATFORM_ADMIN' | 'ORG_ADMIN' | ...`). The database column is `text`. There's no runtime validation that a role value is valid. | **Consider a roles table** in the universal package so roles are data-driven and validated at the DB level. |

### 7.3 Missing Capabilities That Should Exist Before Extraction

These are drawn from the companion gap analysis (`GAPS.md`). The most critical:

| Gap | Impact on Universal Package |
|-----|---------------------------|
| **No pagination** | All list views load all records. Will break at scale. |
| **No bulk actions** | No checkbox selection or batch operations on any entity. |
| **No impersonation** | Platform admins can't debug user-specific issues. |
| **No feature flags** | No database-driven flag system. |
| **No GDPR data export/erasure** | Incomplete `exportUserData()`, no erasure flow. |
| **No unified data table** | Each admin panel builds its own table markup. |
| **No audit log export** | Audit logs are view-only, no CSV/JSON export. |
| **No before/after in audit log** | Can't see what changed, only that something changed. |

---

## Summary

### Extraction scope by the numbers

| Category | Count |
|----------|-------|
| Total admin components | 88 (in `admin/`) + 1 (in `group-admin/`) + 6 (in `auth/`) |
| Components → UNIVERSAL | 24 |
| Components → DOMAIN-ADAPTABLE | 27 |
| Components → HOMEDOC-SPECIFIC | 32 |
| Database tables → UNIVERSAL | 17 |
| Database tables → DOMAIN-ADAPTABLE | 3 |
| Services → UNIVERSAL | 7 |
| Services → DOMAIN-ADAPTABLE | 4 |
| Services → HOMEDOC-SPECIFIC | 2 |
| Migrations to port (fully or adapted) | 5 |
| Migrations to skip | 5 |
| Schema issues to fix before extraction | 6 |
| Architectural issues to fix | 6 |

### Highest-value extraction targets

1. **RBAC system** (`roleService.ts`, `adminTierService.ts`, `PlatformAdminRoute`, `user_roles` table) — core of any admin
2. **Organization management** (`organizationService.ts`, `OrganizationManagementPanel`, `OrganizationMembersModal`) — B2B foundation
3. **Audit logging** (`logAdminAction()`, `AuditLogViewer`, `admin_audit_log` table) — compliance requirement
4. **Admin layout & shared components** (`AdminLayout`, `StatCard`, `DatabaseConnectionIndicator`) — UI foundation
5. **Module access control** (`moduleService.ts`, `platform_modules`, `module_access_control`) — feature gating
6. **System settings** (`SystemSettingsPanel`, `admin_settings`) — runtime configuration
7. **Notification templates** (`notificationTemplateService.ts`, `NotificationManagementPanel`) — communication foundation
