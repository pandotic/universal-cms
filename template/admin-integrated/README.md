# Admin Integrated Template

Example Next.js 16 application demonstrating how to integrate `@pandotic/admin-ui` with selective feature toggling.

## Features Demonstrated

- ✅ User management (users page)
- ✅ Organization management (organizations page)
- ✅ Feature flags (feature flags page)
- ✅ Audit logging (audit log page)
- ✅ Role-based access control (PlatformAdminRoute guard)
- ✅ Modular admin config (enable/disable features)
- ✅ API route protection (requirePlatformAdmin middleware)

## Quick Start

### 1. Set Up Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Apply Database Migrations

Run these migrations in your Supabase SQL editor (in order):

1. Admin schema migrations (from `docs/ADMIN_UI_INTEGRATION_GUIDE.md`):
   - `001_user_profiles_and_roles.sql`
   - `002_organizations_and_modules.sql`
   - `003_feature_flags.sql`
   - `004_audit_and_monitoring.sql`

2. Or use the Supabase CLI:

```bash
supabase db push
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   ├── globals.css               # Global styles + CSS variables
│   └── admin/
│       ├── layout.tsx            # Admin layout with sidebar nav
│       ├── page.tsx              # Admin dashboard
│       ├── users/
│       │   └── page.tsx          # User management page
│       ├── organizations/
│       │   └── page.tsx          # Organization management page
│       ├── feature-flags/
│       │   └── page.tsx          # Feature flags page
│       └── audit-log/
│           └── page.tsx          # Audit log viewer page
├── config/
│   └── admin-config.ts           # Feature toggles configuration
└── lib/
    ├── supabase.ts               # Supabase client setup
    └── middleware/
        └── admin-rbac.ts         # RBAC helpers for API protection
```

## Configuration

Edit `src/config/admin-config.ts` to enable/disable features:

```typescript
export const adminConfig: AdminConfig = {
  features: {
    users: true,              // ✅ Enable user management
    organizations: true,      // ✅ Enable organization management
    featureFlags: true,       // ✅ Enable feature flags
    auditLog: true,           // ✅ Enable audit logging
    sso: false,               // ❌ Disable SSO (enterprise)
    apiKeys: false,           // ❌ Disable API keys (enterprise)
    bulkOperations: false,    // ❌ Disable bulk operations (enterprise)
  },
};
```

**Tree-shaking:** Disabled features are automatically excluded from your production bundle via tree-shaking.

## Key Pages

### `/` — Landing Page

Shows all available features and their enabled/disabled status.

### `/admin` — Admin Dashboard

Protected route (requires platform admin role). Shows:
- Quick stats cards (if features enabled)
- List of enabled features with links
- Configuration hint

### `/admin/users` — User Management

Full user CRUD interface with:
- Search by email or name
- Filter by status (All, Active, Suspended)
- Suspend/reactivate users
- Pagination

**Requires:** `adminConfig.features.users = true`

### `/admin/organizations` — Organization Management

Manage organizations/groups with:
- Card-based layout
- Search functionality
- Organization details

**Requires:** `adminConfig.features.organizations = true`

### `/admin/feature-flags` — Feature Flags

Manage feature rollouts with:
- Toggle flags on/off
- Set rollout percentage (0-100%)
- Target specific users, organizations, or roles
- View metadata

**Requires:** `adminConfig.features.featureFlags = true`

### `/admin/audit-log` — Audit Logging

Browse platform action history with:
- Full-text search
- Filter by action type
- Before/after state diffs
- JSON export

**Requires:** `adminConfig.features.auditLog = true`

## API Protection

Protect your API routes with `requirePlatformAdmin`:

```typescript
// src/app/api/admin/config/route.ts
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/middleware/admin-rbac";
import { createClient } from "@supabase/ssr";

export async function PUT(request: Request) {
  const supabase = createClient();
  const userId = await getCurrentUserId(supabase);

  // Returns NextResponse error if not authorized
  const authError = await requirePlatformAdmin(supabase, userId);
  if (authError) {
    return authError;
  }

  // Proceed with admin operation
  const body = await request.json();
  // ... handle request
}
```

## Styling & Theming

Admin-ui uses CSS variables for theming. Edit `src/app/globals.css`:

```css
:root {
  --admin-bg: #0f0f0f;        /* Background */
  --admin-text: #ffffff;      /* Text color */
  --admin-link: #3b82f6;      /* Link color */
  --admin-border: #1f1f1f;    /* Border color */
  --admin-hover: #1a1a1a;     /* Hover background */
}
```

## Build & Deploy

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
vercel deploy
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Troubleshooting

### "SupabaseClient is not assignable to SupabaseClientAdapter"

In API routes, cast the client:

```typescript
const isAdmin = await isPlatformAdmin(
  supabase as unknown as SupabaseClientAdapter,
  userId
);
```

### "Feature not rendering despite being enabled"

Ensure `adminConfig` is imported in your component:

```typescript
import { adminConfig } from "@/config/admin-config";

// Always wrap with feature check
{adminConfig.features.users && <UserManagementPanel... />}
```

### "RLS policy denying access"

Verify user has correct role in `user_roles` table:

```sql
SELECT * FROM user_roles
WHERE user_id = 'your-user-id'
  AND role_type = 'platform_admin';
```

## Next Steps

1. **Customize:** Modify admin config to match your feature set
2. **Extend:** Add custom pages and components alongside admin-ui
3. **Deploy:** Push to Vercel or your preferred host
4. **Monitor:** Use audit logs to track admin actions

For complete integration guide, see `docs/ADMIN_UI_INTEGRATION_GUIDE.md` in the parent repository.

## Support

- 📖 [Admin UI Integration Guide](../../docs/ADMIN_UI_INTEGRATION_GUIDE.md)
- 🐛 [Report Issues](https://github.com/pandotic/universal-cms/issues)
- 💬 [Discussions](https://github.com/pandotic/universal-cms/discussions)

## License

MIT
