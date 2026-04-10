/*
  Universal CMS — RLS Policies for Organization and Admin Tables
*/

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
