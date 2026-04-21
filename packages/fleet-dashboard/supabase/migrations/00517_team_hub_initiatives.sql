-- ============================================================
-- Team Hub — Initiatives
-- ============================================================
-- Non-app items worth surfacing on the weekly agenda: conferences,
-- partnerships, client deals, internal bets. Kept in one unified
-- table so the Fleet review section can render them uniformly
-- alongside hub_properties health flags.
-- ============================================================

CREATE TABLE IF NOT EXISTS hub_initiatives (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN (
                    'conference', 'partnership', 'deal', 'bet', 'other'
                  )),
  stage           TEXT NOT NULL DEFAULT 'active' CHECK (stage IN (
                    'idea', 'active', 'stalled', 'won', 'lost', 'complete', 'archived'
                  )),
  owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  counterparty    TEXT,
  starts_on       DATE,
  ends_on         DATE,
  next_step       TEXT,
  next_step_due   DATE,
  last_update_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  property_id     UUID REFERENCES hub_properties(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hub_initiatives_stage      ON hub_initiatives(stage);
CREATE INDEX IF NOT EXISTS idx_hub_initiatives_kind       ON hub_initiatives(kind);
CREATE INDEX IF NOT EXISTS idx_hub_initiatives_owner      ON hub_initiatives(owner_id);
CREATE INDEX IF NOT EXISTS idx_hub_initiatives_property   ON hub_initiatives(property_id);
CREATE INDEX IF NOT EXISTS idx_hub_initiatives_next_due   ON hub_initiatives(next_step_due);

-- Reuses update_updated_at() defined in 00120_team_hub_initial.sql.
DROP TRIGGER IF EXISTS set_updated_at_hub_initiatives ON hub_initiatives;
CREATE TRIGGER set_updated_at_hub_initiatives
  BEFORE UPDATE ON hub_initiatives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE hub_initiatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_initiatives_read"  ON hub_initiatives;
DROP POLICY IF EXISTS "hub_initiatives_write" ON hub_initiatives;

CREATE POLICY "hub_initiatives_read"  ON hub_initiatives
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "hub_initiatives_write" ON hub_initiatives
  FOR ALL    TO authenticated USING (true) WITH CHECK (true);
