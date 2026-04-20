-- ============================================================
-- Pandotic Team Hub — Auth linkage + tightened RLS
-- ============================================================
-- Team Hub now lives inside the Pandotic Hub Next.js app and shares
-- its Supabase auth session. This migration:
--   1. Links auth.users <-> public.users via auth_user_id.
--   2. On Hub sign-up: if the email matches a seeded team-hub row,
--      link it. If the email is @pandotic.com, create a new team-hub
--      row. Otherwise, leave the sign-up alone (the non-founder Hub
--      user simply won't have a team-hub membership; the /team-hub
--      layout shows an access-denied panel).
--   3. Replaces blanket authenticated_all RLS with identity-aware
--      policies (you can only insert rows tagged with your own id).
--   4. Adds completed_by to todos so we know who checked it off.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Schema additions
-- ------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES users(id);

-- ------------------------------------------------------------
-- 2. Helper: resolve auth.uid() -> public.users.id
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ------------------------------------------------------------
-- 3. Sign-up trigger: @pandotic.com only, link or create users row
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email       TEXT := LOWER(NEW.email);
  v_local       TEXT;
  v_existing_id UUID;
BEGIN
  -- Case 1: email matches a seeded team-hub row -> link it.
  SELECT id INTO v_existing_id
  FROM public.users
  WHERE LOWER(email) = v_email
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.users
       SET auth_user_id = NEW.id
     WHERE id = v_existing_id
       AND auth_user_id IS DISTINCT FROM NEW.id;
    RETURN NEW;
  END IF;

  -- Case 2: no existing row, but the domain is @pandotic.com -> create one.
  IF v_email LIKE '%@pandotic.com' THEN
    v_local := split_part(v_email, '@', 1);
    INSERT INTO public.users (name, email, short_name, color, auth_user_id)
    VALUES (
      INITCAP(v_local),
      v_email,
      UPPER(LEFT(v_local, 1)),
      '#' || LPAD(TO_HEX(((random() * 16777215)::INT)), 6, '0'),
      NEW.id
    );
    RETURN NEW;
  END IF;

  -- Case 3: non-pandotic, non-seeded user. Allow the Hub sign-up to
  -- proceed without giving them team-hub membership. The /team-hub
  -- layout handles the access-denied UI client-side.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------------------------
-- 4. RLS — replace blanket policies with identity-aware ones
-- ------------------------------------------------------------
-- Read: any authenticated user can read everything (shared agenda).
-- Insert: the identity-bearing column must resolve to the caller.
-- Update / delete: any authenticated user (so Matt can check off
--                  Scott's todo; the client writes completed_by).

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read"               ON users;
CREATE POLICY "users_read"                       ON users
  FOR SELECT TO authenticated USING (true);
-- No client-side writes to users; trigger handles it as definer.

DROP POLICY IF EXISTS "authenticated_all"        ON issues;
DROP POLICY IF EXISTS "issues_read"              ON issues;
DROP POLICY IF EXISTS "issues_insert"            ON issues;
DROP POLICY IF EXISTS "issues_update"            ON issues;
DROP POLICY IF EXISTS "issues_delete"            ON issues;
CREATE POLICY "issues_read"                      ON issues
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "issues_insert"                    ON issues
  FOR INSERT TO authenticated
  WITH CHECK (submitter_id IS NULL OR submitter_id = current_user_id());
CREATE POLICY "issues_update"                    ON issues
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "issues_delete"                    ON issues
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_all"        ON todos;
DROP POLICY IF EXISTS "todos_read"               ON todos;
DROP POLICY IF EXISTS "todos_insert"             ON todos;
DROP POLICY IF EXISTS "todos_update"             ON todos;
DROP POLICY IF EXISTS "todos_delete"             ON todos;
CREATE POLICY "todos_read"                       ON todos
  FOR SELECT TO authenticated USING (true);
-- owner_id may be any team member (dumps let you assign to someone else);
-- we trust the client to set it. completed_by is enforced client-side too.
CREATE POLICY "todos_insert"                     ON todos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "todos_update"                     ON todos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "todos_delete"                     ON todos
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_all"        ON meetings;
DROP POLICY IF EXISTS "meetings_all"             ON meetings;
CREATE POLICY "meetings_all"                     ON meetings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all"        ON standing_items;
DROP POLICY IF EXISTS "standing_items_all"       ON standing_items;
CREATE POLICY "standing_items_all"               ON standing_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Phase 2 tables
DROP POLICY IF EXISTS "authenticated_all"        ON notes;
DROP POLICY IF EXISTS "notes_read"               ON notes;
DROP POLICY IF EXISTS "notes_insert"             ON notes;
DROP POLICY IF EXISTS "notes_update"             ON notes;
DROP POLICY IF EXISTS "notes_delete"             ON notes;
CREATE POLICY "notes_read"                       ON notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "notes_insert"                     ON notes
  FOR INSERT TO authenticated
  WITH CHECK (created_by IS NULL OR created_by = current_user_id());
CREATE POLICY "notes_update"                     ON notes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "notes_delete"                     ON notes
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_all"        ON issue_discussions;
DROP POLICY IF EXISTS "issue_discussions_read"   ON issue_discussions;
DROP POLICY IF EXISTS "issue_discussions_insert" ON issue_discussions;
DROP POLICY IF EXISTS "issue_discussions_update" ON issue_discussions;
DROP POLICY IF EXISTS "issue_discussions_delete" ON issue_discussions;
CREATE POLICY "issue_discussions_read"           ON issue_discussions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "issue_discussions_insert"         ON issue_discussions
  FOR INSERT TO authenticated
  WITH CHECK (created_by IS NULL OR created_by = current_user_id());
CREATE POLICY "issue_discussions_update"         ON issue_discussions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "issue_discussions_delete"         ON issue_discussions
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_all"        ON meeting_transcripts;
DROP POLICY IF EXISTS "meeting_transcripts_all"  ON meeting_transcripts;
CREATE POLICY "meeting_transcripts_all"          ON meeting_transcripts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all"        ON commitments;
DROP POLICY IF EXISTS "commitments_all"          ON commitments;
CREATE POLICY "commitments_all"                  ON commitments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Phase 3 tables
DROP POLICY IF EXISTS "authenticated_all"        ON meeting_prep;
DROP POLICY IF EXISTS "meeting_prep_all"         ON meeting_prep;
CREATE POLICY "meeting_prep_all"                 ON meeting_prep
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all"        ON meeting_issue_order;
DROP POLICY IF EXISTS "meeting_issue_order_all"  ON meeting_issue_order;
CREATE POLICY "meeting_issue_order_all"          ON meeting_issue_order
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- command_center_flags keeps its read-only policy from 00001_initial.sql.

-- ------------------------------------------------------------
-- 5. Rebuild views that reference updated tables (safe no-op if
--    columns match; ensures active_todos surfaces completed_by).
-- ------------------------------------------------------------
DROP VIEW IF EXISTS active_todos;
CREATE VIEW active_todos AS
SELECT
  t.*,
  u.name       AS owner_name,
  u.short_name AS owner_short,
  u.color      AS owner_color,
  CASE
    WHEN t.due_date < CURRENT_DATE AND t.status = 'open' THEN true
    ELSE false
  END AS is_overdue
FROM todos t
LEFT JOIN users u ON t.owner_id = u.id
WHERE t.status = 'open'
ORDER BY t.due_date ASC NULLS LAST;
