-- Fix infinite-recursion in RLS policies that reference hub_users / hub_user_group_access
-- from within a policy on the same table.
--
-- Root cause: `hub_users_admin` (in 00102) has a USING clause of
--   EXISTS (SELECT 1 FROM hub_users u WHERE u.auth_user_id = auth.uid() AND u.hub_role = 'super_admin')
-- which PostgreSQL re-evaluates under RLS, hitting the same policy and raising
--   ERROR 42P17: infinite recursion detected in policy for relation "hub_users"
-- That aborts even trivial queries like
--   select hub_role from hub_users where auth_user_id = :uid
-- which is exactly what requireHubRole runs — producing the
-- "Failed to check hub user" 500 on /api/fleet/dashboard and /api/activity.
--
-- Fix: move the super_admin check into a SECURITY DEFINER function that
-- bypasses RLS, and rewrite the affected policies to use it. The equivalent
-- problem on hub_user_group_access is fixed the same way.

-- ─── Helper: super_admin check that bypasses RLS ──────────────────────────
-- Named distinctly from 00502's is_hub_super_admin() so this migration is
-- self-contained and safe to apply whether or not 00500/00502 ran.

CREATE OR REPLACE FUNCTION hub_auth_is_super_admin(check_auth_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM hub_users
    WHERE auth_user_id = check_auth_id
      AND hub_role = 'super_admin'
  );
$$;

-- Helper: is the current user a group_admin for a given group?
CREATE OR REPLACE FUNCTION hub_auth_is_group_admin(check_auth_id uuid, check_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM hub_user_group_access uga
    JOIN hub_users u ON u.id = uga.user_id
    WHERE uga.group_id = check_group_id
      AND u.auth_user_id = check_auth_id
      AND uga.role = 'group_admin'
  );
$$;

-- ─── hub_users: replace self-referential admin policy ─────────────────────

DROP POLICY IF EXISTS "hub_users_admin" ON hub_users;

CREATE POLICY "hub_users_admin" ON hub_users
  FOR ALL TO authenticated
  USING (hub_auth_is_super_admin(auth.uid()))
  WITH CHECK (hub_auth_is_super_admin(auth.uid()));

-- ─── hub_user_group_access: replace self-referential group_admin policy ───

DROP POLICY IF EXISTS "hub_group_access_admin" ON hub_user_group_access;
DROP POLICY IF EXISTS "hub_group_access_group_admin" ON hub_user_group_access;

CREATE POLICY "hub_group_access_admin" ON hub_user_group_access
  FOR ALL TO authenticated
  USING (hub_auth_is_super_admin(auth.uid()))
  WITH CHECK (hub_auth_is_super_admin(auth.uid()));

CREATE POLICY "hub_group_access_group_admin" ON hub_user_group_access
  FOR ALL TO authenticated
  USING (hub_auth_is_group_admin(auth.uid(), group_id))
  WITH CHECK (hub_auth_is_group_admin(auth.uid(), group_id));

-- ─── hub_group_properties: rewrite policies to use helpers ────────────────
-- These policies aren't self-referential, but they join hub_users, which means
-- they re-trigger hub_users RLS. Using the SECURITY DEFINER helpers keeps the
-- check out of user-visible RLS paths entirely.

DROP POLICY IF EXISTS "hub_group_properties_admin" ON hub_group_properties;
DROP POLICY IF EXISTS "hub_group_properties_group_admin" ON hub_group_properties;

CREATE POLICY "hub_group_properties_admin" ON hub_group_properties
  FOR ALL TO authenticated
  USING (hub_auth_is_super_admin(auth.uid()))
  WITH CHECK (hub_auth_is_super_admin(auth.uid()));

CREATE POLICY "hub_group_properties_group_admin" ON hub_group_properties
  FOR ALL TO authenticated
  USING (hub_auth_is_group_admin(auth.uid(), group_id))
  WITH CHECK (hub_auth_is_group_admin(auth.uid(), group_id));

-- ─── hub_groups: admin policy using helper (keeps read policy as-is) ──────

DROP POLICY IF EXISTS "hub_groups_admin" ON hub_groups;

CREATE POLICY "hub_groups_admin" ON hub_groups
  FOR ALL TO authenticated
  USING (hub_auth_is_super_admin(auth.uid()))
  WITH CHECK (hub_auth_is_super_admin(auth.uid()));

-- ─── hub_properties: admin write policy using helper ──────────────────────
-- 00100 defined hub_properties_write as FOR ALL with an inline EXISTS on
-- hub_users. Route it through the helper so the check is RLS-free.

DROP POLICY IF EXISTS "hub_properties_write" ON hub_properties;

CREATE POLICY "hub_properties_write" ON hub_properties
  FOR ALL TO authenticated
  USING (hub_auth_is_super_admin(auth.uid()))
  WITH CHECK (hub_auth_is_super_admin(auth.uid()));
