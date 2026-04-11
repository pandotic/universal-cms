-- Hub Users — platform-level user accounts with roles
-- Separate from per-site profiles; maps auth.users to hub roles

CREATE TABLE IF NOT EXISTS hub_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  email text NOT NULL,
  hub_role text NOT NULL DEFAULT 'viewer'
    CHECK (hub_role IN ('super_admin', 'group_admin', 'member', 'viewer')),
  avatar_url text,
  last_active_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_hub_users_auth ON hub_users(auth_user_id);

-- Group access table — schema ready for Phase 2 (groups)
-- References hub_groups which will be created in 00101_hub_groups.sql
-- For now, create without the FK constraint; Phase 2 migration will add it
CREATE TABLE IF NOT EXISTS hub_user_group_access (
  user_id uuid NOT NULL REFERENCES hub_users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('group_admin', 'member', 'viewer')),
  granted_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES hub_users(id),
  PRIMARY KEY (user_id, group_id)
);

-- RLS
ALTER TABLE hub_users ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read user list
CREATE POLICY "hub_users_read" ON hub_users
  FOR SELECT TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "hub_users_update_self" ON hub_users
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Super admins can manage all users
CREATE POLICY "hub_users_admin" ON hub_users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users u
      WHERE u.auth_user_id = auth.uid()
        AND u.hub_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users u
      WHERE u.auth_user_id = auth.uid()
        AND u.hub_role = 'super_admin'
    )
  );

-- Allow insert for new users (self-registration on first login)
CREATE POLICY "hub_users_insert_self" ON hub_users
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

ALTER TABLE hub_user_group_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_group_access_read" ON hub_user_group_access
  FOR SELECT TO authenticated
  USING (true);
