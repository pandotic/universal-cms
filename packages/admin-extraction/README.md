# HomeDoc Admin Extraction

This directory contains the planning artifacts for extracting HomeDoc's three-tier admin system into a universal, reusable package set.

## Contents

| File | Purpose |
|------|---------|
| `GAPS.md` | Gap analysis: HomeDoc admin vs. mature SaaS admin (113 items, 17 categories) |
| `AUDIT.md` | Full extraction audit: surface area, data layer, RBAC, features, universal/domain split |
| `MIGRATION_NOTES.md` | What was extracted, what was left, and what HomeDoc needs to change to consume the packages |
| `skill/admin-panel/SKILL.md` | Claude Code skill for installing and configuring the universal admin in a new project |

## The universal-cms packages

Built at `../universal-cms/`:

```
universal-cms/
├── packages/
│   ├── admin-core/          # Headless: types, RBAC, hooks, services, entity adapters
│   ├── admin-ui/            # React components: layout, route guards, panels
│   └── admin-schema/        # Supabase migrations, RLS policies, seed data
└── apps/
    └── dashboard/           # Oversight dashboard for connected apps
```

### Package summary

| Package | What it provides |
|---------|-----------------|
| `@universal-cms/admin-core` | Types (`AdminUser`, `Organization`, `UserRole`, `FeatureFlag`, etc.), RBAC (`isPlatformAdmin`, `detectAdminTier`, `grantRole`, `revokeRole`), hooks (`useAdminTier`, `useFeatureFlag`), services (org CRUD, settings, feature flags), entity adapter interface |
| `@universal-cms/admin-ui` | `AdminLayout`, `StatCard`, `PlatformAdminRoute`, `AuditLogViewer` (with export + before/after diffs), `UserManagementPanel` (with pagination + account status), `OrganizationManagementPanel`, `EntityManagementPanel` (adapter-driven), `FeatureFlagPanel` |
| `@universal-cms/admin-schema` | 3 migration files, 2 RLS policy files, 1 seed file. Creates 17 tables, 5 RPC functions, comprehensive RLS. Includes `feature_flags` and `account_status` (improvements over HomeDoc). |

### Key improvements over HomeDoc's current admin

1. **Single RBAC source of truth** — `isPlatformAdmin()` is the only admin check. No more dual `is_super_admin` flag.
2. **Data-driven feature flags** — Per-user, per-org, per-role targeting with rollout percentages.
3. **Account status** — `active` / `suspended` / `deactivated` instead of scattered `is_active` flags.
4. **Audit log with diffs** — `before_state` and `after_state` columns for compliance.
5. **Paginated lists** — Server-side pagination on all entity lists.
6. **Audit log export** — JSON export button.
7. **Entity adapter pattern** — Same admin components work for homes, concerts, bids, or any domain entity.

## Quick start (for a new project)

See `skill/admin-panel/SKILL.md` for step-by-step instructions.
