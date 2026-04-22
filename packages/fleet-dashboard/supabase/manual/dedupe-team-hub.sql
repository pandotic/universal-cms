-- ============================================================
-- Pandotic Team Hub — Dedupe issues & todos
-- ============================================================
-- Removes duplicate rows from the `issues` and `todos` tables.
-- Deduping rule:
--   - Issues:  same (lower(trim(title)), submitter_id) → keep oldest
--   - To-dos:  same (lower(trim(description)), owner_id) → keep oldest
-- Only runs against rows still in `open` status — already-resolved /
-- deferred / dropped issues are left alone in case the same title was
-- legitimately reopened later.
--
-- Most dependents CASCADE (issue_discussions, meeting_issue_order,
-- meeting_prep) so Postgres cleans them up automatically. The two that
-- don't cascade are NULLed out first:
--   - todos.related_issue_id       (NULL on delete of dropped issue)
--   - commitments.related_todo_id  (NULL on delete of dropped to-do)
--
-- Safe to re-run. Wrap in a transaction so a partial failure rolls back.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. ISSUES — dedupe
-- ------------------------------------------------------------
CREATE TEMP TABLE _dup_issues ON COMMIT DROP AS
SELECT id
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim(title)), COALESCE(submitter_id::text, '')
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM issues
  WHERE status = 'open'
) s
WHERE rn > 1;

-- Unhook non-cascading dependents.
UPDATE todos SET related_issue_id = NULL
 WHERE related_issue_id IN (SELECT id FROM _dup_issues);

-- Drop the duplicates. ON DELETE CASCADE handles issue_discussions,
-- meeting_issue_order, meeting_prep.
DELETE FROM issues WHERE id IN (SELECT id FROM _dup_issues);

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM _dup_issues;
  RAISE NOTICE 'Removed % duplicate issue(s)', n;
END $$;

-- ------------------------------------------------------------
-- 2. TODOS — dedupe
-- ------------------------------------------------------------
CREATE TEMP TABLE _dup_todos ON COMMIT DROP AS
SELECT id
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim(description)), COALESCE(owner_id::text, '')
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM todos
  WHERE status = 'open'
) s
WHERE rn > 1;

UPDATE commitments SET related_todo_id = NULL
 WHERE related_todo_id IN (SELECT id FROM _dup_todos);

DELETE FROM todos WHERE id IN (SELECT id FROM _dup_todos);

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM _dup_todos;
  RAISE NOTICE 'Removed % duplicate to-do(s)', n;
END $$;

COMMIT;

-- ============================================================
-- Run me in the Supabase SQL editor (Hub project rimbgolutrxpmwsoswhq).
-- Afterwards, verify:
--   SELECT count(*) FROM issues WHERE status = 'open';
--   SELECT count(*) FROM todos  WHERE status = 'open';
-- ============================================================
