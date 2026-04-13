# CLI Tools

Command-line utilities for `@pandotic/universal-cms`.

## setup-admin.ts

Interactive wizard for setting up `@pandotic/admin-ui` in your Next.js project.

### Usage

```bash
# Option 1: Run directly with ts-node
npx ts-node packages/cms-core/src/cli/setup-admin.ts

# Option 2: From within your project (when published to npm)
npx @pandotic/universal-cms setup-admin

# Option 3: Run from monorepo
pnpm --filter @pandotic/universal-cms exec npx ts-node src/cli/setup-admin.ts
```

### What It Does

The setup wizard will:

1. **Detect** your Next.js project structure
2. **Ask** you to select a feature preset (minimal, standard, enterprise)
3. **Generate** configuration files:
   - `src/config/admin-config.ts` — Feature toggles
   - `src/lib/middleware/admin-rbac.ts` — RBAC helpers
   - `src/lib/supabase.ts` — Supabase client setup
4. **Display** next steps and environment variable requirements

### Feature Presets

- **Minimal** — Users + Organizations (core features)
- **Standard** — Minimal + Feature Flags + Audit Log
- **Enterprise** — Standard + SSO + API Keys + Bulk Operations

### Example Session

```
🚀 Admin UI Setup Wizard

📁 Detecting Next.js project structure...

✅ Found project: my-app

📋 Choose your admin features:

1. Minimal (users + organizations)
2. Standard (minimal + feature-flags + audit-log)
3. Enterprise (standard + SSO + API keys + bulk operations)

Select preset (1-3): 2

✅ Selected standard preset

Continue with setup? This will create/modify files. (y/n): y

📝 Generating configuration files...

✅ Created: src/config/admin-config.ts
✅ Created: src/lib/middleware/admin-rbac.ts
✅ Created: src/lib/supabase.ts

✅ Setup complete!

📋 Next steps:

1. Install dependencies:
   npm install @pandotic/admin-ui @pandotic/admin-core

2. Set up environment variables:
   Create .env.local with:
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

3. Apply database migrations:
   - Visit docs/ADMIN_UI_INTEGRATION_GUIDE.md
   - Run migrations in Supabase SQL editor

4. Create admin pages:
   - src/app/admin/layout.tsx
   - src/app/admin/page.tsx
   - src/app/admin/users/page.tsx

5. Reference example:
   See template/admin-integrated/ in monorepo
```

## Future CLI Tools

Planned utilities:

- **init-project** — Bootstrap a new Pandotic site
- **generate-types** — Generate TypeScript types from Supabase
- **migrate** — Database migration management
- **validate** — Validate configuration and schema
