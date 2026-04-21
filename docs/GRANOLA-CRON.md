# Granola transcript auto-sync runbook

`fetch-granola` is a Supabase edge function at
`packages/fleet-dashboard/supabase/functions/fetch-granola/` that pulls new
meeting transcripts from Granola and writes them to `meeting_transcripts`.
By default it's manual-trigger (Hub clicks a button). This runbook wires it
to run every 30 minutes via `pg_cron` so `/team-hub/meetings/[id]` shows
transcripts without a click.

Target project: **`rimbgolutrxpmwsoswhq`** (Pandotic Hub).

---

## Prerequisites (one-time)

### 1. Enable the required Postgres extensions

🔗 Dashboard → Database → Extensions:
https://supabase.com/dashboard/project/rimbgolutrxpmwsoswhq/database/extensions

Enable:
- **`pg_cron`** — scheduler.
- **`pg_net`** — HTTP client from Postgres.
- **`supabase_vault`** — usually already on (stores encrypted secrets).

### 2. Store the service-role key in Supabase Vault

`pg_cron` runs as a Postgres role, not as a Supabase JWT client. To call the
edge function we need a service-role key, and it must live somewhere the
scheduled SQL can read at runtime. Vault encrypts it at rest.

🔗 Grab the service-role key from
https://supabase.com/dashboard/project/rimbgolutrxpmwsoswhq/settings/api
(the `service_role` key — **NOT** the anon key).

🔗 Paste into the SQL editor:
https://supabase.com/dashboard/project/rimbgolutrxpmwsoswhq/sql/new

```sql
-- Idempotent: inserts or updates.
INSERT INTO vault.secrets (name, secret)
VALUES ('supabase_service_role_key', 'paste-service-role-key-here')
ON CONFLICT (name) DO UPDATE SET secret = excluded.secret;

-- Verify
SELECT name, created_at FROM vault.secrets WHERE name = 'supabase_service_role_key';
```

The secret is encrypted on disk; only `vault.decrypted_secrets` (admin-only
view) exposes the plaintext at query time.

### 3. Confirm `ANTHROPIC_API_KEY` is set on functions

The `fetch-granola` function also calls Claude to summarize. This secret is a
Supabase Functions secret (different storage than Vault):

```bash
supabase secrets list --linked | grep ANTHROPIC_API_KEY
```

If missing:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---

## Schedule the cron job

From the repo, with the branch checked out:

```bash
cd packages/fleet-dashboard
supabase db query --linked --file supabase/manual/schedule-granola-sync.sql
```

Expected output:
- One row in `cron.job` with `jobname = 'fetch-granola-30min'`, schedule `*/30 * * * *`.

---

## Verify it's running

Wait 30+ minutes after scheduling, then check the cron audit log:

```sql
SELECT jobid, runid, start_time, end_time, status, return_message
  FROM cron.job_run_details
 WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-granola-30min')
 ORDER BY start_time DESC
 LIMIT 5;
```

Expected: rows with `status = 'succeeded'`. If you see `status = 'failed'`,
`return_message` will explain (auth error, network timeout, etc.).

To verify transcripts are actually landing, check `meeting_transcripts`:

```sql
SELECT meeting_id, granola_meeting_id, processed_at, length(transcript_text)
  FROM meeting_transcripts
 ORDER BY created_at DESC
 LIMIT 5;
```

---

## Adjusting the schedule

Default is every 30 minutes (`*/30 * * * *`). To change:

```sql
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'fetch-granola-30min'),
  schedule := '*/15 * * * *'  -- every 15 min, or whatever cron expression
);
```

## Disabling

```sql
SELECT cron.unschedule('fetch-granola-30min');
```
