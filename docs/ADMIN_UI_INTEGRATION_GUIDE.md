# Admin UI Integration Guide

Complete guide for integrating `@pandotic/admin-ui` into your Next.js application.

## What is @pandotic/admin-ui?

`@pandotic/admin-ui` is a production-ready admin dashboard package that provides:
- **User management** — Create, suspend, and manage users across your platform
- **Organization management** — Multi-tenant organization/group structure
- **Feature flags** — Gradual rollout control with targeting by user, organization, or role
- **Audit logging** — Compliance-grade action tracking with before/after state diffs
- **Role-based access control** — Platform admin, org admin, standard user, and viewer tiers
- **Entity management** — Generic admin interface for any custom entity (properties, groups, etc.)

The package is designed for **selective feature adoption** — enable only the features your app needs, keeping bundles lean via tree-shaking.

## Installation

### Requirements
- Next.js 14+ (App Router)
- React 18+
- Supabase 2.39+
- Tailwind CSS 3+
- TypeScript 5+

### Setup

**1. Install the package:**
```bash
npm install @pandotic/admin-ui @pandotic/admin-core @supabase/ssr @supabase/supabase-js
```

**2. Create your admin config:**

Create `src/config/admin-config.ts`:

```typescript
import type { AdminConfig } from "@pandotic/admin-ui";

export const adminConfig: AdminConfig = {
  features: {
    users: true,
    organizations: true,
    featureFlags: true,
    auditLog: true,
    // Disable enterprise features for standard apps
    sso: false,
    apiKeys: false,
    bulkOperations: false,
  },
};
```

**3. Set up environment variables:**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**4. Apply admin schema migrations:**

Download and apply migrations to your Supabase database:
```sql
-- Run these in order in your Supabase SQL editor
-- 001_user_profiles_and_roles.sql
-- 002_organizations_and_modules.sql
-- 003_feature_flags.sql
-- 004_audit_and_monitoring.sql
```

## Quick Start (5 Minutes)

### Basic Admin Layout

Create `src/app/admin/layout.tsx`:

```typescript
import { AdminLayout } from "@pandotic/admin-ui";

export default function AdminLayoutComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout
      title="Admin Dashboard"
      description="Manage users, organizations, and features"
    >
      {children}
    </AdminLayout>
  );
}
```

### Protected Admin Page

Create `src/app/admin/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/ssr";
import { PlatformAdminRoute } from "@pandotic/admin-ui";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  return (
    <PlatformAdminRoute
      supabase={supabase}
      user={user}
      authLoading={loading}
      loginRoute="/login"
    >
      <div className="space-y-8">
        <h2 className="text-3xl font-bold">Welcome to Admin</h2>
        <p className="text-zinc-400">Select a feature from the navigation</p>
      </div>
    </PlatformAdminRoute>
  );
}
```

### Add User Management

Create `src/app/admin/users/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/ssr";
import { UserManagementPanel } from "@pandotic/admin-ui";
import { adminConfig } from "@/config/admin-config";

export default function UsersPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  if (!adminConfig.features.users) {
    return <div className="text-amber-400">Users feature is disabled</div>;
  }

  return (
    <UserManagementPanel
      supabase={supabase}
      currentUserId={userId}
      pageSize={20}
    />
  );
}
```

## Feature Configuration Presets

### Minimal Config (Core Features Only)
For simple applications with basic admin needs:

```typescript
export const minimalAdminConfig: AdminConfig = {
  features: {
    users: true,           // Essential: user CRUD
    organizations: true,   // Essential: org/group management
    featureFlags: false,   // Skip: feature rollout
    auditLog: false,       // Skip: compliance logging
    sso: false,
    apiKeys: false,
    bulkOperations: false,
  },
};
```

**Bundle size impact:** ~45KB gzipped

### Standard Config (Recommended)
For most SaaS applications:

```typescript
export const standardAdminConfig: AdminConfig = {
  features: {
    users: true,           // User management
    organizations: true,   // Organization management
    featureFlags: true,    // Feature flags & targeting
    auditLog: true,        // Audit logs for compliance
    sso: false,            // Skip: enterprise only
    apiKeys: false,        // Skip: optional
    bulkOperations: false, // Skip: optional
  },
};
```

**Bundle size impact:** ~75KB gzipped

### Enterprise Config (All Features)
For enterprise applications with advanced needs:

```typescript
export const enterpriseAdminConfig: AdminConfig = {
  features: {
    users: true,
    organizations: true,
    featureFlags: true,
    auditLog: true,
    sso: true,             // SSO configuration
    apiKeys: true,         // API key management
    bulkOperations: true,  // Bulk user/org operations
    serviceProviders: true,  // Service provider database
    riskReports: true,     // Risk assessment reports
    systemHealth: true,    // System health monitoring
  },
};
```

