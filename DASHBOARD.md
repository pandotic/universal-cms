# Universal CMS Dashboard Hub — Requirements & Architecture

This project (`@pandotic/universal-cms`) provides three distinct admin systems and a top-level Hub, all delivered as an npm package. The goal: **never rebuild admin features again**. Build once here, propagate everywhere, maintain centrally.

---

## The Three Admin Types + Hub

This package produces three installable admin interfaces plus the oversight layer:

### 1. Marketing Website CMS

The per-site content management system. Articles, landing pages, media, SEO, reviews, forms, etc. This is what the existing `CmsConfig` + 31 `CmsModuleName` modules already define. Every product that has a marketing website installs this.

### 2. App Admin

The per-app SaaS administration panel. User management, subscriptions, app-specific data models, operational dashboards. This is the **sister** to the Marketing CMS but for the actual product. A product like HomeDoc would install both the Marketing CMS (for homedoc.com) and the App Admin (for managing the HomeDoc platform).

### 3. Hub Dashboard

The top-level mission control that oversees **all** marketing sites and apps across the organization. Aggregated stats, health monitoring, agent workflows, social content generation. One Hub for the entire portfolio.

### 4. Test Marketing Site (this repo)

A simple, non-public Next.js app living in `app/` within this repo. Used to develop and test CMS updates before pushing them to consuming projects. This is the "eat our own dog food" site — it runs the Marketing CMS against a real Supabase project so we can validate changes end-to-end.

---

## How Products Consume This Package

A product repo (e.g., HomeDoc) installs `@pandotic/universal-cms` as an npm dependency:

```bash
npm install @pandotic/universal-cms
```

That product then imports the admin interfaces it needs:

```ts
// Marketing site admin
import type { CmsConfig } from "@pandotic/universal-cms/config";
import { getAllContentPages } from "@pandotic/universal-cms/data/content";

// App admin
import { AppAdminProvider } from "@pandotic/universal-cms/components/app-admin";
import type { AppConfig } from "@pandotic/universal-cms/config";
```

### The Versioning Problem This Solves

1. **We're building many new apps** that each need admin interfaces — starting from scratch each time is wasteful
2. **We're constantly iterating** — adding smart features, refactoring components across apps
3. **Version control is messy** when admin code is copy-pasted across repos — improvements don't propagate
4. **Apps are complicated and different** — a master update can't break everything, updates must be incremental
5. **Bespoke features should flow back** — when a feature is built for one app's admin, it should be generalized and made available to all apps via this package
6. **Scaffold-only approaches go stale** — if we only use a template/scaffold, the generated code is frozen at the generation date and never receives future improvements

### Update Strategy

**Marketing CMS updates** are relatively safe — content management, SEO tools, and media libraries are standardized. These can update more freely.

**App Admin updates** must be strict and incremental:
- Semver with clear breaking change documentation
- Feature flags for new capabilities (`AppConfig.modules` mirror of `CmsConfig.modules`)
- Apps opt-in to new features by enabling modules, not by upgrading and getting everything
- Migration guides for breaking changes
- Each app can pin to a specific minor version while still getting patches

### The Bespoke-to-Universal Pipeline

```
App builds bespoke admin feature (e.g., HomeDoc subscription management)
  → Feature is generalized (remove HomeDoc-specific logic)
  → Feature is added to @pandotic/universal-cms as a new module
  → Other apps can enable it via their config
  → Original app switches from bespoke to package import
```

This is the core value loop. Every bespoke feature is a candidate for extraction into the universal package.

---

## Architecture

Four layers, top to bottom:

```
Hub Dashboard (one per organization)
  Manages all sites, apps, groups, agents, platform settings.
  Full visibility across all properties.

Group Layer
  Organizes properties into portfolios.
  B2B: client company gets a group with scoped access.
  Internal: organize by category ("Finance Sites", "SaaS Products").
  Sits between individual user logins and super-admin.

Marketing Website CMS              App Admin
  Per-site content admin.             Per-app SaaS admin.
  Articles, media, SEO,               Users, subscriptions,
  reviews, forms, etc.                app-specific data.
  Driven by CmsConfig +               Driven by AppConfig +
  enabled modules.                    enabled modules.
```

A **property** is the unified term for either a marketing site or an app. Properties are registered in the Hub and each has its own `CmsConfig` (for sites) or `AppConfig` (for apps).

