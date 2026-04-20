-- ============================================================
-- Pandotic Team Hub — Phase 2 Migration
-- Notes, Transcripts, Commitments, Timer, Accountability
-- ============================================================

-- NOTES (fixes the "Just a note" dead end)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  meeting_id UUID REFERENCES meetings(id),
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_meeting ON notes(meeting_id);

-- ISSUE DISCUSSION NOTES (capture what was said per issue)
CREATE TABLE IF NOT EXISTS issue_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id),
  note TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'transcript')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_discussions_issue ON issue_discussions(issue_id);

-- MEETING TRANSCRIPTS (linked to Granola)
CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE UNIQUE,
  granola_meeting_id TEXT,
  transcript_text TEXT,
  ai_summary TEXT,
  ai_extracted_todos JSONB DEFAULT '[]',
  ai_extracted_decisions JSONB DEFAULT '[]',
  ai_extracted_commitments JSONB DEFAULT '[]',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACCOUNTABILITY TRACKING (commitments extracted from transcripts)
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id),
  owner_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  source_quote TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'broken', 'carried')),
  due_description TEXT,
  related_todo_id UUID REFERENCES todos(id),
  reviewed_in_meeting_id UUID REFERENCES meetings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commitments_meeting ON commitments(meeting_id);
CREATE INDEX IF NOT EXISTS idx_commitments_owner ON commitments(owner_id);

-- MEETING TIMER STATE (synced via Realtime)
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS current_section INTEGER DEFAULT 0;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS section_started_at TIMESTAMPTZ;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS timer_paused BOOLEAN DEFAULT false;

-- TODO CARRY-FORWARD TRACKING
ALTER TABLE todos ADD COLUMN IF NOT EXISTS carry_count INTEGER DEFAULT 0;

-- RLS for new tables
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON notes FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON issue_discussions FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON meeting_transcripts FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON commitments FOR ALL TO authenticated USING (true);

-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE standing_items;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE commitments;

-- ACCOUNTABILITY VIEW
CREATE OR REPLACE VIEW weekly_user_stats AS
SELECT
  u.id AS user_id,
  u.name,
  u.short_name,
  u.color,
  COUNT(t.id) FILTER (WHERE t.status = 'done' AND t.completed_at >= NOW() - INTERVAL '7 days') AS todos_completed_this_week,
  COUNT(t.id) FILTER (WHERE t.status = 'open' AND t.due_date < CURRENT_DATE) AS todos_overdue,
  COUNT(t.id) FILTER (WHERE t.status = 'open') AS todos_open,
  ROUND(
    100.0 * COUNT(t.id) FILTER (WHERE t.status = 'done' AND t.completed_at >= NOW() - INTERVAL '30 days')
    / NULLIF(COUNT(t.id) FILTER (WHERE t.created_at >= NOW() - INTERVAL '30 days'), 0)
  , 0) AS completion_rate_30d,
  COUNT(t.id) FILTER (WHERE t.carry_count > 0 AND t.status = 'open') AS chronic_carry_forwards,
  COUNT(c.id) FILTER (WHERE c.status = 'pending') AS pending_commitments,
  COUNT(c.id) FILTER (WHERE c.status = 'broken') AS broken_commitments
FROM users u
LEFT JOIN todos t ON t.owner_id = u.id
LEFT JOIN commitments c ON c.owner_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.name, u.short_name, u.color;
