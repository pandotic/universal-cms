-- ═══════════════════════════════════════════════════════════════════════════
-- feature_flags — per-flag rollout control used by /feature-flags admin page
-- Mirrors the table created via chunk-1-ops.sql so fresh Supabase projects
-- can reconstruct the schema via `supabase db push`.
-- Idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key            text NOT NULL UNIQUE,
  flag_name           text NOT NULL,
  description         text,
  is_enabled          boolean NOT NULL DEFAULT false,
  rollout_percentage  integer NOT NULL DEFAULT 0
                        CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_roles        text[],
  target_org_ids      uuid[],
  target_user_ids     uuid[],
  metadata            jsonb DEFAULT '{}'::jsonb,
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key     ON public.feature_flags(flag_key);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_flags_read  ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_write ON public.feature_flags;

CREATE POLICY feature_flags_read  ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY feature_flags_write ON public.feature_flags
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM hub_users
     WHERE hub_users.auth_user_id = auth.uid()
       AND hub_users.hub_role = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM hub_users
     WHERE hub_users.auth_user_id = auth.uid()
       AND hub_users.hub_role = 'super_admin'
  ));
