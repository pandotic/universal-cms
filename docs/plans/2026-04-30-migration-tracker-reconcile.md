# Hub `schema_migrations` Tracker Reconcile

**Status:** ✅ COMPLETED May 4, 2026 — all six missing versions
(`00517`–`00522`) registered against project `rimbgolutrxpmwsoswhq` via
the Step-2 Option A INSERT. Verification probes from Step 1 all came
back positive (the plan-doc index name `issues_open_unique_per_submitter`
was wrong — the actual indexes are `idx_issues_unique_open` /
`idx_todos_unique_open` per `00518_team_hub_unique_open.sql`).
Tracker now shows 6 rows ≥ 00517 as expected.

**One-liner:** The Hub's `supabase_migrations.schema_migrations` table records migrations only through `00516`. Versions `00517`–`00522` were applied as raw SQL via the Supabase web editor, so they exist in the database but were never registered with the migration tracker. `supabase db push --linked` will refuse to run until this is reconciled.

---

## Context

Surfaced Apr 30, 2026 while attempting to verify the `00521 → 00522` rename row on the live Hub (project `rimbgolutrxpmwsoswhq`).

The rename was done in PR #98 — `00521_hub_social_idempotent.sql` → `00522_hub_social_idempotent.sql` — to resolve a filename collision with `00521_api_central_bridge.sql` (added in PR #87). The followups plan flagged that `schema_migrations` might still record the old `00521 / hub_social_idempotent` and need an UPDATE.

What we actually found:

```sql
SELECT version, name FROM supabase_migrations.schema_migrations
WHERE version IN ('00521', '00522')
   OR name ILIKE '%social_idempotent%'
   OR name ILIKE '%api_central%';
-- Returns 0 rows
```

And separately, when running `supabase db push --linked` from a workdir that did pick up `packages/fleet-dashboard/supabase/migrations/`, the CLI reported "remote migration versions not found in local migrations directory" for `00100`–`00117` and `00500`–`00516`. The list **stopped at 00516**.

That gives the full picture: the tracker has rows for `00100`–`00117` and `00500`–`00516`. Everything from `00517` onwards is missing.

The actual database state (separate from the tracker) is correct — those migrations were run via the SQL editor through prior sessions:

