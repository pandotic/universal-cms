-- ═══════════════════════════════════════════════════════════════════════════
-- schedule-granola-sync.sql
-- Schedules the fetch-granola edge function via pg_cron so Granola transcripts
-- appear on /team-hub/meetings/[id] automatically instead of requiring a
-- manual "Sync now" click.
--
-- Run via:
--   cd packages/fleet-dashboard
--   supabase db query --linked --file supabase/manual/schedule-granola-sync.sql
--
-- Prereqs (one-time per Supabase project — see docs/GRANOLA-CRON.md):
--   1. pg_cron extension enabled (Dashboard → Database → Extensions)
--   2. pg_net  extension enabled (same place)
--   3. Service-role key stored in vault.secrets under the name
--      'supabase_service_role_key'
--
-- Idempotent — safe to re-run; cron.schedule() replaces existing jobs of the
-- same name.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Replaces the fetch-granola-30min job if it already exists.
SELECT cron.unschedule('fetch-granola-30min')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fetch-granola-30min');

SELECT cron.schedule(
  'fetch-granola-30min',
  '*/30 * * * *',
  $cron$
    SELECT net.http_post(
      url     := 'https://rimbgolutrxpmwsoswhq.supabase.co/functions/v1/fetch-granola',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization',
        'Bearer ' || (
          SELECT decrypted_secret
            FROM vault.decrypted_secrets
           WHERE name = 'supabase_service_role_key'
           LIMIT 1
        )
      ),
      body    := '{}'::jsonb
    ) AS request_id;
  $cron$
);

-- Verification
SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname = 'fetch-granola-30min';
