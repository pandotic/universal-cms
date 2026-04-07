-- Theme customization settings
INSERT INTO site_settings (key, value, group_name) VALUES
  ('theme_mode', '"system"'::jsonb, 'appearance'),
  ('theme_overrides', '{}'::jsonb, 'appearance'),
  ('custom_css', '""'::jsonb, 'appearance'),
  ('custom_css_urls', '[]'::jsonb, 'appearance')
ON CONFLICT (key) DO NOTHING;
