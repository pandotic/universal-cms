# Chunk 2 — Migration cleanup runbook

Previous state: 13 migration files had numbering collisions or missing history
entries. The Supabase CLI was blocked — every `supabase db push` errored with
"Found local migration files to be inserted before the last migration on
remote database."

This chunk renames the un-applied / partially-applied files to `00503+` slots
(after the highest-applied `00502_rbac_mapping`), wraps `00505_hub_skills`
enum definitions in exception-safe blocks, and adds a migration file for
`feature_flags` so fresh projects can reproduce the schema.

---

## Rename map (recorded for reference)

| Old filename | New filename | Status on live DB |
|---|---|---|
| `00106_error_log.sql`                    | `00503_error_log.sql`                    | un-applied — safe to push |
| `00106_hub_api_key_assignments.sql`      | `00504_hub_api_key_assignments.sql`      | un-applied — safe to push |
| `00106_hub_skills.sql`                   | `00505_hub_skills.sql`                   | un-applied — safe to push |
| `00107_projects.sql`                     | `00506_projects.sql`                     | **applied** (manual, not recorded) |
| `00110_property_marketing_extensions.sql`| `00507_property_marketing_extensions.sql`| likely applied — idempotent re-run |
| `00111_fix_hub_users_rls_recursion.sql`  | `00508_fix_hub_users_rls_recursion.sql`  | likely applied — idempotent re-run |
| `00118_hub_property_versioning.sql`      | `00509_hub_property_versioning.sql`      | un-applied — safe to push |
| `00120_promptkit_history.sql`            | `00510_promptkit_history.sql`            | un-applied — safe to push |
| `00120_team_hub_initial.sql`             | `00511_team_hub_initial.sql`             | **applied** (manual, not recorded) |
| `00121_promptkit_history_property.sql`   | `00512_promptkit_history_property.sql`   | un-applied — safe to push |
| `00121_team_hub_phase2.sql`              | `00513_team_hub_phase2.sql`              | **applied** (manual, not recorded) |
| `00122_team_hub_phase3.sql`              | `00514_team_hub_phase3.sql`              | **applied** (manual, not recorded) |
| `00123_team_hub_auth.sql`                | `00515_team_hub_auth.sql`                | **applied** (manual, not recorded) |
| *(new)*                                  | `00516_feature_flags.sql`                | **applied** via chunk-1-ops.sql |

Archived: `_consolidated_00110-00117.sql` → `archive/_consolidated_00110-00117.sql`
(was a backup consolidation, never meant to be applied).

---

## Run this sequence locally

From `/Users/dangolden/Documents/Github/universal-cms`:

```bash
git fetch origin
git checkout claude/cleanup-merged-project-UKjY5
git pull
cd packages/fleet-dashboard

# 1. Tell Supabase these 6 migrations are already applied on the live DB,
#    so `db push` doesn't try to re-run them.
supabase migration repair --status applied \
  00506 00511 00513 00514 00515 00516

# 2. Push the remaining 8 un-applied migrations (all idempotent — safe even
#    if some columns/policies already exist).
supabase db push
```

Expected output from step 2: a list of 8 files being applied
(`00503, 00504, 00505, 00507, 00508, 00509, 00510, 00512`), then
`Finished supabase db push.`

---

## Verification

```bash
supabase db query --linked --output table "
SELECT version, name
  FROM supabase_migrations.schema_migrations
 WHERE version >= '00500'
 ORDER BY version;
"
```

You should see 17 rows:

```
00500_admin_schema_integration
00501_link_admin_schema
00502_rbac_mapping
00503_error_log
00504_hub_api_key_assignments
00505_hub_skills
00506_projects
00507_property_marketing_extensions
00508_fix_hub_users_rls_recursion
00509_hub_property_versioning
00510_promptkit_history
00511_team_hub_initial
00512_promptkit_history_property
00513_team_hub_phase2
00514_team_hub_phase3
00515_team_hub_auth
00516_feature_flags
```

---

## Troubleshooting

**If `supabase migration repair` complains about `SUPABASE_DB_PASSWORD`:**
same workaround as Chunk 1 — either `export SUPABASE_DB_PASSWORD='<from dashboard>'`
before running, or do the whole thing from the SQL editor:

```sql
-- Insert the 6 "already applied" rows manually
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
  ('00506', 'projects'),
  ('00511', 'team_hub_initial'),
  ('00513', 'team_hub_phase2'),
  ('00514', 'team_hub_phase3'),
  ('00515', 'team_hub_auth'),
  ('00516', 'feature_flags')
ON CONFLICT (version) DO NOTHING;
```

Then retry `supabase db push` from the CLI (it'll apply only the 8 remaining).

**If `db push` fails mid-stream:** every migration is idempotent — just rerun
`supabase db push` after fixing the reported issue.
