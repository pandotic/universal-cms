-- Core CMS: profiles, roles, and authorization helpers
-- Defines the update_updated_at_column() trigger function reused by all later migrations.

-- =============================================================================
-- Reusable trigger function for auto-updating updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- profiles
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- user_roles
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'moderator')),
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- =============================================================================
-- has_role(): SECURITY DEFINER helper used in RLS policies throughout the CMS
-- =============================================================================
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- RLS: profiles
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_authenticated ON profiles;
CREATE POLICY profiles_select_authenticated
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS profiles_update_self ON profiles;
CREATE POLICY profiles_update_self
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR has_role('admin'))
  WITH CHECK (id = auth.uid() OR has_role('admin'));

DROP POLICY IF EXISTS profiles_insert_self ON profiles;
CREATE POLICY profiles_insert_self
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_delete_admin ON profiles;
CREATE POLICY profiles_delete_admin
  ON profiles FOR DELETE
  TO authenticated
  USING (has_role('admin'));

-- =============================================================================
-- RLS: user_roles
-- =============================================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_select_authenticated ON user_roles;
CREATE POLICY user_roles_select_authenticated
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS user_roles_insert_admin ON user_roles;
CREATE POLICY user_roles_insert_admin
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS user_roles_update_admin ON user_roles;
CREATE POLICY user_roles_update_admin
  ON user_roles FOR UPDATE
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS user_roles_delete_admin ON user_roles;
CREATE POLICY user_roles_delete_admin
  ON user_roles FOR DELETE
  TO authenticated
  USING (has_role('admin'));
