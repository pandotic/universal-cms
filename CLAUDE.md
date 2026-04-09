# Universal CMS — Development Guide

## Tech Stack

- **CMS Core** (`packages/cms-core`): Next.js 16, Supabase, Tailwind CSS v4, TypeScript
- **Admin System** (`packages/admin-core`, `admin-ui`): React 18, TypeScript, Supabase, Lucide icons
- **Dashboard** (`apps/dashboard`): Vite 5, React 18, Tailwind CSS 3, React Router 6

## Monorepo Structure

pnpm workspaces: `packages/*`, `apps/*`, `template`

### Key packages

| Package | Name | Purpose |
|---------|------|---------|
| `packages/cms-core` | `@pandotic/universal-cms` | Config-driven CMS framework (Next.js) |
| `packages/admin-core` | `@universal-cms/admin-core` | Headless admin logic: RBAC, services, hooks, entity adapters |
| `packages/admin-ui` | `@universal-cms/admin-ui` | React admin UI components (themed with Tailwind) |
| `packages/admin-schema` | `@universal-cms/admin-schema` | SQL migrations, RLS policies, seed data |
| `apps/dashboard` | `@universal-cms/dashboard` | Admin hub app (Vite + React) |

## Build Order

admin-core must build before admin-ui (tsconfig `references` + `composite: true`):

```bash
pnpm install
pnpm --filter @universal-cms/admin-core build
pnpm --filter @universal-cms/admin-ui build
pnpm --filter @universal-cms/dashboard build
```

## Three-Tier Admin Model

- **Platform Admin** (`platform_admin`): Full system access
- **Group Admin** (`org_admin`): Organization-scoped access
- **Entity Admin** (`entity_admin`): Manages owned/assigned entities

All permission checks go through `isPlatformAdmin()`, `detectAdminTier()`, etc. from admin-core.

## Entity Adapter Pattern

Apps define an `EntityAdapter` (from admin-core) to describe their domain entity. The `EntityManagementPanel` (from admin-ui) renders list/detail views based on this adapter. See `apps/dashboard/src/adapters/connectedApp.ts` for an example.

## Conventions

- Peer deps not bundled — `react`, `@supabase/supabase-js`, `lucide-react` are peer deps of admin packages
- Headless core + themed UI — admin-core has zero React deps, admin-ui is React-specific
- All admin-ui components accept `supabase: SupabaseClientAdapter` as a prop (no global client)
- The real `@supabase/supabase-js` client satisfies `SupabaseClientAdapter`; use `as unknown as SupabaseClientAdapter` cast
- pnpm workspace protocol: use `"workspace:*"` for internal dependencies

## Dashboard

- Supabase auth with email/password
- Bootstrap admin via `supabase.rpc('bootstrap_first_admin')` (admin-schema RPC)
- Connected apps are stored in a `connected_apps` Supabase table with RLS
- Admin page has 6 tabs: Overview, Users, Organizations, Connected Apps, Feature Flags, Audit Log

## Future

`ROADMAP.md` has the phased plan (A through H) for building out the full Hub Dashboard. `DASHBOARD.md` has the complete architectural vision with SQL schemas ready to copy. Start with the "Hub Dashboard — Future Phases" section in `ROADMAP.md`.

## Reference

- `packages/admin-extraction/docs/` — detailed audit and gap analysis of the admin extraction
- `packages/admin-extraction/` — original blueprint code (preserved for reference)