**Bundle size impact:** ~150KB gzipped

## Core Components Reference

### PlatformAdminRoute

Route guard component that requires platform admin authentication.

```typescript
<PlatformAdminRoute
  supabase={supabaseClient}
  user={currentUser}
  authLoading={isLoading}
  loginRoute="/login"
  fallbackRoute="/"
>
  {/* Your admin content here */}
</PlatformAdminRoute>
```

**Props:**
- `supabase` — Supabase client
- `user` — Current user object from auth.getUser()
- `authLoading` — Whether auth is still loading
- `loginRoute` — Redirect destination for non-authenticated users (default: "/login")
- `fallbackRoute` — Redirect destination for non-admins (default: "/")

### AdminLayout

Main page wrapper with header, breadcrumbs, and sidebar styling.

```typescript
<AdminLayout
  title="Users"
  description="Manage platform users"
  breadcrumbs={[
    { label: "Admin", href: "/admin" },
    { label: "Users" },
  ]}
>
  {/* Your page content here */}
</AdminLayout>
```

**Props:**
- `title` — Page title (required)
- `description` — Page subtitle
- `breadcrumbs` — Navigation breadcrumbs array
- `actions` — Header action buttons
- `sidebar` — Custom sidebar content
- `isDevMode` — Show dev warning banner

### UserManagementPanel

Complete user CRUD interface with filtering and pagination.

```typescript
<UserManagementPanel
  supabase={supabaseClient}
  currentUserId={userId}
  pageSize={20}
/>
```

**Props:**
- `supabase` — Supabase client (required)
- `currentUserId` — Current user ID for authorization checks
- `pageSize` — Pagination size (default: 20)

**Features:**
- Search by email or display name
- Filter by status (All, Active, Suspended)
- Suspend/reactivate users
- View role assignments
- Audit trail per user

### OrganizationManagementPanel

Organization/group management interface.

```typescript
<OrganizationManagementPanel
  supabase={supabaseClient}
  currentUserId={userId}
  onOrgSelect={handleSelect}
  onViewAsGroupAdmin={handleViewAs}
/>
```

**Props:**
- `supabase` — Supabase client (required)
- `currentUserId` — Current user ID
- `onOrgSelect` — Callback when org is clicked
- `onViewAsGroupAdmin` — Callback for "view as group admin" action

### EntityManagementPanel

Generic entity list component for any domain entity (properties, groups, custom types).

```typescript
import { EntityManagementPanel } from "@pandotic/admin-ui";
import { propertyAdapter } from "@/lib/adapters/property-adapter";

<EntityManagementPanel
  supabase={supabaseClient}
  adapter={propertyAdapter}
  onEntitySelect={handlePropertyClick}
  pageSize={25}
/>
```

**Props:**
- `supabase` — Supabase client (required)
- `adapter` — EntityAdapter configuration (required)
- `onEntitySelect` — Callback when entity is clicked
- `pageSize` — Pagination size (default: 20)

### AuditLogViewer

Searchable audit log display with before/after state comparison.

```typescript
<AuditLogViewer
  supabase={supabaseClient}
  limit={100}
/>
```

**Props:**
- `supabase` — Supabase client (required)
- `limit` — Max logs to display (default: 50)

**Features:**
- Full-text search across actions
- Filter by action type
- Before/after state diffs
- JSON export
- Color-coded action categories

### FeatureFlagPanel

Feature flag management with rollout percentage and targeting.

```typescript
<FeatureFlagPanel
  supabase={supabaseClient}
  currentUserId={userId}
/>
```

**Props:**
- `supabase` — Supabase client (required)
- `currentUserId` — Current user ID for auth checks

**Features:**
- Toggle flags on/off
- Set rollout percentage (0-100%)
- Target specific users, organizations, roles
- View flag metadata and description
- Automatic audit logging

## Adapter Pattern: Custom Entities

The `EntityAdapter` pattern enables `EntityManagementPanel` to render any domain entity without custom code.

### Creating an Adapter

Create `src/lib/adapters/property-adapter.ts`:

```typescript
import { EntityAdapter } from "@pandotic/admin-core";

export const propertyAdapter: EntityAdapter = {
  entityName: "Property",
  entityNamePlural: "Properties",
  tableName: "properties",  // Your database table
  displayColumn: "name",     // Primary display field
  secondaryDisplayColumn: "url",  // Secondary field
  fields: [
    {
      key: "name",
      label: "Name",
      type: "text",
      showInList: true,
      showInDetail: true,
    },
    {
      key: "url",
      label: "URL",
      type: "text",
      showInList: true,
      showInDetail: true,
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      showInList: true,
      showInDetail: true,
      options: ["active", "inactive", "archived"],
    },
    {
      key: "created_at",
      label: "Created",
      type: "date",
      showInList: false,
      showInDetail: true,
    },
  ],
};
```

