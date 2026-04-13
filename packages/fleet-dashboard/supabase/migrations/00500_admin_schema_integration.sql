/*
  Phase 2.1: Admin-Schema Integration

  Applies the complete admin-schema to the Hub Supabase project.
  This includes:
  - User profiles and role management
  - Organizations and module management
  - Feature flags, audit logging, and admin infrastructure
  - RLS policies for all tables
  - Seed data for default settings

  NOTE: This migration keeps existing hub_* tables for backward compatibility.
  Phase 2.2 will create links between hub_* and admin-schema tables.
*/

-- ============================================================================
-- PART 1: User Profiles and Roles (001_user_profiles_and_roles.sql)
-- ============================================================================

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  first_name text,
  last_name text,
  avatar_url text,
  phone text,
  timezone text DEFAULT 'America/Los_Angeles',
  locale text DEFAULT 'en-US',
  account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'deactivated')),
  onboarding_completed boolean DEFAULT false,
  onboarding_step integer DEFAULT 0,
  last_active_at timestamptz,
  preferences jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN user_profiles.account_status IS 'active = normal, suspended = admin-locked (reversible), deactivated = user-initiated closure';

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_type text NOT NULL DEFAULT 'standard_user',
  organization_id uuid,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_type, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_type ON user_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role_type);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(organization_id);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  setting_category text NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, setting_category, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT false,
  in_app_enabled boolean DEFAULT true,
  frequency text DEFAULT 'immediate',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Notifications inbox
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  category text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  action_url text,
  metadata jsonb DEFAULT '{}',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Onboarding checklist
CREATE TABLE IF NOT EXISTS onboarding_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_key text NOT NULL,
  task_name text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  sort_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_key)
);

-- Enable RLS for user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist ENABLE ROW LEVEL SECURITY;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 2: Organizations and Modules (002_organizations_and_modules.sql)
-- ============================================================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  organization_type text DEFAULT 'OTHER',
  description text,
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  website text,
  current_tier text DEFAULT 'free',
  is_active boolean DEFAULT true,
  white_label_enabled boolean DEFAULT false,
  branding_config jsonb DEFAULT '{}',
  powered_by_visible boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'MEMBER'
    CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
  is_primary_admin boolean DEFAULT false,
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Platform modules
CREATE TABLE IF NOT EXISTS platform_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text UNIQUE NOT NULL,
  module_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'CORE',
  icon text,
  is_enabled_globally boolean DEFAULT true,
  requires_subscription boolean DEFAULT false,
  subscription_tier text,
  dependencies text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Per-org module access
CREATE TABLE IF NOT EXISTS module_access_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  module_key text NOT NULL,
  is_enabled boolean DEFAULT true,
  show_in_top_nav boolean DEFAULT false,
  nav_display_order integer,
  nav_label text,
  configured_by uuid REFERENCES auth.users(id),
  configured_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, module_key)
);

-- Per-user module overrides
CREATE TABLE IF NOT EXISTS user_module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_key text NOT NULL,
  is_enabled boolean DEFAULT true,
  configured_by uuid REFERENCES auth.users(id),
  configured_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_key)
);

-- Module settings
CREATE TABLE IF NOT EXISTS module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb,
  setting_type text DEFAULT 'string',
  display_name text,
  description text,
  is_public boolean DEFAULT false,
  validation_rules jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(module_key, setting_key)
);

-- Admin settings (platform-wide)
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_category text NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb,
  setting_type text DEFAULT 'string',
  display_name text,
  description text,
  is_public boolean DEFAULT false,
  is_editable boolean DEFAULT true,
  validation_rules jsonb DEFAULT '{}',
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(setting_category, setting_key)
);

-- Audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}',
  before_state jsonb,
  after_state jsonb,
  target_type text,
  target_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_type, target_id);

-- System health metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric(15,4) NOT NULL,
  metric_unit text,
  status text DEFAULT 'UNKNOWN',
  threshold_warning numeric(15,4),
  threshold_critical numeric(15,4),
  recorded_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Admin alerts
