-- Link checker results
CREATE TABLE IF NOT EXISTS link_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,       -- path of the page containing the link
  target_url TEXT NOT NULL,       -- href of the link
  anchor_text TEXT,
  status_code INTEGER,
  is_internal BOOLEAN NOT NULL DEFAULT true,
  is_broken BOOLEAN NOT NULL DEFAULT false,
  redirect_target TEXT,           -- if 3xx, where it redirects to
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  first_broken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_url, target_url)
);

CREATE INDEX IF NOT EXISTS idx_link_checks_broken ON link_checks(is_broken) WHERE is_broken = true;
CREATE INDEX IF NOT EXISTS idx_link_checks_source ON link_checks(source_url);
CREATE INDEX IF NOT EXISTS idx_link_checks_target ON link_checks(target_url);

-- Redirect rules
CREATE TABLE IF NOT EXISTS redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT UNIQUE NOT NULL,  -- e.g. /old-page or regex pattern
  to_path TEXT NOT NULL,           -- e.g. /new-page
  redirect_type INTEGER NOT NULL DEFAULT 301 CHECK (redirect_type IN (301, 302, 307)),
  is_regex BOOLEAN NOT NULL DEFAULT false,
  hits INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redirects_from ON redirects(from_path) WHERE is_active = true;

-- 404 log
CREATE TABLE IF NOT EXISTS not_found_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(url)
);

CREATE INDEX IF NOT EXISTS idx_not_found_url ON not_found_log(url);
CREATE INDEX IF NOT EXISTS idx_not_found_count ON not_found_log(count DESC);

-- RLS
ALTER TABLE link_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE not_found_log ENABLE ROW LEVEL SECURITY;

-- link_checks: admin ALL only
DROP POLICY IF EXISTS link_checks_admin ON link_checks;
CREATE POLICY link_checks_admin ON link_checks FOR ALL TO authenticated
  USING (has_role('admin')) WITH CHECK (has_role('admin'));

-- redirects: public SELECT (needed for middleware), admin ALL
DROP POLICY IF EXISTS redirects_public_select ON redirects;
CREATE POLICY redirects_public_select ON redirects FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS redirects_admin ON redirects;
CREATE POLICY redirects_admin ON redirects FOR ALL TO authenticated
  USING (has_role('admin')) WITH CHECK (has_role('admin'));

-- not_found_log: public INSERT, admin ALL
DROP POLICY IF EXISTS not_found_log_insert ON not_found_log;
CREATE POLICY not_found_log_insert ON not_found_log FOR INSERT TO anon, authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS not_found_log_admin ON not_found_log;
CREATE POLICY not_found_log_admin ON not_found_log FOR ALL TO authenticated
  USING (has_role('admin')) WITH CHECK (has_role('admin'));
