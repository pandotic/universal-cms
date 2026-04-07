-- AI conversation persistence for the CMS chat assistant
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users read own conversations"
  ON ai_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own conversations"
  ON ai_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own conversations"
  ON ai_conversations FOR DELETE
  USING (user_id = auth.uid());

-- Admins can see all conversations (for auditing)
CREATE POLICY "Admins read all conversations"
  ON ai_conversations FOR SELECT
  USING (public.has_role('admin'));
