# Migration history reconciliation

The Pandotic Hub Supabase project (`rimbgolutrxpmwsoswhq`) has a long history
of schema changes that were applied manually via the dashboard SQL editor
rather than through `supabase db push`. Chunks 1–2 renumbered and
fast-forwarded history to the point where `db push` works cleanly, but
**there is probably still drift** between the shapes of tables/policies in
the live DB and what the current migration files would create on a fresh
project.

This runbook captures the drift for a future "cut a new baseline" pass.
Don't run this during active feature work — wait for a quiet window.

---

## Why bother

- A fresh Supabase project (Stage 1 greenfield pilot) will apply our
  migrations from scratch. If those migrations don't produce the same schema
  the live Hub has, the consumer sites will behave differently than the
  Hub dev environment.
- `supabase db pull` is the source-of-truth mechanism — if it diverges from
  what's committed, we know we have drift.

---

## Procedure

### 1. Spin up a staging copy

Create a new Supabase project `pandotic-hub-staging`. **Don't reuse prod.**

```bash
# Copy the prod schema + data into staging
pg_dump "$PROD_DB_URL" --schema-only --no-owner > /tmp/hub-schema-prod.sql
pg_dump "$PROD_DB_URL" --data-only --no-owner \
  --exclude-table=auth.*  \
  --exclude-table=cron.* \
  --exclude-table=vault.* \
  > /tmp/hub-data-prod.sql

psql "$STAGING_DB_URL" -f /tmp/hub-schema-prod.sql
psql "$STAGING_DB_URL" -f /tmp/hub-data-prod.sql
```

(Fine to skip data; schema-only dump is enough for drift detection.)

### 2. Pull the current schema into a temp branch

From a fresh checkout of the repo against **staging**:

```bash
git checkout -b chore/migration-baseline-reset
cd packages/fleet-dashboard
supabase link --project-ref <staging-ref>
supabase db pull --schema public,auth
```

This writes a new migration at
`packages/fleet-dashboard/supabase/migrations/<timestamp>_remote_schema.sql`
representing "what actually exists."

### 3. Compare the pulled schema against committed migrations

```bash
# What would our current migrations produce, starting from empty?
# (requires a local Postgres — supabase local start sets this up)
supabase start
supabase db reset  # applies all committed migrations to local
pg_dump "postgresql://postgres:postgres@localhost:54322/postgres" \
  --schema-only --no-owner > /tmp/hub-schema-committed.sql

# Diff vs the pulled remote_schema
diff /tmp/hub-schema-committed.sql \
     packages/fleet-dashboard/supabase/migrations/<timestamp>_remote_schema.sql
```

The diff is the **drift**. Likely categories:
- Columns added via dashboard that aren't in any migration.
- RLS policies tweaked via dashboard.
- Triggers that drifted.
- Indexes added for perf without a migration.

### 4. Capture as a new baseline (or patches)

Two strategies:

**A. Baseline reset (aggressive).**
- Delete every `migrations/00100–00516` file.
- Keep only `<timestamp>_remote_schema.sql` as the new baseline.
- Mark it as applied on prod: `supabase migration repair --status applied <timestamp>`.
- Downside: loses atomic history — future consumers can't replay step by
  step, only "get to this state."

**B. Drift-patch migrations (conservative).**
- Leave existing migration files alone.
- Add new small migration files (`00520_*.sql`, `00521_*.sql`, …) that
  codify each drift — one per logical change.
- Each new file must be idempotent (the schema already has the change on
  prod).
- Run `supabase migration repair --status applied 00520 00521 …` on prod
  so the CLI doesn't try to re-apply them.

**Strategy B is safer** for a production DB with real users. Strategy A is
fine if we want to ship a clean installer for Stage 1 and accept that the
Hub's own migration history is a one-way door.

### 5. Smoke test against greenfield

Before landing anything:
- Create a **fresh** Supabase project.
- `supabase db push` against it.
- Verify every `/fleet`, `/properties`, `/team-hub/*`, `/marketing-ops/*`,
  `/feature-flags`, `/skills` page loads without errors against the fresh DB.
- Run `pnpm test` — cms-core has 43+ tests using a mocked Supabase client;
  they'll catch schema-shape regressions.

---

## Known drift (as of April 2026)

Collected from chunk-2-runbook post-push output. Some of these may already
be codified — verify before treating as drift.

- `hub_properties` — columns `auto_pilot_enabled`, `kill_switch`,
  `relationship_type`, `parent_property_id`, etc. existed on prod before
  the migration (00507) that codifies them ran.
- `error_log`, `hub_skills`, `hub_skill_deployments`,
  `hub_skill_deployment_runs`, `promptkit_history` — all already present on
  prod when chunk 2 pushed the "creating" migrations.
- Migrations 00506, 00511, 00513, 00514, 00515 — applied before chunk 2
  renumbered; committed as a specific repair in the chunk-2 runbook.

These are probably fine; just confirm by running the diff above and not
being surprised.

---

## When to actually do this

Not urgent. Triggers that would push this from "nice-to-have" to "do now":

1. Stage 2+ sites (after greenfield pilot) report schema discrepancies.
2. A new feature requires a schema change and we're not confident what's
   actually on prod.
3. We want to sell the Hub ops schema as part of an open-source / packaged
   release.

Until one of those lands, leaving the history as "current migrations +
live-applied drift" is fine.
