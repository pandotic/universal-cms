# Migration Notes: HomeDoc Admin → Universal CMS

> **Updated 2026-04-08:** The 8 critical admin features (feature flags, account status, audit diffs, audit export, unified RBAC, pagination, user suspension, centralized permissions) have now been built directly into HomeDoc. The universal-cms packages can be updated from this battle-tested implementation.

## What was extracted

### Fully extracted (into @universal-cms packages)

| HomeDoc Source | Package | Notes |
|---------------|---------|-------|
| `roleService.ts` | `admin-core/rbac` | Unified into single RBAC module. Dropped dual `is_super_admin` + `PLATFORM_ADMIN` check — now uses only `user_roles.role_type`. |
| `adminTierService.ts` | `admin-core/rbac` | Tier detection and hierarchy. Renamed `HOME_ADMIN` → `ENTITY_ADMIN` for genericity. Removed circuit breaker duplication (extracted to shared pattern). |
| `propertyAccessService.ts` (admin parts) | `admin-core/rbac` + `admin-core/services` | Admin-specific functions extracted. Property-specific functions left in HomeDoc. |
| `organizationService.ts` | `admin-core/services` | Org CRUD and member management. |
| `PlatformAdminRoute.tsx` | `admin-ui/shared` | Parameterized: accepts `supabase`, `user`, `authLoading` as props instead of importing from context. |
| `AdminLayout.tsx` | `admin-ui/shared` | Added CSS variable theming (`--admin-bg`, `--admin-link`). Added optional `sidebar` slot. |
| `StatCard.tsx` | `admin-ui/shared` | Unchanged pattern, added `subtitle` prop. |
| `AuditLogViewer.tsx` | `admin-ui/shared` | Added export button, before/after diff display. |
| `UserManagementPanel.tsx` | `admin-ui/platform` | Simplified: pagination added, account status management. Dropped HomeDoc-specific completion score filters. |
| `OrganizationManagementPanel.tsx` | `admin-ui/platform` | Extracted core pattern. |
| Migration `004_organizations_and_modules.sql` | `admin-schema/002` | Split into clean table definitions. Added `feature_flags` table (new). |
| Migration `006_user_profiles_and_roles.sql` | `admin-schema/001` | Fixed `role` → `role_type` from the start. Added `account_status` column (new). |
| Migration `010_bootstrap_admin.sql` | `admin-schema/003` | Parameterized: removed hardcoded org names and email addresses. |
| All admin RLS policies | `admin-schema/rls/` | Consolidated and cleaned. Uses `is_platform_admin()` function consistently. |

### New in universal package (not in HomeDoc)

| Feature | Package | Notes |
|---------|---------|-------|
| `feature_flags` table + service + UI | All three | Database-driven feature flags with per-user, per-org, per-role targeting and rollout percentages. |
| `account_status` column | `admin-schema` | Three states: `active`, `suspended`, `deactivated`. HomeDoc only had `is_active` flags on individual roles. |
| `before_state` / `after_state` on audit log | `admin-schema` | Structured before/after diffs for compliance. HomeDoc's audit log only had `action_details`. |
| `EntityAdapter` pattern | `admin-core/adapters` | Generic entity management. HomeDoc's property panels are hardcoded to homes. |
| `EntityManagementPanel` | `admin-ui/shared` | Paginated entity list driven by adapter config. |
| Audit log export | `admin-ui/shared` | JSON export button on `AuditLogViewer`. |
| `updateAccountStatus()` service | `admin-core/services` | Suspend/reactivate users with audit trail. |
| Dashboard app scaffold | `apps/dashboard` | Oversight dashboard for connected apps. |

### What was left in HomeDoc (and why)

| HomeDoc Component/Service | Why Not Extracted |
|--------------------------|-------------------|
| All API management panels (18 components) | HomeDoc-specific API integrations (RentCast, HomeSpy, Google Maps, etc.). No universal pattern — each app has different APIs. |
| `AIModelManagementPanel` | HomeDoc AI extraction pipeline. |
| `TCOKnowledgeBasePanel` | HomeDoc TCO calculator data. |
| `RiskRecommendationsPanel` | HomeDoc risk assessment domain. |
| `CountyCacheManager` | HomeDoc county risk cache. |
| `DemoHomeManagementPanel` | HomeDoc demo data. |
| `BulkPropertyRefreshPanel` | HomeDoc RentCast integration. |
| `HealthScoreConfigPanel` | HomeDoc health scoring. |
| `HomeTestingProductsPanel` | HomeDoc testing products. |
| `DocumentManagementAdminDashboard` | HomeDoc document extraction. |
| `HomeownerOptInPanel` | HomeDoc homeowner opt-in. |
| `MyCustomersPanel` | HomeDoc customer management (could be extracted as a pattern in v2). |
| `ContractorLayout` / `ContractorSidebarNav` | HomeDoc contractor portal. |
| `dataSharingService.ts` | HomeDoc data sharing preferences. |
| `buildingService.ts` | HomeDoc building management. |
| `professionalTierService.ts` (tier definitions) | Pricing and limits are HomeDoc-specific. The universal package provides the tier infrastructure but not the tier definitions. |
| Migration `20260201_ensure_superadmin_group_access.sql` | Contains hardcoded email address. Universal package handles admin bootstrap via RPC function instead. |
| Migration `20260205_fix_user_roles_column_mismatch.sql` | Bug fix. Universal schema has correct column names from the start. |
| Migration `20260325_tco_admin_knowledge_base.sql` | HomeDoc-specific domain table. |

## What HomeDoc would need to change to consume the universal package

This is a **future migration** — do not execute it now. When ready:

1. **Install packages**: `npm install @universal-cms/admin-core @universal-cms/admin-ui`

2. **Replace roleService.ts**: Import `isPlatformAdmin`, `grantRole`, `revokeRole`, `logAdminAction`, `getAuditLogs` from `@universal-cms/admin-core` instead of the local service.

3. **Replace adminTierService.ts**: Import `detectAdminTier`, `canAccessTier` from `@universal-cms/admin-core`.

4. **Replace PlatformAdminRoute**: Use `<PlatformAdminRoute>` from `@universal-cms/admin-ui`, passing `supabase`, `user`, and `authLoading` as props.

5. **Replace AdminLayout, StatCard, AuditLogViewer**: Import from `@universal-cms/admin-ui`.

6. **Create a home adapter**: Define `EntityAdapter` for the `homes` table and use `EntityManagementPanel` instead of `PropertyManagementPanel` for basic property listing.

7. **Keep HomeDoc-specific panels**: All 32 HomeDoc-specific components stay in the HomeDoc codebase. They compose alongside the universal components.

8. **Database migration**: Add `account_status` column to `user_profiles`. Add `before_state`/`after_state` columns to `admin_audit_log`. Add `feature_flags` table. These can be incremental migrations.

9. **Remove dual admin check**: Drop the `is_super_admin` column from `user_profiles`. Use only `user_roles.role_type = 'platform_admin'`. Update any code that calls `isSuperAdmin()` to call `isPlatformAdmin()` instead.

10. **Remove `role` column**: After confirming all code uses `role_type`, drop the legacy `role` column from `user_roles`.

**Estimated effort**: 2-3 days for a developer familiar with the codebase. Low risk — mostly import path changes and prop additions.