CREATE TABLE IF NOT EXISTS admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  read_at timestamptz,
  dismissed_at timestamptz,
  dismissed_by uuid REFERENCES auth.users(id),
  action_url text,
  action_label text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_org_unread ON admin_alerts(organization_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity ON admin_alerts(severity, created_at DESC);

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  flag_name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_roles text[] DEFAULT '{}',
  target_org_ids uuid[] DEFAULT '{}',
  target_user_ids uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for org/module/admin tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_access_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: RPC Functions (003_rpc_functions.sql)
-- ============================================================================

-- Check if a user is a platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id
    AND role_type = 'platform_admin'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Get the highest role for a user
CREATE OR REPLACE FUNCTION get_user_highest_role(check_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role_type FROM user_roles
  WHERE user_id = check_user_id
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  ORDER BY
    CASE role_type
      WHEN 'platform_admin' THEN 1
      WHEN 'org_admin' THEN 2
      WHEN 'entity_admin' THEN 3
      WHEN 'standard_user' THEN 4
      WHEN 'guest_viewer' THEN 5
      ELSE 6
    END
  LIMIT 1;
$$;

-- Check if a user has access to a specific module
CREATE OR REPLACE FUNCTION has_module_access(check_user_id uuid, check_module_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_override boolean;
  module_enabled boolean;
BEGIN
  SELECT is_enabled INTO user_override
  FROM user_module_access
  WHERE user_id = check_user_id
  AND module_key = check_module_name
  AND (expires_at IS NULL OR expires_at > now());

  IF user_override IS NOT NULL THEN
    RETURN user_override;
  END IF;

  SELECT is_enabled_globally INTO module_enabled
  FROM platform_modules
  WHERE module_key = check_module_name;

  RETURN COALESCE(module_enabled, true);
END;
$$;

-- Bootstrap the first platform admin (only works when no admins exist)
CREATE OR REPLACE FUNCTION bootstrap_first_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  existing_admin_count int;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  SELECT COUNT(*) INTO existing_admin_count
  FROM user_roles
  WHERE role_type = 'platform_admin' AND is_active = true;

  IF existing_admin_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Platform admin already exists. Use admin panel to grant additional access.'
    );
  END IF;

  -- Ensure user profile exists
  INSERT INTO user_profiles (id, email, onboarding_completed)
  SELECT current_user_id, (SELECT email FROM auth.users WHERE id = current_user_id), true
  ON CONFLICT (id) DO UPDATE SET onboarding_completed = true;

  -- Grant platform_admin role
  INSERT INTO user_roles (user_id, role_type, granted_by, is_active)
  VALUES (current_user_id, 'platform_admin', current_user_id, true);

  -- Log the bootstrap action
  INSERT INTO admin_audit_log (admin_user_id, action_type, action_details, target_type)
  VALUES (
    current_user_id,
    'bootstrap_admin',
    jsonb_build_object('user_id', current_user_id),
    'system'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully bootstrapped as platform administrator',
    'user_id', current_user_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- ============================================================================
-- PART 4: RLS Policies (001_user_policies.sql)
-- ============================================================================

-- user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Platform admins can view all profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update all profiles"
  ON user_profiles FOR UPDATE TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- user_roles
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Platform admins can manage all roles"
  ON user_roles FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- notification_preferences
CREATE POLICY "Users can manage own notification prefs"
  ON notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- onboarding_checklist
CREATE POLICY "Users can manage own checklist"
  ON onboarding_checklist FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PART 5: RLS Policies (002_org_policies.sql)
-- ============================================================================

-- organizations
CREATE POLICY "Users can view active orgs or orgs they belong to"
  ON organizations FOR SELECT TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins can manage all orgs"
  ON organizations FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- organization_members
CREATE POLICY "Users can view members of their orgs"
  ON organization_members FOR SELECT TO authenticated
  USING (
    organization_members.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

CREATE POLICY "Org admins can manage members"
  ON organization_members FOR ALL TO authenticated
  USING (
    organization_members.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('OWNER', 'ADMIN')
      AND om.is_active = true
    )
  )
  WITH CHECK (
    organization_members.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('OWNER', 'ADMIN')
      AND om.is_active = true
    )
  );

CREATE POLICY "Platform admins can manage all org members"
  ON organization_members FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- platform_modules (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view modules"
  ON platform_modules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Platform admins can manage modules"
  ON platform_modules FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- module_access_control
CREATE POLICY "Org members can view their module access"
  ON module_access_control FOR SELECT TO authenticated
  USING (
    module_access_control.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );

CREATE POLICY "Platform admins can manage all module access"
  ON module_access_control FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- user_module_access
CREATE POLICY "Users can view own module access"
  ON user_module_access FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Platform admins can manage user module access"
  ON user_module_access FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- admin_settings (read for all, write for admins)
CREATE POLICY "Authenticated users can view public settings"
  ON admin_settings FOR SELECT TO authenticated
  USING (is_public = true OR is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage settings"
  ON admin_settings FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- admin_audit_log
CREATE POLICY "Platform admins can view audit logs"
  ON admin_audit_log FOR SELECT TO authenticated
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Authenticated users can insert audit logs"
  ON admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- system_health_metrics
CREATE POLICY "Platform admins can view health metrics"
  ON system_health_metrics FOR SELECT TO authenticated
  USING (is_platform_admin(auth.uid()));

-- admin_alerts
CREATE POLICY "Org members can view their alerts"
  ON admin_alerts FOR SELECT TO authenticated
  USING (
    admin_alerts.organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Platform admins can manage all alerts"
  ON admin_alerts FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- feature_flags
CREATE POLICY "Authenticated users can view enabled flags"
  ON feature_flags FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Platform admins can manage feature flags"
  ON feature_flags FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- module_settings
CREATE POLICY "Authenticated users can view module settings"
  ON module_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Platform admins can manage module settings"
  ON module_settings FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- ============================================================================
-- PART 6: Seed Data (001_default_roles.sql)
-- ============================================================================

INSERT INTO admin_settings (setting_category, setting_key, setting_value, setting_type, display_name, description, is_public, is_editable)
VALUES
  ('SYSTEM', 'maintenance_mode', 'false', 'boolean', 'Maintenance Mode', 'When enabled, non-admin users see a maintenance page', false, true),
  ('SYSTEM', 'app_name', '"Universal CMS"', 'string', 'Application Name', 'Display name of the application', true, true),
  ('SYSTEM', 'max_users', '0', 'number', 'Max Users', 'Maximum number of users (0 = unlimited)', false, true),
  ('SECURITY', 'session_timeout_minutes', '1440', 'number', 'Session Timeout', 'Admin session timeout in minutes', false, true),
  ('SECURITY', 'default_role', '"standard_user"', 'string', 'Default Role', 'Role assigned to new users', false, true)
ON CONFLICT (setting_category, setting_key) DO NOTHING;
