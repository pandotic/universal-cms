-- Video content generation tables for HeyGen integration
-- Tracks generated videos, their status, and generation history

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('glossary', 'framework', 'category', 'entity', 'comparison', 'esg101')),
  content_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  script TEXT,
  heygen_video_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'generating', 'processing', 'completed', 'failed', 'approved', 'rejected')),
  video_url TEXT,
  thumbnail_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1')),
  avatar_id TEXT,
  voice_id TEXT,
  generation_mode TEXT CHECK (generation_mode IN ('template', 'agent')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  youtube_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  UNIQUE (content_type, content_slug, aspect_ratio)
);

CREATE INDEX idx_videos_status ON videos (status);
CREATE INDEX idx_videos_content_type ON videos (content_type);
CREATE INDEX idx_videos_content_lookup ON videos (content_type, content_slug);

-- Audit trail for video generation events
CREATE TABLE IF NOT EXISTS video_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos (id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'submitted', 'polled', 'completed', 'failed', 'retried', 'approved', 'rejected')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_gen_log_video ON video_generation_log (video_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_videos_updated_at();

-- RLS policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generation_log ENABLE ROW LEVEL SECURITY;

-- Public can read approved videos
CREATE POLICY videos_public_read ON videos
  FOR SELECT USING (status = 'approved');

-- Admins can do everything
CREATE POLICY videos_admin_all ON videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY video_gen_log_admin_all ON video_generation_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