### Repo Structure

```
universal-cms/
├── src/                    # Package source (published to npm)
│   ├── config.ts           # CmsConfig, AppConfig, HubConfig
│   ├── types/              # All shared types
│   ├── security/           # Rate limiting, validation, headers
│   ├── data/               # Data access layer (client injection)
│   ├── components/
│   │   ├── admin/          # Marketing CMS components
│   │   ├── app-admin/      # App Admin components
│   │   ├── hub/            # Hub Dashboard components
│   │   └── ui/             # Shared UI primitives
│   └── analytics/          # Provider-agnostic analytics
├── app/                    # Test marketing site (Next.js)
│   ├── src/
│   ├── supabase/
│   └── package.json
├── migrations/             # SQL migrations (included in npm package)
├── ROADMAP.md              # Package extraction roadmap
└── DASHBOARD.md            # This document
```

---

## Property Registry

Every managed site or app is a **property** registered in the Hub.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Display name (e.g., "ESGsource", "HomeDoc") |
| `slug` | text | URL-safe identifier, unique |
| `url` | text | Production URL |
| `property_type` | `"site" \| "app"` | Discriminator |
| `preset` | text? | Module preset key (appMarketing, blog, directory, full) |
| `enabled_modules` | text[] | Active `CmsModuleName` values |
| `supabase_project_ref` | text? | Supabase project reference ID |
| `supabase_url` | text? | Supabase project URL |
| `status` | `"active" \| "paused" \| "archived" \| "error"` | Operational status |
| `health_status` | `"healthy" \| "degraded" \| "down" \| "unknown"` | Health check result |
| `last_deploy_at` | timestamptz? | Last deployment timestamp |
| `ssl_valid` | boolean | SSL certificate valid |
| `ssl_expires_at` | timestamptz? | SSL expiry date |
| `metadata` | jsonb | Deployment info, hosting provider, custom fields |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### TypeScript Interface

```ts
type PropertyType = "site" | "app";
type PropertyStatus = "active" | "paused" | "archived" | "error";
type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

interface HubProperty {
  id: string;
  name: string;
  slug: string;
  url: string;
  property_type: PropertyType;
  preset: string | null;
  enabled_modules: string[];       // CmsModuleName[]
  supabase_project_ref: string | null;
  supabase_url: string | null;
  status: PropertyStatus;
  health_status: HealthStatus;
  last_deploy_at: string | null;
  ssl_valid: boolean;
  ssl_expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

### Property Types in Practice

A single product often has **two** properties registered in the Hub:

| Product | Property 1 (site) | Property 2 (app) |
|---------|-------------------|-------------------|
| HomeDoc | homedoc.com marketing site | HomeDoc SaaS platform |
| ESGsource | esgsource.com directory site | — (content site only) |
| Universal CMS | pandotic.dev test site | — (internal test only) |

Both properties in the same product live in the same repo but use different admin interfaces from this package:
- The marketing site uses the **Marketing Website CMS** (driven by `CmsConfig`)
- The app uses the **App Admin** (driven by `AppConfig`)

### Relationship to CmsConfig / AppConfig

- **Sites** map to a `CmsConfig` — the existing 31-module system
- **Apps** map to an `AppConfig` — a parallel config system for app-specific modules (user management, subscriptions, billing, notifications, etc.)

The Hub stores `enabled_modules` and `preset` as a snapshot so it can render module-aware UI without connecting to the property's database. The property's own config remains the source of truth.

---

## App Admin

The App Admin is the counterpart to the Marketing CMS, purpose-built for SaaS application management. While the Marketing CMS manages content (articles, SEO, media), the App Admin manages the product itself (users, data, operations).

### What It Manages

- **User management** — app users, roles, permissions, account status
- **Subscriptions & billing** — plan management, payment status, usage tracking
- **App-specific data** — whatever the product's core data models are (e.g., HomeDoc: properties, inspections, reports)
- **Notifications** — email templates, push notifications, in-app messaging config
- **Feature flags** — toggle features per user, per plan, per environment
- **Support/tickets** — user support requests, issue tracking
- **App analytics** — usage metrics, retention, feature adoption

### AppConfig (Parallel to CmsConfig)

The App Admin needs its own module system, mirroring how `CmsConfig.modules` works for the Marketing CMS:

```ts
type AppModuleName =
  | "userManagement"
  | "subscriptions"
  | "billing"
  | "notifications"
  | "featureFlags"
  | "supportTickets"
  | "appAnalytics"
  | "dataExport"
  | "webhooks"
  | "apiKeys"
  // ... more added as bespoke features get extracted

