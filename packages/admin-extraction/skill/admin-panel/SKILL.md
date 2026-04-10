# Skill: Install and Configure Universal CMS Admin

## When to use
Use this skill when setting up a three-tier admin panel (Platform / Group / Individual) in a new React + Supabase project, or when extending an existing installation with app-specific entities.

---

## 1. Install the packages

```bash
npm install @universal-cms/admin-core @universal-cms/admin-ui @universal-cms/admin-schema
```

Ensure peer dependencies are present:
```bash
npm install react react-dom react-router-dom @supabase/supabase-js lucide-react
```

## 2. Run the schema migrations

Copy migrations into your Supabase project and apply them in order:

```bash
# Option A: Supabase CLI
cp node_modules/@universal-cms/admin-schema/migrations/*.sql supabase/migrations/
cp node_modules/@universal-cms/admin-schema/rls/*.sql supabase/migrations/
cp node_modules/@universal-cms/admin-schema/seed/*.sql supabase/migrations/
supabase db push

# Option B: Supabase Dashboard SQL Editor
# Paste each file in order: 001 → 002 → 003 → rls/001 → rls/002 → seed/001
```

## 3. Bootstrap the first admin

Visit `/bootstrap-admin` in your app (or call the RPC directly):

```ts
const { data } = await supabase.rpc('bootstrap_first_admin');
// Only works when no platform_admin exists yet
```

## 4. Define an entity adapter

Every app has a primary domain entity. Define an adapter so the admin system knows how to display it:

```ts
import type { EntityAdapter } from '@universal-cms/admin-core';

export const concertAdapter: EntityAdapter = {
  entityName: 'Concert',
  entityNamePlural: 'Concerts',
  tableName: 'concerts',
  ownerColumn: 'organizer_id',
  displayColumn: 'title',
  secondaryDisplayColumn: 'venue',
  imageColumn: 'poster_url',
  fields: [
    { key: 'title', label: 'Title', type: 'text', showInList: true, showInDetail: true, isPrimary: true },
    { key: 'venue', label: 'Venue', type: 'text', showInList: true, showInDetail: true },
    { key: 'date', label: 'Date', type: 'date', showInList: true, showInDetail: true },
    { key: 'capacity', label: 'Capacity', type: 'number', showInList: false, showInDetail: true },
  ],
};
```

## 5. Mount the admin routes

```tsx
import { PlatformAdminRoute, AdminLayout, UserManagementPanel, OrganizationManagementPanel, AuditLogViewer, EntityManagementPanel, FeatureFlagPanel } from '@universal-cms/admin-ui';
import { useIsPlatformAdmin } from '@universal-cms/admin-core';
import { supabase } from './lib/supabaseClient';
import { useAuth } from './context/AuthContext';
import { concertAdapter } from './adapters/concert';

function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

  return (
    <AdminLayout title="Admin Dashboard">
      {/* Tab navigation */}
      {tab === 'users' && <UserManagementPanel supabase={supabase} currentUserId={user.id} />}
      {tab === 'orgs' && <OrganizationManagementPanel supabase={supabase} currentUserId={user.id} />}
      {tab === 'entities' && <EntityManagementPanel supabase={supabase} adapter={concertAdapter} />}
      {tab === 'flags' && <FeatureFlagPanel supabase={supabase} currentUserId={user.id} />}
      {tab === 'audit' && <AuditLogViewer supabase={supabase} />}
    </AdminLayout>
  );
}

// In your router:
<Route path="/admin" element={
  <PlatformAdminRoute supabase={supabase} user={user} authLoading={isLoading}>
    <AdminPage />
  </PlatformAdminRoute>
} />
```

## 6. Register in the universal-cms dashboard

1. Open the dashboard app at `http://localhost:5173` (or wherever it's deployed)
2. Click "Register App"
3. Fill in: app name, URL, Supabase project URL, admin deep-link URL
4. The app will appear on the dashboard with health status

## 7. Extend with app-specific pages

Add domain-specific admin panels alongside the universal ones. Don't fork the package — compose:

```tsx
function AdminPage() {
  return (
    <AdminLayout title="Admin Dashboard">
      {tab === 'users' && <UserManagementPanel ... />}
      {tab === 'concerts' && <EntityManagementPanel adapter={concertAdapter} ... />}
      {/* App-specific panel, not from the package */}
      {tab === 'venue-config' && <VenueConfigPanel />}
    </AdminLayout>
  );
}
```

---

## Common Pitfalls

1. **Don't import `supabaseClient` from the package.** The packages accept a Supabase client as a prop/argument. Pass your app's client instance — don't let the package create its own.

2. **Run migrations in order.** `003_rpc_functions.sql` depends on tables from `001` and `002`. RLS policies depend on the `is_platform_admin()` function from `003`. Run them in sequence.

3. **The `role_type` column is `text`, not an enum.** This is intentional — it lets you add custom roles without a migration. But validate role values in your application code.

4. **Bootstrap only works once.** `bootstrap_first_admin()` refuses to run if any `platform_admin` role exists. If you need to re-bootstrap, manually delete from `user_roles` first.

5. **RLS policies reference `is_platform_admin()`.** If you create app-specific tables and want platform admins to have access, add RLS policies that call this function.

6. **Feature flags use deterministic hashing for rollout.** The rollout percentage is based on `hash(userId + flagKey) % 100`. This means the same user always gets the same result for the same flag — no randomness.

7. **The admin-ui components use Tailwind CSS variables for theming.** Override `--admin-bg`, `--admin-link` etc. in your app's CSS to match your brand. No need to fork components.

8. **The audit log now supports before/after state.** When calling `logAdminAction()`, pass `before_state` and `after_state` for compliance-grade audit trails. HomeDoc's original audit log didn't have this.