### Using Your Adapter

```typescript
import { EntityManagementPanel } from "@pandotic/admin-ui";
import { propertyAdapter } from "@/lib/adapters/property-adapter";

<EntityManagementPanel
  adapter={propertyAdapter}
  supabase={client}
/>
```

**Adapter Fields:**
- `entityName` / `entityNamePlural` — Display name
- `tableName` — Database table to query
- `displayColumn` — Primary field for list display
- `secondaryDisplayColumn` — Secondary field for context
- `fields` — Field configuration array with type, visibility, and options

**Supported Field Types:**
- `text` — Text input
- `number` — Number input
- `select` — Dropdown with options
- `date` — Date picker
- `boolean` — Toggle/checkbox
- `email` — Email input with validation

## Customization & Extension

### Styling with CSS Variables

Admin-ui uses CSS variables for theming:

```css
:root {
  --admin-bg: #0f0f0f;           /* Background color */
  --admin-text: #ffffff;         /* Text color */
  --admin-link: #3b82f6;         /* Link color */
  --admin-border: #1f1f1f;       /* Border color */
  --admin-hover: #1a1a1a;        /* Hover background */
}
```

### Component Props Override

Extend components with additional props:

```typescript
// Custom wrapper with your branding
function MyUserManagement() {
  return (
    <div className="my-custom-wrapper">
      <UserManagementPanel
        supabase={client}
        currentUserId={userId}
        // Additional props passed to component
      />
    </div>
  );
}
```

### Custom Sidebar Navigation

Extend AdminLayout with custom navigation:

```typescript
<AdminLayout
  title="Admin"
  sidebar={
    <nav className="space-y-2">
      <a href="/admin/dashboard">Dashboard</a>
      <a href="/admin/users">Users</a>
      <a href="/admin/custom-page">My Custom Page</a>
    </nav>
  }
>
  {children}
</AdminLayout>
```

## RBAC & Permissions

### Role Hierarchy

Admin-ui implements a 5-tier role hierarchy:

```
platform_admin (super user)
  ↓ Can delegate to
org_admin (organization/group admin)
  ↓ Can delegate to
entity_admin (entity-specific admin)
  ↓ Can view
standard_user (read/write within scope)
  ↓ Can view read-only
guest_viewer (read-only)
```

### Checking User Role

Use the `useAdminTier` hook in client components:

```typescript
"use client";

import { useAdminTier } from "@pandotic/admin-core";

export function MyComponent() {
  const { tier, isLoading } = useAdminTier(supabase, userId);

  if (tier === "platform_admin") {
    return <div>Full platform access</div>;
  } else if (tier === "org_admin") {
    return <div>Organization admin access</div>;
  } else {
    return <div>Standard user access</div>;
  }
}
```

### Protecting API Routes

Use `requirePlatformAdmin` in your API routes:

```typescript
// src/app/api/admin/config/route.ts
import { requirePlatformAdmin, getCurrentUserId } from "@/lib/admin-rbac";
import { createClient } from "@supabase/ssr";

export async function PUT(request: Request) {
  const supabase = createClient();
  const userId = await getCurrentUserId(supabase);

  // This returns NextResponse with 401/403 if unauthorized
  const authError = await requirePlatformAdmin(supabase, userId);
  if (authError) {
    return authError;
  }

  // Proceed with admin operation
  const body = await request.json();
  // ... handle request
}
```

### RLS Policies for Your Tables

Example RLS policy for property access:

```sql
-- Allow authenticated users to read properties
CREATE POLICY "Authenticated read"
ON properties
FOR SELECT
TO authenticated
USING (true);

-- Allow org admins to update their properties
CREATE POLICY "Org admin write"
ON properties
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles
    WHERE role_type = 'org_admin'
      AND organization_id = properties.organization_id
  )
);
```

## Database Schema Requirements

Your Supabase project must have these core tables (consolidated into `packages/fleet-dashboard/supabase/migrations/00500_admin_schema_integration.sql`):

### user_profiles
```sql
- id (uuid, primary key)
- display_name (text)
- email (text)
- account_status (enum: active, suspended, deactivated)
- timezone (text)
- locale (text)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

### user_roles
```sql
- id (uuid, primary key)
- user_id (uuid, FK to user_profiles)
- role_type (enum: platform_admin, org_admin, entity_admin, standard_user, guest_viewer)
- organization_id (uuid, nullable - NULL = platform-wide role)
- expires_at (timestamp, nullable)
- is_active (boolean)
- granted_by (uuid)
- created_at (timestamp)
- updated_at (timestamp)
```

### organizations
```sql
- id (uuid, primary key)
- name (text)
- slug (text)
- type (text)
- logo_url (text, nullable)
- branding_config (jsonb)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### feature_flags
```sql
- id (uuid, primary key)
- flag_key (text, unique)
- flag_name (text)
- description (text)
- is_enabled (boolean)
- rollout_percentage (integer: 0-100)
- target_roles (text[])
- target_org_ids (uuid[])
- target_user_ids (uuid[])
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
```

