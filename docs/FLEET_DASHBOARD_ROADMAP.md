# Fleet Dashboard — Phases 3-5 Roadmap

## Phase 3: Onboarding Improvements (Next Session)

Phase 3a-d (property types, wizard, GitHub API, Add Project button) are **merged**. These improvements round it out.

### 3e. GitHub OAuth Flow
**Currently:** Users paste a personal access token into a text field.
**Goal:** Add a "Connect GitHub" button that initiates OAuth, stores the token server-side per user.

**Implementation:**
- Extend `hub_users` with `github_access_token` (encrypted) and `github_username`
- Migration `00110_user_github_tokens.sql`
- Update `/api/auth/github/route.ts` to store token on hub_users after OAuth exchange
- Onboarding wizard checks if user already has token → skip token step
- Token refresh handling for expired tokens

**Files:** `hub_users` migration, `hub-users.ts` types/data, `/api/auth/github`, onboard page

### 3f. Auto-Detect CMS in Repos
**Goal:** When user selects a GitHub repo, automatically read its `package.json` to detect:
- Is `@pandotic/universal-cms` installed? What version?
- Is `@pandotic/skill-library` installed?
- What modules are enabled (if `cms.config.ts` exists)?

**Implementation:**
- New API: `GET /api/github/repos/[owner]/[repo]/detect?token=...`
- Reads `package.json` via GitHub Content API → extracts dependency versions
- Optionally reads `src/cms.config.ts` for module list
- Pre-fills onboarding Step 3 with detected data
- Sets `cms_installed: true` if CMS dependency found

**Files:** New API route, update onboard page Step 3

### 3g. Module Preset Picker
**Goal:** During onboarding for Next.js projects, let user choose a CMS module preset.

**Implementation:**
- Import `modulePresets` from `@pandotic/universal-cms/config`
- Show preset cards (appMarketing, blog, directory, full) with module counts
- Selected preset stored as `preset` on hub_properties
- Module list stored as `enabled_modules`

**Files:** Onboard page Step 3 addition

---

## Phase 4: Deploy CMS to Projects (Following Session)

### 4a. CMS Deploy Wizard — `/fleet/deploy`

**Goal:** From the dashboard, deploy `@pandotic/universal-cms` to a property that doesn't have it yet.

**3-step wizard (mirrors `/skills/deploy` pattern):**

**Step 1: Select Target**
- List properties where `cms_installed === false` and `platform_type === 'nextjs_supabase'`
- Show property name, GitHub repo, current status
- Only properties with `github_repo` set are eligible

**Step 2: Configure CMS**
- Choose module preset (appMarketing, blog, directory, full, custom)
- Toggle individual modules on/off
- Show required Supabase migrations for selected modules
- Set CMS version (default: latest)

**Step 3: Review & Deploy**
- Summary of what will be added to the repo
- "Create PR" button that:
  1. Creates a feature branch on the target repo
  2. Adds `@pandotic/universal-cms` to `package.json` dependencies
  3. Generates `src/cms.config.ts` with selected modules
  4. Adds `src/app/api/admin/health/route.ts` health endpoint
  5. Adds required Supabase migration files
  6. Creates PR with description listing what was added
- Show PR URL after creation
- Update `hub_package_deployments` with `status: 'pending'`, `github_pr_url`

**API Routes:**
- `POST /api/fleet/deploy` — orchestrates the GitHub PR creation
- Reuses `ghFetch`/`ghJson` helpers from `skill-library/src/deploy/github-pr.ts`

**DB Updates:**
- Sets `cms_installed: true` on the property after PR is merged
- Creates `hub_package_deployment_events` entry with `event_type: 'installed'`

**Files:**
- New page: `fleet-dashboard/src/app/fleet/deploy/page.tsx`
- New API: `fleet-dashboard/src/app/api/fleet/deploy/route.ts`
- New lib: `fleet-dashboard/src/lib/cms-deploy.ts` (generates config files, migration content)

### 4b. Upgrade Orchestration

**Goal:** For properties running an outdated CMS version, create upgrade PRs.

**Dashboard integration:**
- Deployments tab: properties with `installed_version !== latest_version` show an "Upgrade" button
- Click → creates PR that bumps `@pandotic/universal-cms` version in `package.json`
- Batch upgrade: select multiple outdated properties → create PRs for all