interface AppConfig {
  appName: string;
  appUrl: string;
  modules: Record<AppModuleName, boolean>;
  roles: AppRole[];
  adminNav: AppNavGroup[];
}
```

Apps enable only the modules they need. New modules are added to the package as bespoke features get generalized (see "Bespoke-to-Universal Pipeline" above).

### How App Admin Differs from Marketing CMS

| | Marketing CMS | App Admin |
|--|---------------|-----------|
| **Purpose** | Manage the website | Manage the product |
| **Users** | Content editors, SEO team | Product team, support, ops |
| **Data** | Articles, pages, media | App users, subscriptions, product data |
| **Config** | `CmsConfig` | `AppConfig` |
| **Modules** | 31 content/SEO modules | User, billing, ops modules |
| **Update cadence** | More frequent, lower risk | Strict, incremental, gated |

---

## Groups

Groups organize properties into portfolios and provide scoped access for B2B clients and internal teams.

### How Groups Work

- A property can belong to **multiple groups** (e.g., "All Internal Sites" + "Finance Team Sites")
- A B2B client company gets a group with their assigned sites/apps — they only see that group in the Hub
- Internal groups are for the platform owner's organization (no external access)
- The super-admin sees all groups and all properties

### Example: HomeDoc (SaaS App)

HomeDoc is a SaaS app registered as a property. Within HomeDoc, each client company (e.g., "Acme Plumbing") is a **group** with a portfolio of individual user accounts. The group layer sits between individual logins and the platform super-admin managing HomeDoc.

### Fields

**hub_groups:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Group name (e.g., "Client: Acme Corp") |
| `slug` | text | Unique URL-safe identifier |
| `description` | text? | |
| `group_type` | `"client" \| "internal" \| "custom"` | Purpose categorization |
| `metadata` | jsonb | Custom fields |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**hub_group_properties** (join table):

| Field | Type | Description |
|-------|------|-------------|
| `group_id` | uuid | FK to hub_groups |
| `property_id` | uuid | FK to hub_properties |
| `assigned_at` | timestamptz | |

### TypeScript Interfaces

```ts
interface HubGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  group_type: "client" | "internal" | "custom";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface GroupPropertyAssignment {
  group_id: string;
  property_id: string;
  assigned_at: string;
}
```

### Group-Level Features

- **Aggregated analytics** — combined stats across all properties in the group
- **Group dashboard** — overview of all assigned properties with health indicators
- **Group-scoped activity feed** — recent actions across group properties only

---

## Users & Access Control

### Hub Roles

The Hub introduces platform-level roles that sit above the existing per-site `CmsRole` (admin / editor / moderator):

| Hub Role | Access |
|----------|--------|
| `super_admin` | Full access to all properties, groups, agents, settings |
| `group_admin` | Manage properties and users within assigned groups |
| `member` | View and interact with properties in assigned groups |
| `viewer` | Read-only access to assigned groups |

### Fields

**hub_users:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `auth_user_id` | uuid | FK to Supabase auth.users (unique) |
| `display_name` | text | |
| `email` | text | |
| `hub_role` | `HubRole` | Platform-level role |
| `avatar_url` | text? | |
| `last_active_at` | timestamptz? | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**hub_user_group_access** (join table):

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | uuid | FK to hub_users |
| `group_id` | uuid | FK to hub_groups |
| `role` | `"group_admin" \| "member" \| "viewer"` | Role within this group |
| `granted_at` | timestamptz | |
| `granted_by` | uuid? | FK to hub_users |

### TypeScript Interfaces

```ts
type HubRole = "super_admin" | "group_admin" | "member" | "viewer";

