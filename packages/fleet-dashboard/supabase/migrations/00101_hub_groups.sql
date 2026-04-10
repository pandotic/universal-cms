-- Hub Groups — organize properties into portfolios with scoped access
-- Groups can represent client portfolios, internal teams, or custom collections

CREATE TABLE IF NOT EXISTS hub_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  group_type text NOT NULL DEFAULT 'custom'
    CHECK (group_type IN ('client', 'internal', 'custom')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_hub_groups_type ON hub_groups(group_type);
CREATE INDEX idx_hub_groups_slug ON hub_groups(slug);

-- Junction table: which properties belong to which groups
CREATE TABLE IF NOT EXISTS hub_group_properties (
  group_id uuid NOT NULL REFERENCES hub_groups(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES hub_users(id),
  PRIMARY KEY (group_id, property_id)
);

CREATE INDEX idx_hub_group_properties_property ON hub_group_properties(property_id);

-- Now add the FK constraint to hub_user_group_access that was deferred in 00102
-- (the table already exists from 00102_hub_users.sql, just missing the FK)
ALTER TABLE hub_user_group_access
  ADD CONSTRAINT fk_hub_user_group_access_group
  FOREIGN KEY (group_id) REFERENCES hub_groups(id) ON DELETE CASCADE;

-- ─── RLS for hub_groups ────────────────────────────────────────────────────

ALTER TABLE hub_groups ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything with groups
CREATE POLICY "hub_groups_admin" ON hub_groups
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role = 'super_admin'
    )
  );

-- Authenticated users can read groups they have access to (or all if super_admin)
CREATE POLICY "hub_groups_read" ON hub_groups
  FOR SELECT TO authenticated
  USING (
    -- Super admins see all (handled by hub_groups_admin above)
    -- Group members see their groups
    EXISTS (
      SELECT 1 FROM hub_user_group_access uga
      WHERE uga.group_id = hub_groups.id
        AND uga.user_id = (
          SELECT id FROM hub_users WHERE auth_user_id = auth.uid()
        )
    )
  );

-- ─── RLS for hub_group_properties ──────────────────────────────────────────

ALTER TABLE hub_group_properties ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all group-property assignments
CREATE POLICY "hub_group_properties_admin" ON hub_group_properties
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role = 'super_admin'
    )
  );

-- Group admins can manage assignments for their groups
CREATE POLICY "hub_group_properties_group_admin" ON hub_group_properties
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_user_group_access uga
      JOIN hub_users u ON u.id = uga.user_id
      WHERE uga.group_id = hub_group_properties.group_id
        AND u.auth_user_id = auth.uid()
        AND uga.role = 'group_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_user_group_access uga
      JOIN hub_users u ON u.id = uga.user_id
      WHERE uga.group_id = hub_group_properties.group_id
        AND u.auth_user_id = auth.uid()
        AND uga.role = 'group_admin'
    )
  );

-- All authenticated users can see group-property mappings for groups they belong to
CREATE POLICY "hub_group_properties_read" ON hub_group_properties
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_user_group_access uga
      JOIN hub_users u ON u.id = uga.user_id
      WHERE uga.group_id = hub_group_properties.group_id
        AND u.auth_user_id = auth.uid()
    )
  );

-- ─── Refine hub_user_group_access RLS ──────────────────────────────────────

-- Super admins can manage all group access
CREATE POLICY "hub_group_access_admin" ON hub_user_group_access
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role = 'super_admin'
    )
  );

-- Group admins can manage access for their groups
CREATE POLICY "hub_group_access_group_admin" ON hub_user_group_access
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_user_group_access uga
      JOIN hub_users u ON u.id = uga.user_id
      WHERE uga.group_id = hub_user_group_access.group_id
        AND u.auth_user_id = auth.uid()
        AND uga.role = 'group_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_user_group_access uga
      JOIN hub_users u ON u.id = uga.user_id
      WHERE uga.group_id = hub_user_group_access.group_id
        AND u.auth_user_id = auth.uid()
        AND uga.role = 'group_admin'
    )
  );
