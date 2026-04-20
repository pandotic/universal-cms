-- ============================================================
-- Pandotic Team Hub — Seed Data (idempotent)
-- ============================================================
-- Safe to paste into the SQL editor more than once. Each INSERT
-- checks for an existing row with the same title/description
-- before adding, so re-running is a noop.
-- ============================================================

-- ISSUES
INSERT INTO issues (title, submitter_id, priority, source)
SELECT v.title, (SELECT id FROM users WHERE name = v.owner), v.priority, 'manual'
FROM (VALUES
  ('ClickUp vs. building our own PM tool',     'Matt',  'urgent'),
  ('Playbook pricing model',                   'Scott', 'discuss'),
  ('Education vertical strategy — who leads?', 'Allen', 'discuss'),
  ('ASU GSV conference — who is attending?',   'Scott', 'fyi')
) AS v(title, owner, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM issues i WHERE i.title = v.title
);

-- TO-DOS
INSERT INTO todos (description, owner_id, due_date, source)
SELECT v.description, (SELECT id FROM users WHERE name = v.owner), v.due_date, 'manual'
FROM (VALUES
  ('Review and sign Gaia agreement',           'Matt',  CURRENT_DATE - 7),
  ('CJ/McLeod pricing research for Playbook',  'Scott', CURRENT_DATE - 7),
  ('Demo Playbook update to team',             'Allen', CURRENT_DATE - 7),
  ('Prepare Burning Man initial demo',         'Dan',   CURRENT_DATE + 7),
  ('Submit SCE proposal final',                'Matt',  CURRENT_DATE + 7)
) AS v(description, owner, due_date)
WHERE NOT EXISTS (
  SELECT 1 FROM todos t WHERE t.description = v.description
);
