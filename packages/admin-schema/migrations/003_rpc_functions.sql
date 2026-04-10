/*
  Universal CMS — RPC Functions

  Functions:
    - is_platform_admin(user_id): Check if user has platform_admin role
    - get_user_highest_role(user_id): Return the user's highest active role
    - has_module_access(user_id, module_name): Check if user can access a module
    - bootstrap_first_admin(): Create the first platform admin (one-time setup)
*/

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
  -- Check user-level override first
  SELECT is_enabled INTO user_override
  FROM user_module_access
  WHERE user_id = check_user_id
  AND module_key = check_module_name
  AND (expires_at IS NULL OR expires_at > now());

  IF user_override IS NOT NULL THEN
    RETURN user_override;
  END IF;

  -- Check if module is globally enabled
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
