-- ============================================================
-- Team Hub: prevent duplicate open issues / to-dos
-- ============================================================
-- Partial unique indexes on (normalized text, owner/submitter) so:
--   • double-clicks and network retries can't create twins
--   • resolved/dropped/deferred rows never block a legitimate reopen
--   • the same title reused after a previous issue is resolved is allowed
--
-- IMPORTANT: run supabase/manual/dedupe-team-hub.sql BEFORE applying this
-- migration against a database that already has duplicates, otherwise the
-- CREATE INDEX calls will fail.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_issues_unique_open
  ON issues (
    lower(btrim(title)),
    COALESCE(submitter_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WHERE status = 'open';

CREATE UNIQUE INDEX IF NOT EXISTS idx_todos_unique_open
  ON todos (
    lower(btrim(description)),
    COALESCE(owner_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WHERE status = 'open';