- `00517_team_hub_initiatives.sql` (PR #75 / Apr 21) — applied via SQL editor
- `00518_team_hub_unique_open.sql` (PR #81 / Apr 22) — applied via SQL editor
- `00519_hub_skills_scope_reconcile.sql` (PR #81 / Apr 22) — applied via SQL editor
- `00520_hub_agents_idempotent.sql` (PR #84 / Apr 22) — applied via SQL editor
- `00521_api_central_bridge.sql` (PR #87 / Apr 23) — likely applied; verify
- `00522_hub_social_idempotent.sql` (formerly 00521; PR #85+98) — likely applied; verify

The tracker drift is the only real problem.

---

## Why this matters

Until reconciled:

- `supabase db push --linked` aborts with the "remote versions not found" error and refuses to apply any new migration.
- `supabase db pull --linked` fails the same way.
- The CLI's "repair" suggestion (`supabase migration repair --status reverted <version>` for every missing version) is **wrong** for this case — it would mark migrations as reverted on the remote, telling the CLI those changes never happened, when in fact they did. Do not run those commands.

The reconcile fixes the tracker without touching schema or data.

---

## Reconcile plan

Run from the Supabase SQL editor against project `rimbgolutrxpmwsoswhq`:
https://supabase.com/dashboard/project/rimbgolutrxpmwsoswhq/sql/new

### Step 1 — Verify each migration's database state

For every version in `00517`–`00522`, confirm the migration's expected objects exist. Sample probes (extend per migration):

```sql
-- 00517 team hub initiatives
SELECT to_regclass('public.hub_initiatives') IS NOT NULL AS has_table_00517;

-- 00518 team hub unique-open partial indexes
SELECT EXISTS (
  SELECT 1 FROM pg_indexes
  WHERE indexname = 'issues_open_unique_per_submitter'
) AS has_index_00518;

-- 00519 hub_skills scope/manifest_id columns
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='hub_skills' AND column_name='scope'
) AND EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name='hub_skill_versions'
) AS has_objects_00519;

-- 00520 hub_agents text-status (post enum→text)
SELECT data_type
FROM information_schema.columns
WHERE table_name='hub_agent_runs' AND column_name='status';
-- Expect: text

-- 00521 api_central_bridge — pick a table the migration creates
SELECT to_regclass('public.<table_added_by_00521>') IS NOT NULL AS has_table_00521;

-- 00522 hub_social_idempotent — content_pipeline rename + voice_attributes column
SELECT to_regclass('public.hub_content_pipeline') IS NOT NULL
   AND EXISTS (
     SELECT 1 FROM information_schema.columns
     WHERE table_name='hub_brand_voice_briefs' AND column_name='voice_attributes'
   ) AS has_objects_00522;
```

For each version, the source-of-truth file lives at `packages/fleet-dashboard/supabase/migrations/00<NNN>_*.sql` — open it and pick a representative `CREATE TABLE` / `ADD COLUMN` / `CREATE INDEX` to probe.

### Step 2 — For each verified-applied version, register it with the tracker

Two equivalent approaches; pick one:

**Option A — direct INSERT (preferred when SQL editor access is already open):**

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('00517', 'team_hub_initiatives',          ARRAY[]::text[]),
  ('00518', 'team_hub_unique_open',          ARRAY[]::text[]),
  ('00519', 'hub_skills_scope_reconcile',    ARRAY[]::text[]),
  ('00520', 'hub_agents_idempotent',         ARRAY[]::text[]),
  ('00521', 'api_central_bridge',            ARRAY[]::text[]),
  ('00522', 'hub_social_idempotent',         ARRAY[]::text[])
ON CONFLICT (version) DO NOTHING;
```

Skip any rows whose Step-1 probe came back negative. The empty `statements` array is acceptable — it means "marked applied, but the CLI doesn't have the original statement list cached." That mirrors what `supabase migration repair --status applied <v>` produces.

**Option B — CLI:**

```bash
cd packages/fleet-dashboard
supabase link --project-ref rimbgolutrxpmwsoswhq
supabase migration repair --status applied 00517
supabase migration repair --status applied 00518
# … etc for each verified-applied version
```

This requires running from `packages/fleet-dashboard/` (where `supabase/migrations/` resolves), not the repo root. Repo-root invocations were why the prior CLI session failed.

### Step 3 — Verify

```sql
SELECT version, name FROM supabase_migrations.schema_migrations
WHERE version >= '00517'
ORDER BY version;
-- Expect: 6 rows, 00517 through 00522
```

Then:

```bash
cd packages/fleet-dashboard
supabase db push --linked
# Expect: "Linked project is up to date." (or the file→version diff is clean)
```

### Step 4 — If any migration was NOT applied (Step-1 probe negative)

Apply that file via the SQL editor first, then add the tracker row. The migration files are designed to be idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, etc.) so re-running is safe.

---

## Related files / references

- `packages/fleet-dashboard/supabase/migrations/00517_team_hub_initiatives.sql`
- `packages/fleet-dashboard/supabase/migrations/00518_team_hub_unique_open.sql`
- `packages/fleet-dashboard/supabase/migrations/00519_hub_skills_scope_reconcile.sql`
- `packages/fleet-dashboard/supabase/migrations/00520_hub_agents_idempotent.sql`
- `packages/fleet-dashboard/supabase/migrations/00521_api_central_bridge.sql`
- `packages/fleet-dashboard/supabase/migrations/00522_hub_social_idempotent.sql`
- `docs/MIGRATION-RECONCILIATION.md` — older general runbook for migration drift
- `docs/archive/CLEANUP_AUDIT-2026-04-29.md` — the audit that drove the rename
- CLAUDE.md "Outstanding Work" — Manual ops + Stabilization followups sections

## Out of scope

- Changing the CLI's source-of-truth dir convention (the repo nests `supabase/` under `packages/fleet-dashboard/`; that's intentional).
- Restructuring `schema_migrations` itself.
- Reconciling per-site or template migration trees — this is Hub-only.