interface HubUser {
  id: string;
  auth_user_id: string;
  display_name: string;
  email: string;
  hub_role: HubRole;
  avatar_url: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

interface HubUserGroupAccess {
  user_id: string;
  group_id: string;
  role: "group_admin" | "member" | "viewer";
  granted_at: string;
  granted_by: string | null;
}
```

### Access Resolution

A user's visible properties are determined by:

1. **super_admin** — sees everything
2. **group-scoped users** — sees properties assigned to their group(s) only
3. RLS policies enforce this at the database level

---

## Hub Dashboard Views

### Main Overview (Super Admin)

- **Stats row** — total sites, total apps, active agents, pending reviews (aggregated), error count, total published content
- **Property grid** — all properties as cards with health status indicators (green/yellow/red/gray dot), type badge (site/app), last deploy time
- **Activity feed** — 10 most recent actions across all properties
- **Agent overview** — any running or errored agents highlighted

### Group Dashboard

- Same layout as main overview but scoped to a single group's properties
- Group-level aggregated stats

### Property Detail

- Full status: health, SSL, last deploy, uptime
- Enabled modules list
- Assigned agents and their last run status
- Recent activity for this property
- Link to open the property's own admin panel

---

## Claude Agent Workflows

AI agents run automated tasks against registered properties.

### Agent Types

| Agent Type | Description |
|------------|-------------|
| `seo_audit` | Full site SEO audit — meta tags, headings, structured data, page speed |
| `broken_link_checker` | Scan for 404s, redirect chains, broken external links |
| `image_optimization` | Find unoptimized images, missing alt text, oversized files |
| `dependency_updates` | Check for outdated npm packages, security vulnerabilities |
| `performance_monitoring` | Lighthouse scores, Core Web Vitals, load time tracking |
| `content_generation` | Generate article drafts, meta descriptions, content briefs |
| `keyword_research` | Keyword opportunity analysis, competitor gap analysis, SERP tracking |
| `bug_triage` | Analyze error logs, group by pattern, suggest fixes |

### Agent Configuration

Each agent is configured per-property with optional cron scheduling:

```ts
type AgentType =
  | "seo_audit"
  | "broken_link_checker"
  | "image_optimization"
  | "dependency_updates"
  | "performance_monitoring"
  | "content_generation"
  | "keyword_research"
  | "bug_triage";

type AgentStatus = "idle" | "running" | "error" | "disabled";
type AgentRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

interface AgentConfig {
  id: string;
  name: string;
  agent_type: AgentType;
  property_id: string;
  enabled: boolean;
  schedule_cron: string | null;     // null = manual trigger only
  config: Record<string, unknown>;  // agent-specific settings
  last_run_at: string | null;
  last_run_status: AgentRunStatus | null;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
}
```

### Agent Runs

Every execution is logged as a run:

```ts
interface AgentRun {
  id: string;
  agent_id: string;
  status: AgentRunStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  summary: string | null;           // human-readable result
  output: Record<string, unknown>;  // structured results
  error_message: string | null;
  triggered_by: "schedule" | "manual";
  triggered_by_user_id: string | null;
  created_at: string;
}
```

### Agent Dashboard UI

- **Agent list** — all configured agents with status, type, target property, last run
- **Agent detail** — run history table, success rate, average duration
- **Create/edit** — select property, agent type, schedule, type-specific config
- **Manual trigger** — run any agent on demand

### Execution Model

The Hub does **not** execute agents directly. It provides state management (create run, update status, query history). Actual execution happens in the consuming project via edge functions, cron jobs, or external services that call back to update run status.

---

## Social Media Content & Briefs

Generate social content from published articles and maintain brand voice consistency. **No direct API posting** — content and briefs are generated for copy/paste or use in external tools (Buffer, Hootsuite, native platforms).

### Brand Voice Briefs

Each property has a brand voice brief that guides content generation:

```ts
type SocialPlatform = "twitter" | "linkedin" | "facebook" | "instagram" | "threads" | "bluesky";

interface BrandVoiceBrief {
  id: string;
  property_id: string;
  tone: string;                     // e.g., "professional but approachable"
  audience: string;                 // target audience description
  key_themes: string[];
  dos: string[];                    // style guidelines to follow
  donts: string[];                  // things to avoid
  example_posts: Record<SocialPlatform, string[]>;
  updated_at: string;
}
```

### Social Content Items

Generated content ready for distribution:

```ts
type SocialContentStatus = "draft" | "ready" | "posted" | "archived";

interface SocialContentItem {
  id: string;
  property_id: string;
  source_content_id: string | null; // FK to the article it was generated from
  source_content_title: string | null;
  platform: SocialPlatform;
  body: string;
  media_urls: string[];
  hashtags: string[];
  status: SocialContentStatus;
  scheduled_for: string | null;     // target date on content calendar
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

### Social Dashboard UI

- **Content calendar** — monthly view with scheduled content items per property
- **Brand voice editor** — edit brief per property (tone, dos/donts, examples)
- **Content generator** — select a published article, generate platform-specific posts
- **Content list** — filterable by property, platform, status

---

## Hub Activity Log

Cross-property activity tracking at the Hub level:

```ts
interface HubActivityLogEntry {
  id: string;
  user_id: string | null;
  property_id: string | null;
  group_id: string | null;
  action: string;
  entity_type: string;              // "property", "group", "agent", "social_content", etc.
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
```

This is separate from the per-site `ActivityLogEntry` (which tracks content actions within a single site). The Hub activity log tracks platform-level actions: property registration, group assignments, agent configuration, user access changes.

---

## Database Schema

All Hub tables use the `hub_` prefix. Migrations start at `00100_` to avoid collision with per-site migrations (`00001_` through `00022_`).

### Migration Files

| Migration | Tables |
|-----------|--------|
| `00100_hub_properties` | `hub_properties` |
| `00101_hub_groups` | `hub_groups`, `hub_group_properties` |
| `00102_hub_users` | `hub_users`, `hub_user_group_access` |
| `00103_hub_activity_log` | `hub_activity_log` |
| `00104_agents` | `hub_agents`, `hub_agent_runs` |
| `00105_social_content` | `hub_brand_voice_briefs`, `hub_social_content` |

### RLS Policies

Every table needs Row Level Security:

- **super_admin** — full CRUD on all rows
- **group_admin** — CRUD on rows linked to their assigned groups (via property -> group_properties -> group -> user_group_access)
- **member** — read + limited write on rows in their groups
- **viewer** — read-only on rows in their groups

The access chain for group-scoped users: `hub_user_group_access.group_id` -> `hub_group_properties.group_id` -> filter rows by `property_id`.

### SQL: hub_properties

```sql
CREATE TABLE IF NOT EXISTS hub_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  url text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('site', 'app')),
  preset text,
  enabled_modules text[] DEFAULT '{}',
  supabase_project_ref text,
  supabase_url text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'archived', 'error')),
  health_status text NOT NULL DEFAULT 'unknown'
    CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  last_deploy_at timestamptz,
  ssl_valid boolean DEFAULT true,
  ssl_expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_hub_properties_type ON hub_properties(property_type);
CREATE INDEX idx_hub_properties_status ON hub_properties(status);
```

### SQL: hub_groups

```sql
CREATE TABLE IF NOT EXISTS hub_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  group_type text NOT NULL DEFAULT 'custom'
    CHECK (group_type IN ('client', 'internal', 'custom')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hub_group_properties (
  group_id uuid NOT NULL REFERENCES hub_groups(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, property_id)
);
```

### SQL: hub_users

```sql
CREATE TABLE IF NOT EXISTS hub_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  email text NOT NULL,
  hub_role text NOT NULL DEFAULT 'viewer'
    CHECK (hub_role IN ('super_admin', 'group_admin', 'member', 'viewer')),
  avatar_url text,
  last_active_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hub_user_group_access (
  user_id uuid NOT NULL REFERENCES hub_users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES hub_groups(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('group_admin', 'member', 'viewer')),
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES hub_users(id),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX idx_hub_users_auth ON hub_users(auth_user_id);
```

### SQL: hub_activity_log

```sql
CREATE TABLE IF NOT EXISTS hub_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES hub_users(id),
  property_id uuid REFERENCES hub_properties(id),
  group_id uuid REFERENCES hub_groups(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_hub_activity_property ON hub_activity_log(property_id, created_at DESC);
CREATE INDEX idx_hub_activity_user ON hub_activity_log(user_id, created_at DESC);
```

### SQL: hub_agents

```sql
CREATE TABLE IF NOT EXISTS hub_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  agent_type text NOT NULL,
  property_id uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  schedule_cron text,
  config jsonb DEFAULT '{}',
  last_run_at timestamptz,
  last_run_status text,
  status text NOT NULL DEFAULT 'idle'
    CHECK (status IN ('idle', 'running', 'error', 'disabled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hub_agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  summary text,
  output jsonb DEFAULT '{}',
  error_message text,
  triggered_by text NOT NULL DEFAULT 'manual'
    CHECK (triggered_by IN ('schedule', 'manual')),
  triggered_by_user_id uuid REFERENCES hub_users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agent_runs_agent ON hub_agent_runs(agent_id, created_at DESC);
```

### SQL: hub_social_content

```sql
CREATE TABLE IF NOT EXISTS hub_brand_voice_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  tone text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  key_themes text[] DEFAULT '{}',
  dos text[] DEFAULT '{}',
  donts text[] DEFAULT '{}',
  example_posts jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id)
);

CREATE TABLE IF NOT EXISTS hub_social_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  source_content_id text,
  source_content_title text,
  platform text NOT NULL,
  body text NOT NULL,
  media_urls text[] DEFAULT '{}',
  hashtags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'posted', 'archived')),
  scheduled_for timestamptz,
  created_by uuid REFERENCES hub_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_social_content_property ON hub_social_content(property_id, scheduled_for);
CREATE INDEX idx_social_content_status ON hub_social_content(status);
```

---

## Hub Config

Extends the existing config pattern from `src/config.ts`:

```ts
type HubModuleName =
  | "properties"
  | "groups"
  | "agents"
  | "socialContent"
  | "hubUsers"
  | "hubActivityLog"
  | "hubAnalytics";

interface HubConfig {
  hubName: string;
  hubUrl: string;
  modules: Record<HubModuleName, boolean>;
}

const HUB_MODULE_MIGRATIONS: Record<HubModuleName, string[]> = {
  properties:     ["00100_hub_properties"],
  groups:         ["00101_hub_groups"],
  hubUsers:       ["00102_hub_users"],
  hubActivityLog: ["00103_hub_activity_log"],
  agents:         ["00104_agents"],
  socialContent:  ["00105_social_content"],
  hubAnalytics:   [],  // uses existing tables, no extra migration
};
```

---

## Integration Architecture

### How the Hub Connects to Individual Properties

The Hub has its **own** Supabase project for Hub-level data (properties, groups, users, agents, social content). Each managed property has its **own** Supabase project for site/app-specific data (content, media, reviews, etc.).

The Hub does **not** hold multiple Supabase connections simultaneously. Instead, cross-property data uses a **callback/fetcher pattern**:

```ts
interface PropertyDataFetcher {
  getContentCount(propertyId: string): Promise<number>;
  getErrorCount(propertyId: string): Promise<number>;
  getTrafficSummary(propertyId: string): Promise<{ pageviews: number; visitors: number }>;
  getPendingReviewCount(propertyId: string): Promise<number>;
}
```

The consuming project implements this interface and handles the multi-project connection logic (e.g., via Supabase Management API, direct connections, or cached snapshots).

### Webhooks & Events

Properties can push status updates to the Hub via webhooks:

- **Deploy events** — update `last_deploy_at`, `health_status`
- **Health checks** — periodic pings that update `health_status`
- **Error spikes** — trigger `health_status` change to `degraded`

The webhook endpoint lives in the consuming project, not the npm package.

### Relationship Map

```
hub_users
  └── hub_user_group_access ──> hub_groups
                                  └── hub_group_properties ──> hub_properties
                                                                 ├── hub_agents
                                                                 │     └── hub_agent_runs
                                                                 ├── hub_brand_voice_briefs
                                                                 ├── hub_social_content
                                                                 └── hub_activity_log
```

---

## Package Exports (Planned)

When implemented in `@pandotic/universal-cms`, these will be the new export paths:

```
@pandotic/universal-cms/types/hub      → HubProperty, HubGroup, HubUser, etc.
@pandotic/universal-cms/types/agent    → AgentConfig, AgentRun, AgentType
@pandotic/universal-cms/types/social   → BrandVoiceBrief, SocialContentItem, SocialPlatform
@pandotic/universal-cms/data/hub       → CRUD functions for all hub tables
@pandotic/universal-cms/components/hub → HubProvider, HubDashboard, PropertyList, etc.
```

All data functions follow the client-injection pattern:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

function listProperties(
  supabase: SupabaseClient,
  filters?: { type?: PropertyType; status?: PropertyStatus; groupId?: string }
): Promise<HubProperty[]>;
```
