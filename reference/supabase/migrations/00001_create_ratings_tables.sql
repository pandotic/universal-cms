-- platforms: one row per entity we track ratings for
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sub_category TEXT,
  vertical TEXT NOT NULL DEFAULT 'esg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_platforms_slug ON platforms (slug);
CREATE INDEX idx_platforms_vertical ON platforms (vertical);

-- review_sources: which review platforms we track for each entity
CREATE TYPE review_source_name AS ENUM (
  'capterra', 'g2', 'getapp', 'software-advice',
  'trustpilot', 'apple-app-store', 'google-play-store',
  'gartner-peer-insights'
);

CREATE TABLE review_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  source_name review_source_name NOT NULL,
  source_url TEXT,
  search_query_footprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform_id, source_name)
);

-- rating_history_logs: append-only snapshots
CREATE TABLE rating_history_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  source_name review_source_name NOT NULL,
  average_score NUMERIC(3,2) CHECK (average_score >= 0 AND average_score <= 5),
  review_count INTEGER CHECK (review_count >= 0),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quarter_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rating_history_platform ON rating_history_logs (platform_id);
CREATE INDEX idx_rating_history_quarter ON rating_history_logs (quarter_label);
CREATE INDEX idx_rating_history_snapshot ON rating_history_logs (platform_id, source_name, snapshot_date DESC);
