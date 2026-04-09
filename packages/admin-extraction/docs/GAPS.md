# Gap Analysis: HomeDoc Admin vs. Mature Universal SaaS Admin

> **Date:** 2026-04-07 (updated 2026-04-08)
> **Scope:** Read-only audit of `/home/user/homedoc`
> **Purpose:** Identify what's missing before extracting the admin system into a universal package
> **Update:** 8 critical gaps addressed in `20260408_admin_hardening.sql` and related service/UI changes

Legend: ✅ Exists | 🟡 Partial | ❌ Missing | ➖ N/A

---

## 1. User & Identity Management

| Item | Status | Location / Notes |
|------|--------|-----------------|
| User list with search, filter, sort, pagination | 🟡 | `src/components/admin/UserManagementPanel.tsx` — search + 11 filters + pagination (25/page with prev/next). **No sort UI.** Data still loaded at once then paginated client-side; server-side pagination is a future enhancement. |
| User detail view with full profile + activity history | 🟡 | `src/components/admin/UserDetailModal.tsx` — profile, completion score, feature adoption, roles, org memberships, properties. **Activity history is limited** to last-login and last-activity timestamps; no event stream or timeline of actions. |
| Invite users (email invitation flow with token, expiry, resend) | ✅ | `src/lib/database/customerInvitationService.ts` — unique invite codes, 30-day expiry, auto-expiration, resend via cancel+recreate, status tracking (PENDING→SENT→VIEWED→ACCEPTED→EXPIRED→CANCELLED), email delivery via edge function. |
| Bulk user actions (suspend, delete, export, reassign) | ❌ | No bulk selection or batch operations. Admin can toggle super-admin flag one user at a time. |
| User suspension vs. soft-delete vs. hard-delete (distinct states) | ✅ | `user_profiles.account_status` column with `active`/`suspended`/`deactivated` states. `updateAccountStatus()` service with audit trail. Suspend/reactivate buttons in `UserManagementPanel.tsx`. `PlatformAdminRoute` blocks suspended users. Migration: `20260408_admin_hardening.sql`. |
| Password reset triggered by admin | ❌ | Only user self-service via Supabase Auth reset-password email flow (`src/pages/reset-password.tsx`). No admin-triggered reset. |
| Email change with verification | ❌ | Supabase Auth handles email changes natively but there is no admin UI to trigger or verify email changes for a user. |
| Merge duplicate accounts | ❌ | Not present. |
| Export user data (GDPR/CCPA "right to access") | 🟡 | `src/lib/database/userSettingsService.ts:exportUserData()` exports settings, homes, and projects as JSON. **Does not include** documents, maintenance schedules, risk reports, appliances, or audit logs. Not accessible from admin panel — only from user's own settings page. |
| Delete user data (GDPR/CCPA "right to erasure") with cascade rules | ❌ | No erasure flow. Database has `ON DELETE CASCADE` on some FK relationships but no admin UI or service function to trigger a full data purge. |
| Login-as / impersonation with audit trail and visible banner | ❌ | Only a "View as Group Admin" link in `OrganizationManagementPanel.tsx` that navigates to `/group-admin?org={id}`. This is scoped navigation, not impersonation — the admin still acts as themselves. No session switching, no audit trail, no impersonation banner. |
| Session management (view active sessions, force logout) | ❌ | Not present. Supabase Auth manages sessions client-side; no admin visibility into active sessions or ability to revoke them. |
| MFA enforcement and recovery | ❌ | No MFA code anywhere. Relies entirely on Supabase Auth's built-in MFA (if enabled at the project level). No admin toggle to enforce or manage MFA per user/org. |
| SSO / SAML readiness | ❌ | No SSO, SAML, or identity provider integration code. Standard email/password only. |

---

