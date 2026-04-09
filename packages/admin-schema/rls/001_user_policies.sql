/*
  Universal CMS — RLS Policies for User Tables
*/

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
