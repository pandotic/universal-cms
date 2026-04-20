-- ============================================================
-- Team Hub — Initiatives seed (idempotent)
-- ============================================================
-- Backfills the original agenda items that live better as initiatives
-- than as one-off issues/todos: conferences we're attending,
-- partnerships in progress, client deals open, and cross-cutting
-- company bets. Safe to paste into the SQL editor more than once —
-- ON CONFLICT (slug) DO NOTHING.
-- ============================================================

INSERT INTO hub_initiatives
  (slug, name, kind, stage, owner_id, counterparty, starts_on, next_step, next_step_due, notes)
VALUES
  ('asu-gsv-2026',          'ASU GSV 2026',               'conference',  'active',
   (SELECT id FROM users WHERE name = 'Scott'),  'ASU GSV',      CURRENT_DATE + 14,
   'Decide who is attending + book travel',      CURRENT_DATE + 7,
   'Annual edtech conference. Scott to lead, may bring Allen for education-vertical conversations.'),

  ('gaia-partnership',      'Gaia partnership agreement',  'partnership', 'active',
   (SELECT id FROM users WHERE name = 'Matt'),   'Gaia',         NULL,
   'Review and sign agreement',                  CURRENT_DATE,
   'Agreement terms finalised; signature pending.'),

  ('cj-mcleod-deal',        'CJ/McLeod Playbook pricing',  'deal',        'active',
   (SELECT id FROM users WHERE name = 'Scott'),  'CJ/McLeod',    NULL,
   'Pricing research + proposal draft',          CURRENT_DATE + 3,
   'Playbook pricing model research tied to CJ/McLeod opportunity.'),

  ('sce-proposal',          'SCE proposal',                'deal',        'active',
   (SELECT id FROM users WHERE name = 'Matt'),   'SCE',          NULL,
   'Submit final proposal',                      CURRENT_DATE + 7,
   'Final proposal pending internal review.'),

  ('education-vertical',    'Education vertical strategy', 'bet',         'idea',
   (SELECT id FROM users WHERE name = 'Allen'),  NULL,           NULL,
   'Decide who owns the vertical and draft a one-pager', CURRENT_DATE + 14,
   'Cross-cutting bet: does Pandotic lean into education? Allen to scope.'),

  ('burning-man-demo',      'Burning Man demo',            'conference',  'active',
   (SELECT id FROM users WHERE name = 'Dan'),    'Burning Man',  CURRENT_DATE + 45,
   'Prepare initial demo build',                 CURRENT_DATE + 7,
   'Demo build target: mid-summer. Dan leading.')

ON CONFLICT (slug) DO NOTHING;