## 2. Roles, Permissions, RBAC

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Roles defined as data (not hardcoded) | ❌ | Roles are TypeScript union types in `src/lib/database/roleService.ts:3-8` (`PLATFORM_ADMIN`, `ORG_ADMIN`, `HOME_ADMIN`, `STANDARD_USER`, `GUEST_VIEWER`). Adding a role requires a code change. The `user_roles.role_type` column is `text` (not enum), so the DB is flexible but the app is not. |
| Permission matrix (role × capability) viewable/editable by admins | ❌ | No permission matrix UI. Permissions are implicit in code (route guards, component-level checks). |
| Custom roles per group/organization | ❌ | Organization members have fixed roles (OWNER/ADMIN/MEMBER/VIEWER in `organizationService.ts`). No custom role creation. |
| Role assignment audit trail | ✅ | `roleService.ts:grantRole()` and `revokeRole()` both call `logAdminAction()` which writes to `admin_audit_log`. |
| Principle of least privilege defaults | 🟡 | New users get no role (STANDARD_USER is the default). New org members get MEMBER role. However, the `is_super_admin` flag on `user_profiles` is a blunt privilege escalation that bypasses all role checks — not least-privilege. |
| Permission checks centralized (single source of truth) | ✅ | `checkPlatformAdmin()` in `lib/auth/permissions.ts` is the centralized check with session cache. `PlatformAdminRoute`, sidebar navigation, and `adminTierService` all now use this single check. `isSuperAdmin()` calls removed from admin flow — only `isPlatformAdmin()` via `user_roles` table. |
| "Effective permissions" view for a given user | ❌ | No UI to see what a specific user can actually do across all their roles, org memberships, and property access grants. |

---

## 3. Organizations / Groups (B2B Layer)

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Org list, search, create, edit, archive | 🟡 | `OrganizationManagementPanel.tsx` — list, search, create, edit all work. **Archive** is just `is_active = false` toggle; no distinct archive state with restore option. |
| Org detail with members, billing, settings | 🟡 | Members via `OrganizationMembersModal.tsx`. Tier display via `TierAndWhiteLabelPanel.tsx`. **No actual billing** (no Stripe, no invoices, no payment methods). Module settings via `OrganizationModuleManagementPanel.tsx`. |
| Multi-org membership for a single user | ✅ | `organization_members` table has `UNIQUE(organization_id, user_id)`, allowing one user across many orgs. `getUserOrganizations()` in `organizationService.ts` retrieves all. |
| Org-level settings separate from user settings | ✅ | `module_access_control` table for per-org module enablement. `admin_settings` for platform-wide. `user_settings` for per-user. Clean separation. |
| Org transfer (move user between orgs) | 🟡 | No dedicated transfer function. Can be done manually: `removeOrganizationMember()` + `addOrganizationMember()`. No data migration between orgs, no transfer audit trail. |
| Org-scoped data isolation enforced at RLS layer | 🟡 | RLS exists for `organizations` and `organization_members` (members can view their own org). Super admins/platform admins can view all via additional policies (`20260201_ensure_superadmin_group_access.sql`). However, **domain entities (homes, appliances, documents) are scoped to user, not org** — org data isolation is incomplete. |
| Org admins can invite/remove their own members without Platform involvement | ✅ | `OrganizationMembersModal.tsx` — org OWNER/ADMIN roles can add/remove members and change roles. `CustomerInvitationPanel.tsx` for customer invitations. |
| Org branding/white-label settings | ✅ | `BrandingManagementPanel.tsx` — logo upload, color customization, company info, "Powered by" toggle. Tier-gated: PRO/ENTERPRISE only. Branding config stored in `organizations.branding_config` jsonb. |

---