### admin_audit_log
```sql
- id (uuid, primary key)
- admin_user_id (uuid, FK to user_profiles)
- action_type (text)
- action_details (text)
- before_state (jsonb)
- after_state (jsonb)
- target_type (text)
- target_id (uuid)
- ip_address (inet)
- user_agent (text)
- created_at (timestamp)
```

## API Integration

### Using Admin-Core Functions in Your APIs

```typescript
import { isPlatformAdmin, detectAdminTier } from "@pandotic/admin-core";

// Check if user is platform admin
const isAdmin = await isPlatformAdmin(supabase, userId);

// Get detailed admin tier info
const tierInfo = await detectAdminTier(supabase, userId);
console.log(tierInfo.tier); // "platform_admin" | "org_admin" | ...
console.log(tierInfo.capabilities); // Array of allowed operations
```

### Logging Admin Actions

```typescript
import { logAdminAction } from "@pandotic/admin-core";

await logAdminAction(supabase, {
  action_type: "user_suspended",
  action_details: `User ${targetUserId} suspended by ${adminId}`,
  target_type: "user",
  target_id: targetUserId,
  before_state: { status: "active" },
  after_state: { status: "suspended" },
});
```

### Querying Audit Logs

```typescript
import { getAuditLogs } from "@pandotic/admin-core";

const logs = await getAuditLogs(supabase, {
  action_type: "user_role_changed",
  limit: 50,
  offset: 0,
});
```

## Metrics & Monitoring

### Reporting Deployments Back to Fleet-Dashboard

If you're running fleet-dashboard as your master admin, report your deployment metrics:

```typescript
// src/app/api/fleet/report-metrics/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // Send to fleet-dashboard metrics API
  const response = await fetch(
    "https://fleet-dashboard.example.com/api/metrics",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.FLEET_API_KEY,
      },
      body: JSON.stringify({
        project_id: "my-app",
        project_name: "My Application",
        version: "1.2.0",
        enabled_features: [
          "users",
          "organizations",
          "feature_flags",
          "audit_log",
        ],
        metrics: {
          total_users: 150,
          total_organizations: 8,
          active_admins: 3,
          last_deployment: new Date().toISOString(),
        },
      }),
    }
  );

  return response;
}
```

**Heartbeat Schedule:**
- Send metrics once per day or on deploy
- Include: enabled features, user/org counts, version
- Optional: custom metrics relevant to your app

## Troubleshooting

### "Module has no exported member 'AdminLayout'"

**Cause:** Importing from wrong path or package version mismatch

**Solution:**
```typescript
// ✅ Correct
import { AdminLayout } from "@pandotic/admin-ui";

// ❌ Wrong
import { AdminLayout } from "@pandotic/admin-ui/components";
```

### "SupabaseClient is not assignable to SupabaseClientAdapter"

**Cause:** Type mismatch between real client and adapter interface

**Solution:** Cast the client:
```typescript
const isAdmin = await isPlatformAdmin(
  supabase as unknown as SupabaseClientAdapter,
  userId
);
```

### "Feature not rendering despite being enabled"

**Cause:** AdminConfig not imported in component

**Solution:**
```typescript
import { adminConfig } from "@/config/admin-config";

// Always wrap with feature check
{adminConfig.features.users && <UserManagementPanel... />}
```

### "RLS policy denying access to admin_audit_log"

**Cause:** RLS policy requires platform admin role

**Solution:** Verify user has `platform_admin` role in `user_roles` table:
```sql
SELECT * FROM user_roles
WHERE user_id = 'your-user-id'
  AND role_type = 'platform_admin';
```

### "Bundle size is larger than expected"

**Cause:** All features included despite being disabled

**Solution:** Ensure feature toggles are set to `false`:
```typescript
export const adminConfig: AdminConfig = {
  features: {
    sso: false,              // Explicitly disabled
    apiKeys: false,          // Explicitly disabled
    bulkOperations: false,   // Explicitly disabled
  },
};
```

Tree-shaking only works when bundler can see the code is unreachable (wrapped in `if (config.features.x)`).

## Support & Contributing

**Issues & Bugs:**
- Open GitHub issues at https://github.com/pandotic/universal-cms
- Include reproduction steps and package versions

**Feature Requests:**
- Discuss in issues before implementing
- PRs welcome for bug fixes and improvements
- Keep feature modularity principle in mind

**Questions?**
- Check this guide first
- Review example templates at `template/admin-integrated/`
- Check admin-core source in `packages/admin-core/src/`
