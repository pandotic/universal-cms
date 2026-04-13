/*
  Phase 2.2: Hub-to-Admin-Schema Bridge Tables

  Links existing hub_* tables to the new admin-schema tables without data loss.
  Maintains backward compatibility while introducing admin-schema RBAC.

  Changes:
  1. Add organization_id FK to hub_groups (for org scoping)
  2. Add user_profile_id FK to hub_users (for linking to user_profiles)
  3. Create view hub_users_with_roles for backward compatibility
  4. Seed initial platform_admin and org_admin roles for existing super_admin and group_admin users
*/

-- ============================================================================
-- PART 1: Add Foreign Keys to Hub Tables
-- ============================================================================

-- Add organization_id to hub_groups (nullable, for platform-level and org-level groups)
ALTER TABLE hub_groups
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

COMMENT ON COLUMN hub_groups.organization_id IS 'Links group to an organization; NULL = platform-level group';

-- Add index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_hub_groups_organization_id ON hub_groups(organization_id);

-- Add user_profile_id to hub_users (for linking to user_profiles)
ALTER TABLE hub_users
ADD COLUMN IF NOT EXISTS user_profile_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE;

COMMENT ON COLUMN hub_users.user_profile_id IS 'Links to user_profiles from admin-schema';

CREATE INDEX IF NOT EXISTS idx_hub_users_profile_id ON hub_users(user_profile_id);

-- ============================================================================
-- PART 2: Create Backward-Compatibility Views
-- ============================================================================

-- View that joins hub_users with their roles from admin-schema
CREATE OR REPLACE VIEW hub_users_with_roles AS
SELECT
  hu.id,
  hu.auth_user_id,
  hu.hub_role,
  hu.last_active_at,
  hu.avatar_url,
  hu.created_at,
  hu.updated_at,
  hu.user_profile_id,
  -- Get highest platform role from admin-schema
  COALESCE(
    ur_platform.role_type,
    CASE hu.hub_role
      WHEN 'super_admin' THEN 'platform_admin'
      WHEN 'group_admin' THEN 'org_admin'
      WHEN 'member' THEN 'standard_user'
      WHEN 'viewer' THEN 'guest_viewer'
      ELSE 'standard_user'
    END
  ) as admin_role
FROM hub_users hu
LEFT JOIN user_roles ur_platform ON hu.auth_user_id = ur_platform.user_id
  AND ur_platform.role_type = 'platform_admin'
  AND ur_platform.organization_id IS NULL
  AND ur_platform.is_active = true;

COMMENT ON VIEW hub_users_with_roles IS 'Maps hub_users to admin-schema roles for backward compatibility';

-- ============================================================================
-- PART 3: Seed Initial Roles
-- ============================================================================

-- Grant platform_admin role to existing super_admin users
INSERT INTO user_roles (user_id, role_type, is_active, granted_at)
SELECT DISTINCT hu.auth_user_id, 'platform_admin', true, now()
FROM hub_users hu
WHERE hu.hub_role = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = hu.auth_user_id
    AND ur.role_type = 'platform_admin'
    AND ur.organization_id IS NULL
  )
ON CONFLICT (user_id, role_type, organization_id) DO NOTHING;

-- Grant org_admin role to existing group_admin users (platform-wide, no org scope yet)
INSERT INTO user_roles (user_id, role_type, is_active, granted_at)
SELECT DISTINCT hu.auth_user_id, 'org_admin', true, now()
FROM hub_users hu
WHERE hu.hub_role = 'group_admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = hu.auth_user_id
    AND ur.role_type = 'org_admin'
    AND ur.organization_id IS NULL
  )
ON CONFLICT (user_id, role_type, organization_id) DO NOTHING;

-- Grant standard_user role to existing member users
INSERT INTO user_roles (user_id, role_type, is_active, granted_at)
SELECT DISTINCT hu.auth_user_id, 'standard_user', true, now()
FROM hub_users hu
WHERE hu.hub_role = 'member'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = hu.auth_user_id
    AND ur.role_type = 'standard_user'
    AND ur.organization_id IS NULL
  )
ON CONFLICT (user_id, role_type, organization_id) DO NOTHING;

-- Grant guest_viewer role to existing viewer users
INSERT INTO user_roles (user_id, role_type, is_active, granted_at)
SELECT DISTINCT hu.auth_user_id, 'guest_viewer', true, now()
FROM hub_users hu
WHERE hu.hub_role = 'viewer'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = hu.auth_user_id
    AND ur.role_type = 'guest_viewer'
    AND ur.organization_id IS NULL
  )
ON CONFLICT (user_id, role_type, organization_id) DO NOTHING;

-- ============================================================================
-- PART 4: Update Admin Audit Log for Seeding
-- ============================================================================

-- Log the role migration for compliance
INSERT INTO admin_audit_log (action_type, action_details, target_type)
VALUES (
  'admin_role_migration',
  jsonb_build_object(
    'description', 'Migrated hub_users hub_role to admin-schema user_roles during Phase 2.2',
    'timestamp', now()
  ),
  'system'
);

-- ============================================================================
-- PART 5: Migration Notes
-- ============================================================================

/*
  BACKWARD COMPATIBILITY:
  - hub_users table remains unchanged (except for new optional columns)
  - Old queries using hub_users.hub_role continue to work
  - New code can use hub_users_with_roles view or admin-schema directly
  - RLS policies will be updated in Phase 2.3 to check both sources

  ROLE MAPPING:
  hub_role 'super_admin'  → admin-schema 'platform_admin'
  hub_role 'group_admin'  → admin-schema 'org_admin'
  hub_role 'member'       → admin-schema 'standard_user'
  hub_role 'viewer'       → admin-schema 'guest_viewer'

  NEXT STEPS (Phase 2.3):
  1. Update RLS policies on hub_* tables to use is_platform_admin() from admin-schema
  2. Create helper RPCs that check both sources during transition
  3. Update fleet-dashboard API routes to respect new role hierarchy
  4. Test backward compatibility with existing hub_* queries
*/
