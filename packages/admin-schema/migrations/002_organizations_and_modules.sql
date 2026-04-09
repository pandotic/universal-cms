/*
  Universal CMS — Organizations, Modules, and Admin Infrastructure

  Tables:
    - organizations: B2B organization accounts with tiers and branding
    - organization_members: Org membership with roles
    - platform_modules: Global module registry
    - module_access_control: Per-org module enablement
    - user_module_access: Per-user module overrides
    - module_settings: Per-module configuration
    - admin_settings: Platform-wide admin settings
    - admin_audit_log: Admin action audit trail
    - system_health_metrics: System health monitoring
    - admin_alerts: Alert/notification system for admins
*/

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

-- Enable RLS on all tables
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
