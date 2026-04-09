/*
  Universal CMS — Seed: Default Admin Settings

  Core role types (apps can extend with additional roles):
    - platform_admin: Full platform control
    - org_admin: Organization-level management
    - entity_admin: Entity-level management (e.g., home admin, project admin)
    - standard_user: Default authenticated user
    - guest_viewer: Read-only guest access

  Core admin settings:
    - maintenance_mode, max_users, default_role
*/

-- Default admin settings
INSERT INTO admin_settings (setting_category, setting_key, setting_value, setting_type, display_name, description, is_public, is_editable)
VALUES
  ('SYSTEM', 'maintenance_mode', 'false', 'boolean', 'Maintenance Mode', 'When enabled, non-admin users see a maintenance page', false, true),
  ('SYSTEM', 'app_name', '"Universal CMS"', 'string', 'Application Name', 'Display name of the application', true, true),
  ('SYSTEM', 'max_users', '0', 'number', 'Max Users', 'Maximum number of users (0 = unlimited)', false, true),
  ('SECURITY', 'session_timeout_minutes', '1440', 'number', 'Session Timeout', 'Admin session timeout in minutes', false, true),
  ('SECURITY', 'default_role', '"standard_user"', 'string', 'Default Role', 'Role assigned to new users', false, true)
ON CONFLICT (setting_category, setting_key) DO NOTHING;
