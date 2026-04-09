-- ============================================================
-- Pandotic Team Hub — Seed Data
-- ============================================================

INSERT INTO issues (title, submitter_id, priority, source) VALUES
  ('ClickUp vs. building our own PM tool', (SELECT id FROM users WHERE name = 'Matt'), 'urgent', 'manual'),
  ('Playbook pricing model', (SELECT id FROM users WHERE name = 'Scott'), 'discuss', 'manual'),
  ('Education vertical strategy — who leads?', (SELECT id FROM users WHERE name = 'Allen'), 'discuss', 'manual'),
  ('ASU GSV conference — who is attending?', (SELECT id FROM users WHERE name = 'Scott'), 'fyi', 'manual');

INSERT INTO todos (description, owner_id, due_date, source) VALUES
  ('Review and sign Gaia agreement', (SELECT id FROM users WHERE name = 'Matt'), CURRENT_DATE - 7, 'manual'),
  ('CJ/McLeod pricing research for Playbook', (SELECT id FROM users WHERE name = 'Scott'), CURRENT_DATE - 7, 'manual'),
  ('Demo Playbook update to team', (SELECT id FROM users WHERE name = 'Allen'), CURRENT_DATE - 7, 'manual'),
  ('Prepare Burning Man initial demo', (SELECT id FROM users WHERE name = 'Dan'), CURRENT_DATE + 7, 'manual'),
  ('Submit SCE proposal final', (SELECT id FROM users WHERE name = 'Matt'), CURRENT_DATE + 7, 'manual');