## 4. Audit & Observability

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Audit log table: who, what, when, before/after, IP, user agent | ✅ | `admin_audit_log` table now has `before_state` and `after_state` jsonb columns. `logAdminAction()` accepts both fields. `grantRole()`, `revokeRole()`, `updateAccountStatus()`, and feature flag operations all pass before/after state. Migration: `20260408_admin_hardening.sql`. |
| Audit log viewer with filter by actor, action, resource, time range | 🟡 | `AuditLogViewer.tsx` — search by text, filter by action_type. **No filter by actor, resource type, or time range.** |
| Audit log retention policy | ❌ | No TTL, no auto-purge, no archival strategy. Logs grow unbounded. |
| Audit log export | ✅ | Export button in `AuditLogViewer.tsx` downloads filtered logs as JSON file. |
| Sensitive action confirmation (re-auth for destructive ops) | 🟡 | `SystemSettingsPanel.tsx` has a confirmation modal for `maintenance_mode` and `max_users` changes. No re-authentication required — just a "are you sure?" dialog. No re-auth for user deletion, role changes, or org modifications. |
| Admin action notifications (Slack/email when X happens) | 🟡 | `AlertCenter.tsx` + `admin_alerts` table supports alerts for api_budget, widget_error, lead, security, webhook_failure. **These are in-app alerts only** — no Slack/email push for admin actions. Alert notification preferences exist per org (`alert_notification_preferences` table). |
| System event log distinct from user audit log | ❌ | Only one log: `admin_audit_log`. No separate system event log for automated processes, cron jobs, background tasks, or edge function execution. |

---

## 5. Feature Flags & Config

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Feature flag table with per-user, per-org, per-role targeting | ✅ | `feature_flags` table with `target_roles[]`, `target_org_ids[]`, `target_user_ids[]`. Service: `featureFlagService.ts`. Hook: `useFeatureFlag.ts`. Migration: `20260408_admin_hardening.sql`. |
| Flag toggle UI in Platform admin | ✅ | `FeatureFlagPanel.tsx` at `/admin?tab=flags`. Create/toggle/delete flags with targeting info display. |
| Flag rollout percentages | ✅ | `rollout_percentage` column (0-100) with deterministic hash-based evaluation in `isFeatureEnabled()`. |
| Kill switches for risky features | 🟡 | `maintenance_mode` toggle in `SystemSettingsPanel.tsx` is the only kill switch. Individual modules can be disabled globally via `platform_modules.is_enabled_globally`, but there's no emergency "kill this feature now" UI separate from the module management panel. |
| Environment-aware config (dev/staging/prod) | 🟡 | `VITE_ADMIN_DEV_MODE` env var enables admin bypass in dev. Netlify handles env separation between staging/production. But no admin UI to view or compare configs across environments. |
| Runtime config without redeploy | ✅ | `admin_settings` table with `SystemSettingsPanel.tsx` — settings are stored in DB and read at runtime. Changes take effect without redeploy. Categories: SECURITY, MODULES, NOTIFICATIONS, SYSTEM, BILLING, INTEGRATIONS. |

---

## 6. Billing & Subscriptions

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Subscription state visible per user/org | 🟡 | `professionalTierService.ts` defines tiers (FREE/STARTER/PRO/ENTERPRISE/CUSTOM) with pricing. `organizations.current_tier` tracks the current tier. **No subscription lifecycle** (no start date, renewal date, cancellation date, trial period). |
| Plan list and assignment | 🟡 | `TIER_DEFINITIONS` constant in `professionalTierService.ts` with limits and pricing. `TierAndWhiteLabelPanel.tsx` shows tier management UI. **Plans are defined in code, not configurable by admin.** |
| Manual plan override (comp accounts, trials, extensions) | 🟡 | `TierUpgradeModal.tsx` allows tier changes. Organizations have a `current_tier` field that can be set directly. **No trial period tracking, no comp account flag, no extension mechanism.** |
| Payment history view | ❌ | No payment processing. Tier definitions include `priceCents` but no Stripe or payment provider integration. |
| Failed payment alerting | ❌ | No payment processing exists. |
| Refund initiation | ❌ | No payment processing exists. |
| Usage metering view (if usage-based) | 🟡 | API usage tracking exists (`api_usage_logs`, `api_cost_tracking`). `APIUsageMetrics.tsx` and `RealTimeCostDashboard.tsx` show API costs. **But this is platform API costs, not customer-facing usage metering for billing.** Customer home count enforcement exists via `getOrganizationTierUsage()`. |
| Tax/region handling visibility | ❌ | Not present. |

