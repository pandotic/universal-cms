# Fleet Dashboard Admin Integration Plan

## Vision
Transform fleet-dashboard into a **robust, universal master admin interface** that:
- Leverages HomeDoc's proven admin system (extracted into reusable packages)
- Provides the definitive admin console for the entire fleet
- Exports admin UI/logic as npm packages (@pandotic/admin-*) for consumption by other projects
- Allows other sites/apps in the fleet to use these admin features

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Fleet Dashboard (Master Admin Hub)                   │
│  - Uses @pandotic/admin-ui components                │
│  - Central oversight of all fleet properties          │
│  - Manages users, orgs, roles, feature flags          │
│  packages/fleet-dashboard                             │
│  Deployed to: Netlify                                 │
└──────────────────┬───────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
    ┌────────┐ ┌────────┐ ┌──────────────┐
    │admin-  │ │admin-  │ │admin-        │
    │core    │ │ui      │ │schema        │
    │(npm)   │ │(npm)   │ │(migrations)  │
    └────────┘ └────────┘ └──────────────┘
        ↓          ↓          ↓
    ┌──────────────────────────────────────┐
    │  Other Projects in Fleet             │
    │  - Import @pandotic/admin-ui         │
    │  - Get admin features                │
    │  - Report metrics to fleet-dashboard │
    └──────────────────────────────────────┘
```

## Integration Steps

### Phase 1: Rebase & Evaluate (THIS SESSION)
1. **Rebase audit branch with main** to get latest admin packages
2. **Evaluate admin-extraction** documentation (GAPS.md, AUDIT.md, MIGRATION_NOTES.md)
3. **Audit current admin-core, admin-ui, admin-schema** code quality and completeness
4. **Assess fit** with fleet-dashboard architecture

### Phase 2: Integrate Admin Packages
1. **Update package.json dependencies**
   - fleet-dashboard imports from `@pandotic/admin-core` and `@pandotic/admin-ui`
   - Add to workspace package exports
   
2. **Integrate admin components into fleet-dashboard**
   - Replace current `/properties`, `/groups`, `/users` pages with admin-ui equivalents
   - Use AdminLayout from admin-ui
   - Leverage entity adapter pattern for properties/groups/users
   
3. **Update RBAC**
   - Replace custom `requireHubRole` with admin-core RBAC (`isPlatformAdmin`, etc.)
   - Migrate hub_users.hub_role to admin-schema user_roles model
   - Add feature flags support (admin-schema)

4. **Merge database schemas**
   - Apply admin-schema migrations to Hub project
   - Update RLS policies to use admin-schema's RBAC
   - Handle schema conflicts (hub_users vs admin-schema users)

### Phase 3: Export as Reusable Packages
1. **Publish admin packages to npm** (or internal registry)
   - `@pandotic/admin-core`
   - `@pandotic/admin-ui`
   - `@pandotic/admin-schema`

2. **Create installation skill** (Claude Code)
   - Onboarding for new projects to use admin-ui

3. **Document consumption patterns**
   - How to use AdminLayout, entity adapters, RBAC hooks
   - How to connect back to fleet-dashboard for metrics

### Phase 4: Fleet Oversight
1. **Add fleet-dashboard features**
   - `/deployments` — view apps/projects using fleet admin features
   - `/analytics` — usage metrics, feature flag rollouts
   - `/audit-log` — cross-fleet audit trails
   - `/feature-flags` — global feature flag management

2. **SDK/agent for consuming projects**
   - Allow other sites to report metrics back to fleet-dashboard
   - Track which admin features are enabled where
   - Monitor admin activity across fleet

## Current State Analysis

### What Exists on Main (admin-extraction)
- ✅ Complete audit of HomeDoc admin
- ✅ Gap analysis (113 items, 17 categories)
- ✅ Migration notes from HomeDoc
- ✅ Skill documentation for onboarding
- ✅ Proposed packages: admin-core, admin-ui, admin-schema
- ✅ Example dashboard app (minimal)

### What Exists on Audit Branch (fleet-dashboard)
- ✅ Hub properties/groups/users management
- ✅ Custom RBAC (super_admin, group_admin, member, viewer)
- ✅ Fleet health overview
- ✅ API service management (APICentral)
- ✅ All tests passing, build working

### Gap Analysis
- ⚠️ Need to evaluate if admin-core/admin-ui are production-ready
- ⚠️ Need to reconcile dual RBAC systems (hub_role vs admin-schema roles)
- ⚠️ Need to decide on user model merge strategy
- ⚠️ Admin packages may not be published to npm yet
- ⚠️ Fleet-dashboard doesn't yet use admin-ui components

## Success Criteria

By end of integration:
1. ✅ Fleet-dashboard uses admin-ui components for all admin pages
2. ✅ Admin packages published and versioned
3. ✅ New projects can install admin features from npm
4. ✅ Hub Supabase schema includes admin-schema tables
5. ✅ RBAC is unified across fleet-dashboard and consuming projects
6. ✅ Feature flags system working for targeted rollouts
7. ✅ Audit logging with diffs implemented
8. ✅ Fleet-dashboard provides oversight of all admin usage

## Critical Decisions

1. **User Model**: Should hub_users be replaced by admin-schema users table?
   - Option A: Migrate hub_users → users (break change)
   - Option B: Keep separate, add FK linking (more complex)
   - **Recommendation**: Option A (cleaner, single source of truth)

2. **RBAC**: Consolidate hub_role into admin-schema user_roles + role_grants?
   - Option A: Keep both systems separate (technical debt)
   - Option B: Migrate to admin-schema RBAC fully
   - **Recommendation**: Option B (single RBAC system)

3. **Admin-UI Components**: Extend or wrap for fleet-specific needs?
   - Option A: Use as-is (less customization)
   - Option B: Wrap with fleet-specific logic (more control)
   - **Recommendation**: Start with as-is, wrap where needed

4. **Entity Adapter Pattern**: Use for properties/groups/users?
   - Option A: Refactor to use admin-ui adapters
   - Option B: Keep custom pages, add admin-ui components gradually
   - **Recommendation**: Option A (future-proof, reusable)

## Timeline Estimate

- **Phase 1 (Rebase & Evaluate)**: 1-2 hours
- **Phase 2 (Integration)**: 6-8 hours
- **Phase 3 (NPM Packages)**: 2-3 hours
- **Phase 4 (Fleet Oversight)**: 4-6 hours

**Total**: ~13-19 hours of development

## Files to Review First

1. `packages/admin-extraction/AUDIT.md` — Full surface area audit
2. `packages/admin-extraction/GAPS.md` — Feature gaps vs mature SaaS
3. `packages/admin-extraction/MIGRATION_NOTES.md` — How to consume
4. `packages/admin-core/src/types/index.ts` — Core type definitions
5. `packages/admin-ui/src/components/` — Available components
6. `packages/admin-schema/migrations/` — Database schema

## Next Action

**Rebase with main and evaluate admin packages:**
```bash
git fetch origin main
git rebase origin/main
# Then review the admin packages structure
ls -la packages/admin-*/
ls -la apps/dashboard/
```

This will be the first concrete step to understand the full scope of what HomeDoc extracted.
