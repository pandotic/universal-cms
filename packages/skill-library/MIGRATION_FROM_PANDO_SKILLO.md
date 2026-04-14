# Migrating from pando-skillo to @pandotic/skill-library

This document provides instructions and a Claude prompt for importing existing
code from the standalone `pando-skillo` repo into this monorepo package.

## Background

The skill library was previously a separate repo (`pando-skillo`) deployed to
Netlify at `pando-skillo.netlify.app`. The fleet-dashboard loaded it as an
external ESM widget. This has been replaced with a native workspace package
at `packages/skill-library` that shares types with the rest of the monorepo.

## Option A: Copy files manually

1. Clone or open the `pando-skillo` repo locally
2. Copy relevant source files into the appropriate directories:

```
pando-skillo/                          → packages/skill-library/
├── src/skills/        (skill defs)    → src/skills/imported/
├── src/types/         (type defs)     → review & merge into src/types/index.ts
├── src/components/    (UI components) → src/components/ (new dir if needed)
├── src/lib/           (utils)         → src/lib/ (new dir if needed)
└── src/data/          (data layer)    → review & merge into src/data/
```

3. After copying, update imports to use the new package structure
4. Run `pnpm --filter @pandotic/skill-library build` to verify

## Option B: Use the Claude prompt below

Open Claude Code in the `pando-skillo` repo and use this prompt. It will
generate a structured export you can paste into this monorepo.

---

## Claude Prompt — Run in pando-skillo repo

Copy and paste this entire prompt into a Claude Code session opened in the
pando-skillo repo:

```
I'm migrating the skill library from this standalone repo into a monorepo
workspace package at `packages/skill-library` inside `universal-cms`.

The target package already has this structure scaffolded:

packages/skill-library/
├── src/
│   ├── types/index.ts          — Core types (SkillDefinition, SkillDeployment, etc.)
│   ├── data/hub-skills.ts      — Supabase CRUD for skill definitions
│   ├── data/hub-skill-deployments.ts — Supabase CRUD for deployments & runs
│   ├── deploy/index.ts         — Deploy adapters (CMS, WordPress, webhook)
│   ├── skills/marketing/index.ts — Built-in marketing skill templates
│   └── index.ts                — Barrel export

The target types already defined:
- SkillPlatform: google_ads | meta_ads | linkedin | twitter | tiktok | email | seo | analytics | content | social_organic | cross_platform
- SkillCategory: acquisition | retention | engagement | analytics | content_creation | brand_management | automation
- SkillDefinition: { id, name, slug, description, platform, category, execution_mode, default_config, config_schema, default_schedule, status, version, tags, created_by, created_at, updated_at }
- SkillDeployment: { id, skill_id, property_id, config_overrides, schedule, target_type, status, last_run_at, last_run_status, deployed_by, created_at, updated_at }
- DeployAdapter interface with execute() and validate() methods
- MarketingSkillTemplate interface for built-in templates

The Supabase data layer uses client-injection pattern:
  every function takes (client: SupabaseClient, ...args) as first param.

Please do the following:

1. Read through all source files in this repo
2. Identify any skill definitions, types, components, or utilities that are NOT
   already covered by the scaffolded types above
3. For each piece of code that should be migrated, output it in this format:

   === FILE: packages/skill-library/src/<path> ===
   <the full file contents, with imports updated to use the new package structure>
   === END FILE ===

4. For any skill definitions that map to MarketingSkillTemplate, convert them to
   that interface format and add them to skills/marketing/index.ts
5. For any UI components (React), output them as:
   === FILE: packages/skill-library/src/components/<name>.tsx ===
6. Flag any code that uses external APIs, environment variables, or auth tokens
   so I know what config to set up in the monorepo
7. At the end, give me a summary of:
   - What was migrated and where it goes
   - What was skipped (and why — e.g., widget mount code no longer needed)
   - Any new dependencies I need to add to packages/skill-library/package.json
   - Any additional exports to add to tsup.config.ts and package.json exports
```

---

## After Migration

Once you've copied the files over:

1. **Add new exports** if needed:
   - `packages/skill-library/package.json` — add entries to `exports`
   - `packages/skill-library/tsup.config.ts` — add entries to `entry`

2. **Build and verify**:
   ```bash
   pnpm --filter @pandotic/skill-library build
   pnpm --filter @pandotic/fleet-dashboard typecheck
   ```

3. **Apply the migration** to Supabase:
   The migration is at `packages/fleet-dashboard/supabase/migrations/00106_hub_skills.sql`
   Apply it to the Pandotic Hub Supabase project (rimbgolutrxpmwsoswhq).

4. **Update fleet-dashboard pages** to use any migrated components from
   `@pandotic/skill-library` instead of the old external widget.

5. **Decommission the old repo**:
   - Remove the Netlify deployment for pando-skillo
   - Archive the pando-skillo repo on GitHub
   - Remove the external widget URL reference (already done — the old
     `/skill-store` page now redirects to `/skills`)