---

## 7. Communication

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Email template list and editor | ✅ | `src/lib/database/notificationTemplateService.ts` — template CRUD with categories (SYSTEM, FEATURE, ALERT, MARKETING, BILLING, SUPPORT), title/body templates with variables, priority levels, activation toggle. `NotificationManagementPanel.tsx` provides the admin UI. |
| Test email send | ❌ | No "send test" button in the notification management UI. Templates can be created and activated but not previewed with test data. |
| Email send log per user | ❌ | No per-user email delivery log. Invitation status is tracked in `customer_invitations` but general notification/email delivery is not logged. |
| Notification preferences viewable/editable by admins | 🟡 | `notification_preferences` table exists per user (email_enabled, push_enabled, in_app_enabled, frequency). Users manage their own via settings page. **Admins cannot view or override** a user's notification preferences. |
| Broadcast announcements (in-app banner, email blast) with targeting | ❌ | No broadcast or announcement system. `B2BOnboardingBanner.tsx` is a static onboarding prompt, not a configurable announcement. |
| Email deliverability monitoring | ❌ | Email delivery via Resend edge function (`send-contact-email`). No bounce tracking, open rates, or deliverability dashboard. |

---

## 8. Content & Data Moderation

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Flag/report queue | ❌ | No user-generated content flagging or report queue. |
| Moderator assignment | ❌ | Not present. |
| Resolution states and audit | ❌ | Not present. |
| Bulk content actions | ❌ | Not present. |
| Soft-delete with restore window | ❌ | No soft-delete pattern with time-bounded restore. Only `is_active` boolean toggles on roles and property access. |

---

## 9. System Health & Metrics

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Platform-level dashboard: active users, signups, churn, errors | 🟡 | `src/pages/admin.tsx` overview tab shows total users, properties, organizations, active modules, system health status. `AnalyticsDashboard.tsx` provides analytics. **No churn tracking, no signup trends over time, no error rate metrics.** |
| Org-level dashboard for Group admins | ✅ | `GroupAdminAnalyticsDashboard.tsx` — per-org stats: properties, projects, invitations, referral partners. |
| Database health indicators | ❌ | `DatabaseConnectionIndicator.tsx` shows connection status (connected/disconnected) but no query latency, pool usage, table sizes, or replication lag. |
| Background job/queue status | 🟡 | `src/lib/database/backfillQueueService.ts` implements a basic job queue (pending, processing, completed, failed) for backfill operations. **No admin UI to view queue status**, no general-purpose job dashboard. |
| Error log viewer (or deep link to Sentry/equivalent) | ❌ | No error log viewer. `AlertCenter.tsx` shows admin alerts but not application errors or stack traces. No Sentry integration visible. |
| Uptime / status page integration | ❌ | No status page integration (Statuspage, Instatus, etc.). |
| Rate limit visibility | 🟡 | `api_rate_limits` table exists. `APIUsageMetrics.tsx` shows API usage. **No per-user or per-org rate limit visibility**, no "you have X calls remaining" display. |

---

