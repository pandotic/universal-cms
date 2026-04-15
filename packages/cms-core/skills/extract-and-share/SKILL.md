---
name: extract-and-share
description: Compare local project code against the @pandotic/universal-cms package to identify bug fixes, improvements, and new features that should be upstreamed to the core CMS.
scope: site
category: developer_tools
platform: claude_code
execution_mode: manual
version: "0.1.0"
tags:
  - cms
  - upgrades
  - code-extraction
  - upstream
---

# Extract & Share Upgrades

A universal Claude Code skill deployed to each project that consumes `@pandotic/universal-cms`. When invoked, it compares the local project's code against the core npm package and identifies improvements worth sharing back.

## What This Skill Does

1. **Detects modified core code** - Finds local changes to files that originated from the CMS package (bug fixes, performance improvements, UI enhancements)
2. **Discovers new features** - Identifies bespoke tools, data displays, export utilities, API integrations, or UI components built locally that don't exist in the core
3. **Classifies changes** - Labels each diff as: `bug-fix`, `enhancement`, `new-feature`, or `domain-specific`
4. **Generates extraction report** - Summarizes what could be upstreamed vs. what's domain-specific
5. **Creates upstream PR** (optional) - For extractable items, generates the cms-core compatible version and creates a PR to `pandotic/universal-cms`

## Workflow

### Step 1: Inventory
- Read `package.json` to find the installed `@pandotic/universal-cms` version
- Scan local directories for CMS-related code:
  - `src/data/` - Data functions (compare against cms-core patterns)
  - `src/components/admin/` - Admin UI components
  - `src/app/api/admin/` - Admin API routes
  - `src/lib/cms/` or similar - CMS utilities
  - `supabase/migrations/` - Database migrations

### Step 2: Compare
- For each local file that has a counterpart in `@pandotic/universal-cms`:
  - Diff against the installed package version
  - Classify: is this a bug fix, enhancement, or customization?
- For each local file with no counterpart:
  - Is it domain-specific (references project-specific entities/tables)?
  - Or is it a generic tool (data export, bulk operations, integration pattern)?

### Step 3: Report
Generate a structured report:
```
## Extraction Report for [project-name]
CMS Version: [installed version]

### Bug Fixes (upstream immediately)
- [file]: [description of fix]

### Enhancements (review for upstream)
- [file]: [description of improvement]

### New Features (potential new modules)
- [feature-name]: [description, which cms-core pattern it follows]

### Domain-Specific (stay local)
- [file]: [why it's project-specific]
```

### Step 4: Extract (optional)
For items marked as extractable:
1. Refactor to follow cms-core patterns:
   - Client-injection: `fn(supabase: SupabaseClient, ...args)`
   - Standard types in `src/types/`
   - Migration file with proper naming
   - Export in `package.json` and `tsup.config.ts`
2. Add to `CmsModuleName` union if it's a new module
3. Create PR to `pandotic/universal-cms` with the genericized code

## Integration with Hub

The `bespoke_modules` field in `hub_package_deployments` tracks which custom modules each site has. When this skill runs, it can update that field to reflect newly discovered bespoke modules, making them visible in the Fleet Dashboard's Deployments tab.

## Usage

Invoke from any project that uses `@pandotic/universal-cms`:
```
/extract-and-share
```

Or target a specific area:
```
/extract-and-share --scope=data     # Only check data functions
/extract-and-share --scope=components  # Only check UI components
/extract-and-share --report-only    # Don't create PRs, just report
```
