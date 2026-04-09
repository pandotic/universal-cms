-- ============================================================
-- Pandotic Team Hub — Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (name, email, short_name, color) VALUES
  ('Allen', 'allen@pandotic.com', 'A', '#7F77DD'),
  ('Matt', 'matt@pandotic.com', 'M', '#1D9E75'),
  ('Dan', 'dan@pandotic.com', 'D', '#D4537E'),
  ('Scott', 'scott@pandotic.com', 'S', '#BA7517');

-- ============================================================
-- ISSUES
-- ============================================================
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  submitter_id UUID REFERENCES users(id),
  priority TEXT NOT NULL DEFAULT 'discuss' CHECK (priority IN ('urgent', 'discuss', 'fyi')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'deferred', 'dropped')),
  resolution_note TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'dump', 'meeting')),
  raw_dump_text TEXT,
  ai_classified BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_in_meeting_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);

-- ============================================================
-- TO-DOS
-- ============================================================
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'dump', 'meeting', 'issue_resolution')),
  raw_dump_text TEXT,
  ai_classified BOOLEAN DEFAULT false,
  related_issue_id UUID REFERENCES issues(id),
  created_in_meeting_id UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_owner ON todos(owner_id);
CREATE INDEX idx_todos_due ON todos(due_date);

-- ============================================================
-- MEETINGS
-- ============================================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_date DATE NOT NULL UNIQUE,
  chair_id UUID REFERENCES users(id),
  next_chair_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'archived')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_date ON meetings(meeting_date DESC);

-- ============================================================
-- STANDING ITEMS (recurring company-health items)
-- ============================================================
CREATE TABLE standing_item_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

INSERT INTO standing_item_templates (name, sort_order) VALUES
  ('Health insurance', 1),
  ('D&O / general liability', 2),
  ('Legal updates (Archer settlement)', 3),
  ('Outstanding invoices / AR', 4),
  ('Payments received', 5),
  ('1099s / tax filing', 6),
  ('Corporate card / Mercury', 7);

CREATE TABLE standing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES standing_item_templates(id),
  status TEXT NOT NULL DEFAULT 'no_update' CHECK (status IN ('no_update', 'update', 'needs_discussion')),
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, template_id)
);

-- ============================================================
-- CHAIR ROTATION
-- ============================================================
CREATE TABLE chair_rotation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  rotation_order INTEGER NOT NULL UNIQUE
);

INSERT INTO chair_rotation (user_id, rotation_order) VALUES
  ((SELECT id FROM users WHERE name = 'Allen'), 1),
  ((SELECT id FROM users WHERE name = 'Matt'), 2),
  ((SELECT id FROM users WHERE name = 'Dan'), 3),
  ((SELECT id FROM users WHERE name = 'Scott'), 4);

-- ============================================================
-- COMMAND CENTER FLAGGED ITEMS (read-only snapshot)
-- ============================================================
CREATE TABLE command_center_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE,
  source_type TEXT,
  name TEXT NOT NULL,
  ryg_status TEXT CHECK (ryg_status IN ('green', 'yellow', 'red', 'gray')),
  reason TEXT,
  external_url TEXT,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cc_flags_snapshot ON command_center_flags(snapshot_date DESC);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_issues BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_todos BEFORE UPDATE ON todos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_meetings BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VIEWS
-- ============================================================
CREATE VIEW open_issues AS
SELECT
  i.*,
  u.name AS submitter_name,
  u.short_name AS submitter_short,
  u.color AS submitter_color
FROM issues i
LEFT JOIN users u ON i.submitter_id = u.id
WHERE i.status IN ('open', 'deferred')
ORDER BY
  CASE i.priority WHEN 'urgent' THEN 1 WHEN 'discuss' THEN 2 WHEN 'fyi' THEN 3 END,
  i.created_at ASC;

CREATE VIEW active_todos AS
SELECT
  t.*,
  u.name AS owner_name,
  u.short_name AS owner_short,
  u.color AS owner_color,
  CASE
    WHEN t.due_date < CURRENT_DATE AND t.status = 'open' THEN true
    ELSE false
  END AS is_overdue
FROM todos t
LEFT JOIN users u ON t.owner_id = u.id
WHERE t.status = 'open'
ORDER BY t.due_date ASC NULLS LAST;

-- ============================================================
-- RPC: Create next meeting with auto-populated standing items
-- ============================================================
CREATE OR REPLACE FUNCTION create_next_meeting(p_meeting_date DATE)
RETURNS UUID AS $$
DECLARE
  v_meeting_id UUID;
  v_last_chair_order INTEGER;
  v_next_chair_id UUID;
  v_following_chair_id UUID;
BEGIN
  SELECT cr.rotation_order INTO v_last_chair_order
  FROM meetings m
  JOIN chair_rotation cr ON cr.user_id = m.chair_id
  WHERE m.status = 'archived'
  ORDER BY m.meeting_date DESC
  LIMIT 1;

  IF v_last_chair_order IS NULL THEN
    v_last_chair_order := 0;
  END IF;

  SELECT user_id INTO v_next_chair_id
  FROM chair_rotation
  WHERE rotation_order = (v_last_chair_order % 4) + 1;

  SELECT user_id INTO v_following_chair_id
  FROM chair_rotation
  WHERE rotation_order = ((v_last_chair_order + 1) % 4) + 1;

  INSERT INTO meetings (meeting_date, chair_id, next_chair_id, status)
  VALUES (p_meeting_date, v_next_chair_id, v_following_chair_id, 'scheduled')
  RETURNING id INTO v_meeting_id;

  INSERT INTO standing_items (meeting_id, template_id, status)
  SELECT v_meeting_id, id, 'no_update'
  FROM standing_item_templates
  WHERE is_active = true;

  RETURN v_meeting_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RLS (permissive for Phase 1 — 4 known users)
-- ============================================================
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE standing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_center_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON issues FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON todos FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON meetings FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_all" ON standing_items FOR ALL TO authenticated USING (true);
CREATE POLICY "cc_flags_read" ON command_center_flags FOR SELECT TO authenticated USING (true);
