/*
  Phase 2.3: Finalize RBAC Role Mapping

  Updates RLS policies on hub_* tables to use admin-schema role hierarchy.
  Introduces helper RPC functions that bridge hub_role and admin-schema roles.

  Changes:
  1. Create helper RPC functions: is_hub_super_admin(), is_hub_group_admin(), current_user_can_manage_all()
  2. Update RLS policies on hub_* tables to use new functions
  3. Maintain backward compatibility during transition
  4. Enable role-based access for admin-schema-aware code
*/

-- ============================================================================
-- PART 1: Helper RPC Functions for Hub Tables
-- ============================================================================

-- Check if user is super_admin via hub_users OR platform_admin via admin-schema
CREATE OR REPLACE FUNCTION is_hub_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    -- Check admin-schema first (source of truth)
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id
    AND role_type = 'platform_admin'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  ) OR EXISTS (
    -- Fall back to hub_role for backward compatibility during transition
    SELECT 1 FROM hub_users
    WHERE auth_user_id = check_user_id
    AND hub_role = 'super_admin'
  );
$$;

-- Check if user is group_admin via hub_users OR org_admin via admin-schema
CREATE OR REPLACE FUNCTION is_hub_group_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    -- Check admin-schema first
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id
    AND role_type IN ('platform_admin', 'org_admin')
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  ) OR EXISTS (
    -- Fall back to hub_role for backward compatibility
    SELECT 1 FROM hub_users
    WHERE auth_user_id = check_user_id
    AND hub_role IN ('super_admin', 'group_admin')
  );
$$;

-- Check if current user can manage all hub resources (super_admin or platform_admin)
CREATE OR REPLACE FUNCTION current_user_can_manage_all()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT is_hub_super_admin(auth.uid());
$$;

-- ============================================================================
-- PART 2: Update Hub RLS Policies
-- ============================================================================

-- Drop existing policies on hub_properties
DROP POLICY IF EXISTS "Users can read properties in their groups" ON hub_properties;
DROP POLICY IF EXISTS "Super admins can manage all properties" ON hub_properties;

-- New policies for hub_properties
CREATE POLICY "Authenticated users can read allowed properties"
  ON hub_properties FOR SELECT TO authenticated
  USING (
    -- Super admins/platform admins can read all
    current_user_can_manage_all()
    OR
    -- Group admins can read all (for now, until org scoping)
    is_hub_group_admin(auth.uid())
    OR
    -- Members/viewers can read properties in their groups
    EXISTS (
      SELECT 1 FROM hub_group_properties hgp
      JOIN hub_user_group_access huga ON hgp.group_id = huga.group_id
      WHERE hgp.property_id = hub_properties.id
      AND huga.user_id = (SELECT id FROM hub_users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Super admins can create properties"
  ON hub_properties FOR INSERT TO authenticated
  WITH CHECK (current_user_can_manage_all());

CREATE POLICY "Super admins can update properties"
  ON hub_properties FOR UPDATE TO authenticated
  USING (current_user_can_manage_all())
  WITH CHECK (current_user_can_manage_all());

CREATE POLICY "Super admins can delete properties"
  ON hub_properties FOR DELETE TO authenticated
  USING (current_user_can_manage_all());

-- Drop existing policies on hub_groups
DROP POLICY IF EXISTS "Users can read their groups" ON hub_groups;
DROP POLICY IF EXISTS "Super admins can manage all groups" ON hub_groups;

-- New policies for hub_groups
CREATE POLICY "Authenticated users can read assigned groups"
  ON hub_groups FOR SELECT TO authenticated
  USING (
    -- Super admins/platform admins can read all
    current_user_can_manage_all()
    OR
    -- Group admins can read all
    is_hub_group_admin(auth.uid())
    OR
    -- Members/viewers can read their groups
    EXISTS (
      SELECT 1 FROM hub_user_group_access
      WHERE hub_user_group_access.group_id = hub_groups.id
      AND hub_user_group_access.user_id = (SELECT id FROM hub_users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Super admins can create groups"
  ON hub_groups FOR INSERT TO authenticated
  WITH CHECK (current_user_can_manage_all());

CREATE POLICY "Super admins can update groups"
  ON hub_groups FOR UPDATE TO authenticated
  USING (current_user_can_manage_all())
  WITH CHECK (current_user_can_manage_all());

CREATE POLICY "Super admins can delete groups"
  ON hub_groups FOR DELETE TO authenticated
  USING (current_user_can_manage_all());

-- ============================================================================
-- PART 3: Update Hub Activity Log Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can read their own activity" ON hub_activity_log;
DROP POLICY IF EXISTS "Super admins can read all activity" ON hub_activity_log;

CREATE POLICY "Authenticated users can read activity"
  ON hub_activity_log FOR SELECT TO authenticated
  USING (
    -- Super admins can read all
    current_user_can_manage_all()
    OR
    -- Others can read their own activity
    user_id = (SELECT id FROM hub_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can insert activity"
  ON hub_activity_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- PART 4: Logging and Notes
-- ============================================================================

-- Log the RLS policy update
INSERT INTO admin_audit_log (action_type, action_details, target_type)
VALUES (
  'rls_policy_migration',
  jsonb_build_object(
    'description', 'Updated hub_* RLS policies to use admin-schema role hierarchy',
    'affected_tables', ARRAY['hub_properties', 'hub_groups', 'hub_activity_log'],
    'helper_functions', ARRAY['is_hub_super_admin', 'is_hub_group_admin', 'current_user_can_manage_all']
  ),
  'system'
);

/*
  MIGRATION NOTES:

  CHANGES MADE:
  1. Created 3 helper RPC functions that check admin-schema FIRST, then fall back to hub_role
  2. Updated hub_properties, hub_groups, hub_activity_log RLS policies
  3. All policies now use unified access logic via helper functions

  BACKWARD COMPATIBILITY:
  - Old hub_role-based code continues to work (fallback in helper functions)
  - New admin-schema-based code works via primary path in helpers
  - During transition: both sources are checked (OR logic)
  - After all clients migrated: fallback can be removed

  ROLE HIERARCHY (UNIFIED):
  1. platform_admin (super_admin) — Full access to all hub resources
  2. org_admin (group_admin) — Full access to their orgs/groups (with future scoping)
  3. standard_user (member) — Access to assigned groups/properties only
  4. guest_viewer (viewer) — Read-only access to assigned groups/properties

  NEXT STEPS (Phase 3):
  1. Update fleet-dashboard API routes to use admin-schema role hierarchy
  2. Remove fallback to hub_role after all clients migrate
  3. Start Phase 3: Fleet-Dashboard Integration (UI components, pages)
*/
