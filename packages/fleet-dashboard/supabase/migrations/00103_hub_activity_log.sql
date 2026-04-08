-- Hub Activity Log — cross-property action tracking

CREATE TABLE IF NOT EXISTS hub_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES hub_users(id),
  property_id uuid REFERENCES hub_properties(id),
  group_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_hub_activity_property ON hub_activity_log(property_id, created_at DESC);
CREATE INDEX idx_hub_activity_user ON hub_activity_log(user_id, created_at DESC);

-- RLS
ALTER TABLE hub_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_activity_read" ON hub_activity_log
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "hub_activity_insert" ON hub_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