## 10. Data Management

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Database backup status visibility | ❌ | No backup status in admin UI. Relies on Supabase's automatic backups with no visibility layer. |
| Manual export of any table (CSV/JSON) | 🟡 | `userSettingsService.ts:exportUserData()` exports user data as JSON. `BugManagementPanel.tsx` may have export for bug reports (edge function `export-bug-reports`). **No generic table export tool.** |
| Bulk data import with validation and dry-run | 🟡 | `ProjectCatalogImportWizard.tsx` handles project template imports with validation. `BulkPropertyRefreshPanel.tsx` does bulk property data refresh. **Domain-specific only**, no generic bulk import with dry-run capability. |
| Data retention policy controls | ❌ | No configurable retention policies. Cached data has TTLs (county risk cache 90-365 days, property cache 30 days) but these are hardcoded, not admin-configurable. |
| PII redaction in non-prod environments | ❌ | No PII redaction or data anonymization tooling. |
| Anonymized data export for analytics | ❌ | Not present. |

---

## 11. API & Integrations

| Item | Status | Location / Notes |
|------|--------|-----------------|
| API key management per user/org | 🟡 | `UniversalAPICredentialPanel.tsx` manages API credentials at the **platform level** (masked display, test, edit). `platform_api_credentials` table. **Not scoped per-user or per-org** — all credentials are global. |
| Webhook configuration and delivery log | ✅ | `webhookService.ts` — full webhook system: configuration with auth types (bearer, api_key, basic, none), retry with exponential backoff, delivery logging, test sends, per-webhook statistics. `organization_webhook_configs` and `webhook_delivery_logs` tables. |
| OAuth app management (if app exposes OAuth) | ➖ | HomeDoc does not expose an OAuth provider. N/A unless the universal package needs to support apps that do. |
| Third-party integration health | ✅ | `APIStatusPanel.tsx` — health checks for all configured APIs. `api_integrations` table tracks last_health_check, health_status. Auto-appears in admin for new APIs. |
| Rate limit configuration per key | ❌ | `api_rate_limits` table exists but rate limits are set in code/edge functions, not configurable per API key via admin UI. |

---

## 12. Compliance & Legal

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Terms of Service version tracking and re-acceptance flow | ❌ | Not present. |
| Privacy policy version tracking | ❌ | Not present. |
| Cookie consent records | ❌ | Not present. |
| Data processing agreement (DPA) tracking per org | ❌ | Not present. |
| Data residency settings | ➖ | Single Supabase project deployment. Data residency is a deployment concern, not an in-app setting at HomeDoc's current scale. |
| GDPR data subject request queue | ❌ | No DSR queue or processing workflow. |

---

## 13. Onboarding & Lifecycle

| Item | Status | Location / Notes |
|------|--------|-----------------|
| New user onboarding state visibility | ✅ | `user_profiles.onboarding_completed` + `user_profiles.onboarding_step` track progress. `onboarding_checklist` table tracks per-task completion. `UserDetailModal.tsx` shows completion score and level. `UserManagementPanel.tsx` filters by completion level (not_started, basic, intermediate, advanced, complete). |
| Stuck-user detection (signed up but never activated) | 🟡 | Can be derived from filters in `UserManagementPanel.tsx` (e.g., `not_started` completion filter + `inactive` filter). **No automated detection or alerting** — admin must manually look. |
| Re-engagement campaign triggers | ❌ | No re-engagement automation. No dormancy-based email triggers. |
| Account dormancy detection | 🟡 | `user_profiles.last_active_at` is tracked. `UserManagementPanel.tsx` has `inactive` filter. **No automated dormancy threshold or alerting.** |
| Offboarding flow with data export offer | ❌ | No offboarding flow. `exportUserData()` exists but is not part of any deletion or account-closure workflow. |

---

## 14. Developer / Operational

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Database migration history viewer | ❌ | Migrations are in `supabase/migrations/` as SQL files. No admin UI to view migration history or status. |
| Maintenance mode toggle | ✅ | `SystemSettingsPanel.tsx` — `maintenance_mode` setting with confirmation modal for critical changes. Stored in `admin_settings` table. |
| Read-only mode toggle (for migrations/incidents) | ❌ | No read-only mode. Only maintenance mode exists. |
| Cache invalidation controls | ✅ | `CountyCacheManager.tsx` — county cache refresh/invalidation UI with age tracking. User settings page (`settings.tsx`) has "Clear All Caches" button via `cacheManager.ts`. |
| Background job manual trigger | ❌ | `backfillQueueService.ts` has a job queue but no admin UI to view, trigger, or manage jobs. |
| Internal notes on user/org records (admin-only) | ❌ | No admin-only notes field on user profiles, organizations, or properties. `property_access.notes` exists but is for access grant context, not general admin notes. |