**Implementation:**
- `POST /api/fleet/upgrade` — accepts `propertyIds[]`, creates upgrade PRs
- Each PR: updates `package.json` dependency version, adds any new required migrations
- Updates `hub_package_deployments` status to `pending` with PR URL
- Logs `hub_package_deployment_events` with `event_type: 'upgraded'`

**Files:**
- New API: `fleet-dashboard/src/app/api/fleet/upgrade/route.ts`
- Update fleet page Deployments tab with upgrade button

### 4c. PR Status Tracking

**Goal:** Track whether deploy/upgrade PRs have been merged.

**Implementation:**
- Periodic check: `POST /api/deployments/check-prs` — for all deployments with `status: 'pending'` and `github_pr_url`, check PR status via GitHub API
- If PR merged: update `status: 'active'`, `installed_version` to new version, log event
- If PR closed without merge: update `status: 'failed'`, log event
- Could run on a schedule or be triggered manually from dashboard

**Files:**
- New API: `fleet-dashboard/src/app/api/deployments/check-prs/route.ts`

---

## Phase 5: Detailed Spec (Future Sessions)

### 5a. Deployment Detail Slide-Over

**What:** Click a deployment row in the Deployments tab → slide-over panel shows full deployment detail.

**UI Design:**
- Right-side panel (400px wide) with backdrop overlay
- Header: property name, package name, version badge
- Sections:
  1. **Version Info** — installed version, latest version, pinned status with toggle
  2. **Modules** — full list of enabled modules as pills, bespoke modules in purple
  3. **Health Check** — last check timestamp, raw health response data as JSON tree
  4. **GitHub** — repo link, last deploy PR link
  5. **Event History** — timeline of deployment events (installed, upgraded, modules_changed, etc.) with timestamps and triggered_by user

**Data source:** `GET /api/deployments/[id]` already returns deployment + events.

**Implementation notes:**
- Create a `DeploymentDetailPanel` component
- State: `selectedDeploymentId` in the fleet page
- Animate slide-in with CSS transform
- Close on backdrop click or Escape key

**Estimated effort:** ~200 lines of UI component

### 5b. Marketing Provider Editing + Service Notes

**What:** Currently marketing services default to `provider: 'internal'` with no way to change it from the UI. Add inline provider editing and notes.

**UI Design:**
- Click provider text in Marketing tab → inline text edit (same `InlineText` pattern as Business tab)
- Hover service pill → show notes tooltip if notes exist
- Click notes icon → popover with editable textarea

**Implementation notes:**
- Pass `onUpdateService` to provider column
- Add `notes` field to the PATCH call
- Use existing `updateMarketingService` API

**Estimated effort:** ~80 lines

### 5c. Business Notes + Domain Notes Fields

**What:** The DB has `business_notes` and `domain_notes` columns that aren't exposed in the UI yet.

**UI Design:**
- Add a "Notes" column to Business tab (6th column)
- Truncated display (first 50 chars + "...")
- Click to expand into a full textarea popover
- Domain notes: show as tooltip on the domains cell

**Implementation notes:**
- Extend `BusinessCols` component
- Use `InlineText` for short notes, or a modal for long-form editing

**Estimated effort:** ~60 lines

### 5d. API Cost Aggregation on Business Tab

**What:** Show aggregated API costs per property from the `api_usage` tracking system.

