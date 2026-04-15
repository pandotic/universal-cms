-- 00108_hub_fleet_dashboard.sql
-- Fleet Dashboard tables: package deployments, business fields on properties,
-- marketing services tracking.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. hub_package_deployments — track any npm package version per property
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE hub_package_deployments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  package_name          text NOT NULL,
  package_category      text NOT NULL DEFAULT 'cms'
                          CHECK (package_category IN ('cms', 'library', 'ui', 'tool')),
  installed_version     text,
  latest_version        text,
  pinned                boolean NOT NULL DEFAULT false,
  enabled_modules       text[] NOT NULL DEFAULT '{}',
  bespoke_modules       text[] NOT NULL DEFAULT '{}',
  preset                text,
  status                text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('active', 'pending', 'failed', 'not_installed')),
  github_repo           text,
  github_pr_url         text,
  deployed_by           uuid REFERENCES hub_users(id) ON DELETE SET NULL,
  deployed_at           timestamptz,
  last_health_check_at  timestamptz,
  health_check_data     jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (property_id, package_name)
);

CREATE INDEX idx_hub_pkg_dep_property   ON hub_package_deployments(property_id);
CREATE INDEX idx_hub_pkg_dep_status     ON hub_package_deployments(status);
CREATE INDEX idx_hub_pkg_dep_package    ON hub_package_deployments(package_name);
CREATE INDEX idx_hub_pkg_dep_category   ON hub_package_deployments(package_category);

ALTER TABLE hub_package_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read package deployments"
  ON hub_package_deployments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage package deployments"
  ON hub_package_deployments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role IN ('super_admin', 'group_admin')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. hub_package_deployment_events — deployment history / audit trail
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE hub_package_deployment_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id     uuid NOT NULL REFERENCES hub_package_deployments(id) ON DELETE CASCADE,
  property_id       uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  event_type        text NOT NULL
                      CHECK (event_type IN (
                        'installed', 'upgraded', 'modules_changed',
                        'health_check', 'failed', 'rolled_back'
                      )),
  from_version      text,
  to_version        text,
  modules_added     text[] NOT NULL DEFAULT '{}',
  modules_removed   text[] NOT NULL DEFAULT '{}',
  notes             text,
  metadata          jsonb NOT NULL DEFAULT '{}',
  triggered_by      uuid REFERENCES hub_users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hub_pkg_dep_events_dep   ON hub_package_deployment_events(deployment_id, created_at DESC);
CREATE INDEX idx_hub_pkg_dep_events_prop  ON hub_package_deployment_events(property_id, created_at DESC);

ALTER TABLE hub_package_deployment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read deployment events"
  ON hub_package_deployment_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert deployment events"
  ON hub_package_deployment_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Extend hub_properties with business fields
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE hub_properties
  ADD COLUMN IF NOT EXISTS business_category text,
  ADD COLUMN IF NOT EXISTS ownership_type    text NOT NULL DEFAULT 'personal'
    CHECK (ownership_type IN ('personal', 'pandotic', 'client')),
  ADD COLUMN IF NOT EXISTS client_name       text,
  ADD COLUMN IF NOT EXISTS business_stage    text NOT NULL DEFAULT 'active'
    CHECK (business_stage IN ('idea', 'development', 'active', 'maintenance', 'sunset')),
  ADD COLUMN IF NOT EXISTS domains           text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS domain_notes      text,
  ADD COLUMN IF NOT EXISTS llc_entity        text,
  ADD COLUMN IF NOT EXISTS business_notes    text;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. hub_marketing_services — marketing service assignments per property
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE hub_marketing_services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     uuid NOT NULL REFERENCES hub_properties(id) ON DELETE CASCADE,
  service_type    text NOT NULL
                    CHECK (service_type IN (
                      'seo', 'content', 'social', 'paid_ads',
                      'email', 'analytics', 'branding', 'pr'
                    )),
  status          text NOT NULL DEFAULT 'planned'
                    CHECK (status IN ('planned', 'active', 'paused', 'completed')),
  provider        text NOT NULL DEFAULT 'internal',
  notes           text,
  started_at      timestamptz,
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (property_id, service_type)
);

CREATE INDEX idx_hub_mktg_svc_property ON hub_marketing_services(property_id);
CREATE INDEX idx_hub_mktg_svc_status   ON hub_marketing_services(status);

ALTER TABLE hub_marketing_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read marketing services"
  ON hub_marketing_services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage marketing services"
  ON hub_marketing_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role IN ('super_admin', 'group_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_users
      WHERE hub_users.auth_user_id = auth.uid()
        AND hub_users.hub_role IN ('super_admin', 'group_admin')
    )
  );