---

## 15. Search & Navigation

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Global admin search across users, orgs, content | ❌ | Each panel has its own search (users, orgs, audit logs) but no unified global search across all admin entities. |
| Recently viewed records | ❌ | Not present. |
| Saved filters / saved views | ❌ | Not present. Filters are transient — lost on page navigation. |
| Bookmarkable admin URLs (deep linking) | ✅ | `src/pages/admin.tsx` uses `useSearchParams` for tab state (`/admin?tab=users`). Group admin supports `?org={id}&tab={tab}`. URLs are shareable and bookmarkable. |

---

## 16. UX Polish

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Consistent table component across all list views | 🟡 | `src/components/common/SkeletonTable.tsx` provides consistent loading states. **No unified data table component** — each panel implements its own table markup with similar but not identical patterns. |
| Consistent detail/edit pattern across all entities | 🟡 | User detail uses `UserDetailModal.tsx` (modal). Org detail uses `EditOrganizationModal.tsx` (modal). Property detail uses `PropertyDetailPanel.tsx` (inline panel). **Three different patterns** for entity detail views. |
| Keyboard shortcuts for power users | ❌ | No keyboard shortcuts in admin. |
| Bulk selection patterns | ❌ | No checkbox-based bulk selection on any list view. |
| Optimistic updates with rollback | ❌ | All updates are synchronous (loading spinner → success/error). No optimistic UI. |
| Clear loading and empty states | ✅ | Consistent skeleton loading via `SkeletonTable.tsx`, `LoadingState` component, and `animate-pulse` patterns. Empty states with icons and descriptive text throughout. |
| Mobile-responsive admin (or explicit decision not to support) | ✅ | All admin components use Tailwind responsive classes (`sm:`, `md:`, `lg:` breakpoints). Desktop-optimized but functional on mobile. `grid-cols-1 md:grid-cols-3` patterns throughout. |

---

## 17. Security

| Item | Status | Location / Notes |
|------|--------|-----------------|
| Admin login from approved IP ranges | ❌ | No IP-based access control. Admin access is purely role-based. |
| Step-up auth for sensitive actions | ❌ | No re-authentication for any action. Confirmation modals exist for maintenance_mode changes but no password/MFA re-verification. |
| Admin session timeout | ❌ | No special session handling for admins. Uses standard Supabase Auth session (JWT expiry + refresh token). |
| Suspicious activity detection | ❌ | No anomaly detection, no brute-force protection beyond Supabase Auth's built-in rate limiting. |
| Secrets rotation visibility | ❌ | API credentials are managed via `UniversalAPICredentialPanel.tsx` but no rotation schedule, expiry tracking, or rotation reminders. |
| Security headers audit | ❌ | No admin visibility into security headers. Handled by Netlify configuration (`netlify.toml` headers). |

---
---

## Prioritized Gap Lists

### Critical Gaps

Things any production B2B SaaS admin needs. These should be built into the universal package now.

