-- Tracking & Webmaster verification settings
-- Adds webmaster_verification setting for search console verification meta tags.
-- The analytics_providers setting already exists (seeded in 00006).

INSERT INTO site_settings (key, value, group_name) VALUES
  ('webmaster_verification', '{"google": "", "bing": "", "yandex": ""}'::jsonb, 'integrations')
ON CONFLICT (key) DO NOTHING;
