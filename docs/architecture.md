# Architecture

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Styling | Tailwind CSS v4, semantic color tokens |
| UI Components | shadcn/ui (bundled in cms-core) |
| AI | Anthropic Claude SDK (optional) |
| Language | TypeScript (strict mode) |

## Package Structure

```
packages/cms-core/src/
├── config.ts              # Module system, presets, CmsConfig type
├── types/index.ts         # Shared types (ContentPage, MediaItem, etc.)
├── data/                  # 17 data modules
│   ├── content-pages.ts   # CRUD for content pages
│   ├── entities.ts        # Directory entities
│   ├── reviews.ts         # Review moderation
│   ├── categories.ts      # Taxonomy management
│   ├── media.ts           # Media library
│   ├── site-settings.ts   # Key-value settings
│   ├── activity-log.ts    # Audit trail
│   ├── error-log.ts       # Error tracking
│   └── ...                # 9 more modules
├── ai/                    # AI chat integration
│   ├── tools.ts           # CMS tool definitions
│   ├── tool-executor.ts   # Tool execution engine
│   ├── system-prompt.ts   # Parameterized system prompt
│   └── types.ts           # AI-specific types
├── components/
│   ├── admin/             # Admin shell, sidebar, command palette
│   ├── ui/                # 15 shadcn/ui components
│   └── theme/             # Theme provider, toggle, injector
├── security/              # Rate limiting, validation, headers
└── utils/                 # cn(), contrast utilities, color constants
```

## Module System

Each CMS feature follows this pattern:

```
Module = Migration + Data Layer + Admin Page + (Optional) API Route + (Optional) Public Page
```

1. **Migration** — SQL file creating the table(s)
2. **Data Layer** — TypeScript functions for CRUD (in `packages/cms-core/src/data/`)
3. **Admin Page** — React page in the admin panel (in `template/src/app/admin/`)
4. **API Route** — Next.js route handler (in `template/src/app/api/admin/`)

## Config-Driven Architecture

The `CmsConfig` object drives the entire system:

```typescript
interface CmsConfig {
  siteName: string;
  modules: Record<CmsModuleName, boolean>;  // Toggle modules on/off
  roles: CmsRole[];                          // Available user roles
  adminNav: CmsNavGroup[];                   // Sidebar navigation
  storage: { mediaBucket, maxFileSizeMb, allowedMimeTypes };
  analytics: { availableProviders };
  primaryEntity: { name, singular, plural, slugPrefix };
}
```

- **Admin sidebar** filters nav items by `item.module` — disabled modules don't show up
- **Command palette** also respects module toggles
- **API routes** check module status before processing

## Data Flow

### Read Path (Admin)
```
Admin Page → fetch("/api/admin/...") → API Route → createAdminClient() → dataFunction(client, ...) → Supabase → PostgreSQL
```

### Write Path (Admin)
```
Admin Page → fetch("/api/admin/...", { method: "POST" }) → API Route → dataFunction(client, payload) → Supabase → PostgreSQL
```

### Client Injection Pattern
Every data function accepts `client: SupabaseClient` as the first parameter. The template creates the client in the API route and passes it through:

```typescript
// API route
const supabase = await createAdminClient();
const data = await getAllContentPages(supabase);
```

This design means:
- **No global state** — each request gets its own client
- **Testable** — mock the client in tests
- **Flexible** — use service role or user-scoped client as needed

## Security

### Row-Level Security (RLS)
Supabase RLS policies control data access. The migrations create a `has_role()` function that checks the user's role from the `profiles` table.

### Security Headers
The template's `next.config.ts` includes CSP, X-Frame-Options, and other security headers.

### Rate Limiting
`@pandotic/universal-cms/security` provides a configurable rate limiter for API routes.

## Admin Shell

The admin interface consists of:

- **AdminShell** — main layout with sidebar, topbar, breadcrumbs
- **AdminSidebar** — collapsible navigation driven by `CmsConfig.adminNav`
- **CommandPalette** — Cmd+K search across all admin pages
- **ChatPanel** — AI assistant sidebar (optional, requires Anthropic API key)
- **CmsProvider** — React context providing `CmsConfig` to all admin components

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server only) |
| `ANTHROPIC_API_KEY` | No | For AI chat in admin panel |