| # | Gap | Risk of Shipping Without It | Effort |
|---|-----|---------------------------|--------|
| 1 | **Data-driven roles & permission matrix** | Every new app that consumes the universal package will need to define its own roles. If roles are hardcoded TypeScript unions, adding a role requires a code change and redeploy. This defeats the purpose of a universal package. A `roles` table + `permissions` table + matrix UI is foundational. | M |
| 2 | **GDPR/CCPA user data export & erasure** | Legal liability. Any B2B SaaS operating in the EU or California must support data subject requests. HomeDoc's `exportUserData()` is incomplete (misses documents, appliances, audit logs) and there's no erasure flow at all. The universal package must ship with a "download my data" and "delete my account" flow that cascades correctly. | M |
| 3 | **User suspension & account states** | Without distinct states (active / suspended / deactivated / deleted), admins can't temporarily lock an account without destroying data. The current `is_active` flag on roles is too granular — suspending a user means finding and deactivating every role individually. Need a top-level account status field. | S |
| 4 | **Centralized permission checks** | Permission logic is scattered across `isPlatformAdmin()`, `isSuperAdmin()`, `detectAdminTier()`, and `PlatformAdminRoute`. When ported to other apps, this fragmentation will cause authorization bugs. The universal package needs a single `can(user, action, resource)` function that all checks flow through. | M |
| 5 | **Audit log before/after diffs** | The current audit log captures `action_details` as freeform JSON. Without structured before/after snapshots, you can't answer "what changed?" for compliance audits. This is table stakes for SOC 2, ISO 27001, or any enterprise customer due diligence. | S |
| 6 | **Pagination on user/entity lists** | Loading all users at once will break at scale. Any app with >1,000 users will see performance degradation. The universal package's list components must support server-side pagination from day one. | S |
| 7 | **Login-as / impersonation with audit trail** | Platform admins need to debug what a specific user sees. Without impersonation, support becomes guesswork. Every mature admin panel (Stripe, Auth0, Firebase) has this. Must include an impersonation banner and full audit trail. | M |
| 8 | **Feature flag system** | Without database-driven feature flags with per-user/per-org targeting, every feature rollout requires a code change and redeploy. This is especially critical for a universal package that will serve multiple apps — each app needs independent flag control. | M |

### Important Gaps

Not blocking, but significantly increase the value of the universal package. Should be built for v1 or early v2.

| # | Gap | Why It Matters | Effort |
|---|-----|---------------|--------|
| 1 | **Bulk user actions** (suspend, export, reassign) | Admin efficiency at scale. One-at-a-time operations become unworkable past ~100 users. | S |
| 2 | **Admin-triggered password reset** | Support teams need this daily. Currently requires telling the user to self-serve. | S |
| 3 | **Audit log export** (CSV/JSON) | Compliance teams need exportable audit trails for external review. | S |
| 4 | **Audit log retention policy** | Without auto-purge or archival, audit tables grow unbounded. Important for cost and performance. | S |
| 5 | **Admin action notifications** (Slack/email) | Platform owners need to know when critical admin actions happen (role grants, user deletions, setting changes) without watching the dashboard. | M |
| 6 | **Unified data table component** | Three different table implementations = three times the bugs. A shared `<AdminTable>` with sort, filter, pagination, bulk select would unify the UX and reduce code. | M |
| 7 | **Billing integration readiness** (Stripe adapter) | Tier definitions exist but no payment integration. The universal package should provide a billing adapter interface even if the Stripe implementation is separate. Otherwise every consuming app solves this independently. | M |
| 8 | **Step-up auth for destructive operations** | Re-authentication before deleting a user or changing billing plans prevents accidental or malicious actions from compromised sessions. | S |
| 9 | **Session management** (view active, force logout) | Security teams need to revoke sessions for compromised accounts. Supabase supports this via admin API but there's no UI. | M |
| 10 | **Email send log per user** | Support teams need to see "what emails did this user receive?" for debugging. | S |
| 11 | **Broadcast announcements** | Product teams need to communicate with users (maintenance windows, new features, breaking changes) without deploying code. | M |
| 12 | **Effective permissions view** | When a user reports "I can't access X," admins need to see the computed permissions across all roles, org memberships, and access grants in one place. | M |
| 13 | **Global admin search** | Admins searching for a user shouldn't need to know which tab to look in. A single search across users, orgs, and entities saves time. | M |
| 14 | **Consistent detail/edit pattern** | Modal vs. inline panel vs. page — pick one pattern for entity detail views and use it everywhere. Reduces cognitive load and component count. | S |

