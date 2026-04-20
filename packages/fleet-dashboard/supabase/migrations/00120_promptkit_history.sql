-- PromptKit history — per-user optimizer history
-- Stores each optimization run so users can browse, copy, and favorite past prompts.

CREATE TABLE IF NOT EXISTS promptkit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('claude', 'gemini', 'openai')),
  model_id text NOT NULL,
  model_label text,
  raw_prompt text NOT NULL,
  optimized_prompt text NOT NULL,
  notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone text NOT NULL DEFAULT 'direct' CHECK (tone IN ('direct', 'thorough', 'collaborative', 'aggressive')),
  output_mode text NOT NULL DEFAULT 'single' CHECK (output_mode IN ('single', 'phased')),
  is_favorite boolean NOT NULL DEFAULT false,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promptkit_history_user ON promptkit_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promptkit_history_favorite ON promptkit_history(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_promptkit_history_provider ON promptkit_history(user_id, provider);

-- RLS: users only see/modify their own history
ALTER TABLE promptkit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promptkit_history_select_own" ON promptkit_history;
CREATE POLICY "promptkit_history_select_own" ON promptkit_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "promptkit_history_insert_own" ON promptkit_history;
CREATE POLICY "promptkit_history_insert_own" ON promptkit_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "promptkit_history_update_own" ON promptkit_history;
CREATE POLICY "promptkit_history_update_own" ON promptkit_history
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "promptkit_history_delete_own" ON promptkit_history;
CREATE POLICY "promptkit_history_delete_own" ON promptkit_history
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