**Prerequisites:**
- Properties need to report API usage to the Hub (currently tracked per-site via `api_usage` table in each site's Supabase)
- Need a mechanism to aggregate: either sites push to Hub, or Hub pulls via health endpoint

**Approach (Hub pulls):**
- Extend health endpoint response to include `apiUsage` (already partially there)
- During sync, store cost data in `hub_package_deployments.health_check_data`
- Dashboard aggregates and displays per-property costs

**UI Design:**
- New column in Business tab: "API Costs (MTD)"
- Shows dollar amount with provider breakdown tooltip
- Color coded: green < $50, amber $50-200, red > $200

**Implementation notes:**
- No new migration needed — use existing `health_check_data` JSONB
- Extract costs during sync, store in a summary field
- Or create `hub_property_costs` table if more granular tracking needed

**Estimated effort:** ~150 lines (API extraction + UI column)

### 5e. Auto-Refresh + Real-Time Updates

**What:** The dashboard currently loads data once on mount. Add periodic refresh and real-time awareness.

**Options:**
1. **Polling** (simple) — `setInterval` every 60s to re-fetch `/api/fleet/dashboard`
2. **Supabase Realtime** (reactive) — subscribe to `hub_package_deployments`, `hub_marketing_services`, `hub_properties` changes
3. **Hybrid** — Supabase Realtime for changes, polling as fallback

**Recommended: Option 1 (polling)** for now. Simple, no additional Supabase config needed.

**Implementation:**
```tsx
useEffect(() => {
  loadData();
  const interval = setInterval(loadData, 60_000);
  return () => clearInterval(interval);
}, []);
```

Add a "Last refreshed X seconds ago" indicator in the header.

**Estimated effort:** ~15 lines

### 5f. Column Sorting

**What:** Click column headers to sort the table by that column.

**Implementation:**
- State: `sortColumn: string`, `sortDirection: 'asc' | 'desc'`
- Click header toggles direction (or sets column + asc)
- Sort `filteredProperties` client-side before rendering
- Show sort indicator arrow in active header

**Estimated effort:** ~40 lines

### 5g. Extract & Share Execution

**What:** The `SKILL.md` for Extract & Share is written but has no execution logic. Build the actual skill.

**Workflow when invoked from a project:**
1. Read `package.json` → find `@pandotic/universal-cms` version
2. Read `node_modules/@pandotic/universal-cms/` → get installed package files
3. Scan project's `src/data/`, `src/components/admin/`, `src/app/api/admin/` for local code
4. For each local file with a counterpart in the package: generate diff
5. For each local file without a counterpart: classify as bespoke
6. Generate report: bug fixes, enhancements, new features, domain-specific
7. For extractable items: create cms-core compatible versions
8. Create PR to `pandotic/universal-cms` with the genericized modules
9. Update `hub_package_deployments.bespoke_modules` via Hub API

**Hub integration:**
- New Hub API: `POST /api/deployments/[id]/bespoke-modules` — update the bespoke_modules array
- Dashboard shows bespoke modules in purple pills with "Extract to Core" button (future)

**This is a Claude Code skill, not a dashboard feature.** The skill runs in the project's repo context, not in the Hub. The Hub just tracks and displays the results.

**Estimated effort:** Complex — the SKILL.md defines the workflow, but the actual code analysis + diff generation + PR creation is a substantial Claude Code skill implementation.

### 5h. Domain Management Integration

**What:** Beyond storing domain strings, integrate with DNS/registrar APIs.

**Features:**
- Check domain availability (for projects in "idea" stage)
- DNS status check (A record, CNAME, SSL cert status)
- Registrar info (expiry date, auto-renew status)
- Potential names brainstorming (AI-assisted)

**Implementation:**
- Could integrate with Cloudflare API, Namecheap API, or similar
- Store DNS status in `hub_properties.metadata`
- New Business tab sub-view for domain management

**Estimated effort:** Depends on registrar API choice — likely 300-500 lines including UI

### 5i. Business Milestones Tracking

**What:** Track key business milestones per property (LLC formation, launch date, first revenue, etc.)

**DB Schema:**
```sql
CREATE TABLE hub_property_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES hub_properties(id) ON DELETE CASCADE,
  milestone_type text NOT NULL, -- 'llc_formed', 'launched', 'first_revenue', 'first_client', 'custom'
  title text NOT NULL,
  completed_at timestamptz,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

**UI:**
- Business tab: expandable milestones section per property
- Timeline view showing completed vs. pending milestones
- Predefined milestones: LLC formed, Domain registered, Site launched, CMS installed, First client, First revenue

**Estimated effort:** ~200 lines (migration + types + data + UI)

---

## Priority Order for Future Sessions

| Priority | Feature | Why |
|----------|---------|-----|
| 1 | **5e. Auto-refresh** | 15 lines, immediate UX improvement |
| 2 | **5a. Deployment detail slide-over** | Makes deployments tab actually useful for debugging |
| 3 | **5b. Marketing provider editing** | Completes the marketing CRUD story |
| 4 | **5c. Business notes** | Fields exist in DB, just needs UI |
| 5 | **4a. CMS Deploy Wizard** | Core workflow — deploy CMS to new sites |
| 6 | **3e. GitHub OAuth** | Better UX than pasting tokens |
| 7 | **3f. Auto-detect CMS** | Smart onboarding |
| 8 | **4b. Upgrade orchestration** | Batch version management |
| 9 | **5f. Column sorting** | Polish |
| 10 | **5d. API cost aggregation** | Requires per-site reporting pipeline |
| 11 | **5g. Extract & Share** | Complex skill implementation |
| 12 | **5h. Domain management** | External API integration |
| 13 | **5i. Business milestones** | New table + UI |
