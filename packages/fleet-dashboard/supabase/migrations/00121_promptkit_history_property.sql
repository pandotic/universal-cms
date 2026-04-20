-- PromptKit: associate each history entry with an optional hub property
-- so the prompt builder can pull project context into future optimizations.

ALTER TABLE promptkit_history
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES hub_properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_promptkit_history_property
  ON promptkit_history(property_id)
  WHERE property_id IS NOT NULL;
