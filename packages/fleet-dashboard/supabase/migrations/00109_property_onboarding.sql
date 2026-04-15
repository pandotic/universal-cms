-- 00109_property_onboarding.sql
-- Extend hub_properties for project onboarding: platform type, GitHub repo,
-- Netlify integration, and onboarding status tracking.

ALTER TABLE hub_properties
  ADD COLUMN IF NOT EXISTS platform_type text NOT NULL DEFAULT 'nextjs_supabase'
    CHECK (platform_type IN (
      'nextjs_supabase', 'wordpress', 'static', 'mindpal', 'external', 'other'
    )),
  ADD COLUMN IF NOT EXISTS github_repo text,
  ADD COLUMN IF NOT EXISTS github_default_branch text NOT NULL DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS netlify_site_id text,
  ADD COLUMN IF NOT EXISTS cms_installed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'complete'
    CHECK (onboarding_status IN ('pending', 'connecting', 'configuring', 'complete'));