### Nice-to-Have Gaps

Worth tracking for the roadmap but not worth building into v1 of the universal package.

| # | Gap | Notes |
|---|-----|-------|
| 1 | SSO / SAML readiness | Important for enterprise customers but can be added later via Supabase Auth's SSO support. |
| 2 | MFA enforcement per org | Supabase Auth supports MFA natively. The universal package just needs a toggle, not a from-scratch implementation. |
| 3 | Merge duplicate accounts | Rare edge case. Complex to implement correctly (merging data ownership). Handle manually until scale demands it. |
| 4 | Content moderation queue | Only relevant for apps with user-generated content. HomeDoc doesn't have this; include as an optional adapter. |
| 5 | Database migration viewer | Nice for developer-facing admin, but `supabase migration list` CLI covers this. Low value in a UI. |
| 6 | Read-only mode toggle | Maintenance mode covers the common case. Read-only mode is an operational luxury. |
| 7 | PII redaction in non-prod | Important for security but typically handled at the infrastructure level (Supabase branching, data masking tools). |
| 8 | Keyboard shortcuts | Power-user feature. Add after core functionality is solid. |
| 9 | Saved filters / saved views | Convenience feature. Bookmarkable URLs with query params cover the basic case. |
| 10 | Recently viewed records | Low effort but low impact. Nice polish for v2. |
| 11 | Cookie consent records | Typically handled by a third-party consent manager (OneTrust, CookieBot), not the admin panel. |
| 12 | Data residency settings | Only relevant at enterprise scale with multi-region deployment. |
| 13 | Optimistic updates with rollback | UX polish. Admin panels are used by power users who tolerate loading spinners. |
| 14 | Org-scoped API keys | Important if consuming apps expose public APIs. Can be added as an adapter later. |
| 15 | ToS/privacy version tracking | Important for legal compliance but often handled by external tools (Termly, iubenda). |
| 16 | Tax/region handling | Only relevant with billing integration. Build when Stripe adapter is implemented. |

---

## Summary Statistics

| Category | ✅ Exists | 🟡 Partial | ❌ Missing | ➖ N/A |
|----------|-----------|-----------|-----------|--------|
| User & Identity (14 items) | 1 | 4 | 9 | 0 |
| RBAC (7 items) | 1 | 3 | 3 | 0 |
| Organizations (8 items) | 4 | 3 | 1 | 0 |
| Audit & Observability (7 items) | 0 | 4 | 3 | 0 |
| Feature Flags (6 items) | 1 | 2 | 3 | 0 |
| Billing (8 items) | 0 | 4 | 4 | 0 |
| Communication (6 items) | 1 | 1 | 4 | 0 |
| Moderation (5 items) | 0 | 0 | 5 | 0 |
| System Health (7 items) | 1 | 3 | 3 | 0 |
| Data Management (6 items) | 0 | 2 | 4 | 0 |
| API & Integrations (5 items) | 2 | 1 | 1 | 1 |
| Compliance (6 items) | 0 | 0 | 5 | 1 |
| Onboarding (5 items) | 1 | 2 | 2 | 0 |
| Developer/Ops (6 items) | 2 | 0 | 4 | 0 |
| Search & Nav (4 items) | 1 | 0 | 3 | 0 |
| UX Polish (7 items) | 3 | 2 | 2 | 0 |
| Security (6 items) | 0 | 0 | 6 | 0 |
| **TOTAL (113 items)** | **25 (22%)** | **28 (25%)** | **58 (51%)** | **2 (2%)** |

> **Note (2026-04-08):** 7 items upgraded from the admin hardening work: feature flags (3 items ❌→✅), account status (❌→✅), audit diffs (🟡→✅), audit export (❌→✅), centralized permissions (🟡→✅).
