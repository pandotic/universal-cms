-- ============================================================================
-- Chunk 1 Ops — safe to run end-to-end against the Pandotic Hub project.
-- Every block is idempotent (IF NOT EXISTS / ON CONFLICT / guarded DO block).
--
-- Run locally with:
--   cd packages/fleet-dashboard
--   supabase db query --linked --file supabase/manual/chunk-1-ops.sql
-- ============================================================================

-- ─── 1. Founder auth_user_id backfill (unblocks /team-hub) ─────────────────
UPDATE public.users u
   SET auth_user_id = a.id
  FROM auth.users a
 WHERE LOWER(u.email) = LOWER(a.email)
   AND u.auth_user_id IS NULL;


-- ─── 2. Team Hub agenda seed (populates /team-hub on first load) ───────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM issues WHERE source = 'manual') THEN
    INSERT INTO issues (title, submitter_id, priority, source) VALUES
      ('ClickUp vs. building our own PM tool',     (SELECT id FROM users WHERE name = 'Matt'),  'urgent',  'manual'),
      ('Playbook pricing model',                    (SELECT id FROM users WHERE name = 'Scott'), 'discuss', 'manual'),
      ('Education vertical strategy — who leads?',  (SELECT id FROM users WHERE name = 'Allen'), 'discuss', 'manual'),
      ('ASU GSV conference — who is attending?',    (SELECT id FROM users WHERE name = 'Scott'), 'fyi',     'manual');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM todos WHERE source = 'manual') THEN
    INSERT INTO todos (description, owner_id, due_date, source) VALUES
      ('Review and sign Gaia agreement',            (SELECT id FROM users WHERE name = 'Matt'),  CURRENT_DATE - 7, 'manual'),
      ('CJ/McLeod pricing research for Playbook',   (SELECT id FROM users WHERE name = 'Scott'), CURRENT_DATE - 7, 'manual'),
      ('Demo Playbook update to team',              (SELECT id FROM users WHERE name = 'Allen'), CURRENT_DATE - 7, 'manual'),
      ('Prepare Burning Man initial demo',          (SELECT id FROM users WHERE name = 'Dan'),   CURRENT_DATE + 7, 'manual'),
      ('Submit SCE proposal final',                 (SELECT id FROM users WHERE name = 'Matt'),  CURRENT_DATE + 7, 'manual');
  END IF;
END $$;


-- ─── 3. feature_flags table (unblocks /feature-flags) ──────────────────────
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key            text NOT NULL UNIQUE,
  flag_name           text NOT NULL,
  description         text,
  is_enabled          boolean NOT NULL DEFAULT false,
  rollout_percentage  integer NOT NULL DEFAULT 0
                        CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_roles        text[],
  target_org_ids      uuid[],
  target_user_ids     uuid[],
  metadata            jsonb DEFAULT '{}'::jsonb,
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key     ON public.feature_flags(flag_key);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_flags_read  ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_write ON public.feature_flags;

CREATE POLICY feature_flags_read  ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY feature_flags_write ON public.feature_flags
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM hub_users
     WHERE hub_users.auth_user_id = auth.uid()
       AND hub_users.hub_role = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM hub_users
     WHERE hub_users.auth_user_id = auth.uid()
       AND hub_users.hub_role = 'super_admin'
  ));


-- ─── Verification ──────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM public.users   WHERE auth_user_id IS NOT NULL) AS linked_founders,
  (SELECT COUNT(*) FROM public.issues  WHERE source = 'manual')        AS seed_issues,
  (SELECT COUNT(*) FROM public.todos   WHERE source = 'manual')        AS seed_todos,
  (to_regclass('public.feature_flags') IS NOT NULL)                    AS feature_flags_exists;
