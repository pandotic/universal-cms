-- ============================================================
-- Pandotic Team Hub — Phase 3 Migration
-- Prep mode, issue ordering, Granola auto-fetch, metrics support
-- ============================================================

-- MEETING PREP (async pre-meeting priority voting)
CREATE TABLE meeting_prep (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  priority_vote INTEGER DEFAULT 0 CHECK (priority_vote >= 0 AND priority_vote <= 3),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id, issue_id)
);

CREATE INDEX idx_meeting_prep_meeting ON meeting_prep(meeting_id);

-- MEETING ISSUE ORDER (chair can reorder issues during IDS)
CREATE TABLE meeting_issue_order (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  sort_position INTEGER NOT NULL DEFAULT 0,
  UNIQUE(meeting_id, issue_id)
);

CREATE INDEX idx_meeting_issue_order ON meeting_issue_order(meeting_id, sort_position);

-- PREP READINESS TRACKING
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS prep_ready JSONB DEFAULT '[]'::jsonb;

-- GRANOLA MEETING LINK (direct linking by date or ID)
ALTER TABLE meeting_transcripts ADD COLUMN IF NOT EXISTS granola_url TEXT;

-- RLS
ALTER TABLE meeting_prep ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_issue_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON meeting_prep FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON meeting_issue_order FOR ALL TO authenticated USING (true);

-- REALTIME for prep
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_prep;

-- MEETING STATS VIEW (for sparklines)
CREATE VIEW meeting_stats AS
SELECT
  m.id AS meeting_id,
  m.meeting_date,
  m.rating,
  m.chair_id,
  (SELECT COUNT(*) FROM issues i WHERE i.resolved_in_meeting_id = m.id) AS issues_resolved,
  (SELECT COUNT(*) FROM todos t WHERE t.created_in_meeting_id = m.id) AS todos_created,
  (SELECT COUNT(*) FROM commitments c WHERE c.meeting_id = m.id) AS commitments_made
FROM meetings m
WHERE m.status = 'archived'
ORDER BY m.meeting_date DESC;
