-- Add display_options JSONB column to content_pages for per-page UI feature toggles
ALTER TABLE content_pages
  ADD COLUMN IF NOT EXISTS display_options JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN content_pages.display_options IS
  'Per-page UI feature toggles. Keys: show_progress_bar, show_tldr, tldr_points, show_toc, show_section_backgrounds';
