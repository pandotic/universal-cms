# Pandotic Hub — Ops Runbook

Consolidated list of **manual Supabase ops** that the code expects to have been
run but the CLI/migrations haven't done automatically. Target project:
**`rimbgolutrxpmwsoswhq`** (Pandotic Hub).

## How to run these

**Option A — Supabase CLI (preferred once logged in).** From the repo root:

```bash
# One-time
supabase login                          # paste access token from dashboard
supabase link --project-ref rimbgolutrxpmwsoswhq

# To run ad-hoc SQL blocks from this doc (paste between EOF markers)
supabase db execute --db-url "$DATABASE_URL" <<'EOF'
  -- paste a block here
EOF

# To apply any new migration files committed under
# packages/fleet-dashboard/supabase/migrations/
supabase db push
```

**Option B — Dashboard SQL editor (works without CLI access).** Paste each
block into:

> https://supabase.com/dashboard/project/rimbgolutrxpmwsoswhq/sql/new

Run them **in the order below**. Every block is idempotent (safe to re-run).

---

## 1. Founder `auth_user_id` backfill — **BLOCKING `/team-hub`**

The `handle_new_user()` trigger from migration `00123_team_hub_auth.sql` only
fires on new Supabase auth sign-ups. Founders (Allen / Matt / Dan / Scott)
signed in before that trigger existed, so their `public.users.auth_user_id`
is still NULL and `useTeamUser` cannot resolve their row — they see the
"Team Hub is for founders" panel.

```sql
UPDATE public.users u
   SET auth_user_id = a.id
  FROM auth.users a
 WHERE LOWER(u.email) = LOWER(a.email)
   AND u.auth_user_id IS NULL;

SELECT name, email, auth_user_id IS NOT NULL AS linked
  FROM public.users
 ORDER BY name;
```

Expected: all four founders show `linked = true`.

---

## 2. Team Hub agenda seed — empty state fix

File lives at `packages/fleet-dashboard/supabase/seed-team-hub.sql`.
Idempotent guard added below so re-running won't duplicate rows.

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM issues WHERE source = 'manual') THEN
    INSERT INTO issues (title, submitter_id, priority, source) VALUES
      ('ClickUp vs. building our own PM tool',     (SELECT id FROM users WHERE name = 'Matt'),  'urgent',  'manual'),
      ('Playbook pricing model',                    (SELECT id FROM users WHERE name = 'Scott'), 'discuss', 'manual'),
      ('Education vertical strategy — who leads?',  (SELECT id FROM users WHERE name = 'Allen'), 'discuss', 'manual'),
      ('ASU GSV conference — who is attending?',    (SELECT id FROM users WHERE name = 'Scott'), 'fyi',     'manual');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM todos WHERE source = 'manual') THEN
    INSERT INTO todos (description, owner_id, due_date, source) VALUES
      ('Review and sign Gaia agreement',            (SELECT id FROM users WHERE name = 'Matt'),  CURRENT_DATE - 7, 'manual'),
      ('CJ/McLeod pricing research for Playbook',   (SELECT id FROM users WHERE name = 'Scott'), CURRENT_DATE - 7, 'manual'),
      ('Demo Playbook update to team',              (SELECT id FROM users WHERE name = 'Allen'), CURRENT_DATE - 7, 'manual'),
      ('Prepare Burning Man initial demo',          (SELECT id FROM users WHERE name = 'Dan'),   CURRENT_DATE + 7, 'manual'),
      ('Submit SCE proposal final',                 (SELECT id FROM users WHERE name = 'Matt'),  CURRENT_DATE + 7, 'manual');
  END IF;
END $$;
```

Run **after** block 1 — this references `users.id` by name, which requires the
founders to have rows.

---

## 3. `feature_flags` table — **unblocks `/feature-flags` page**

The page at `src/app/feature-flags/page.tsx` reads and writes `feature_flags`,
but **no migration ever creates the table**. The page throws on load.

```sql
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
```

> A real migration file for this will be added to
> `packages/fleet-dashboard/supabase/migrations/` in Chunk 2 so the schema is
> reproducible on a fresh project. This block is the stopgap for the live DB.

---

## 4. `user_roles` table — optional, non-blocking

`src/app/api/setup/route.ts` and `src/app/api/setup/check/route.ts` reference
a `user_roles` table but **wrap the call in a try/catch that ignores "table
does not exist"**, so the Hub won't crash without it. Add this only if we
decide to actually use platform-level roles beyond `hub_users.hub_role`.

```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type   text NOT NULL,
  granted_by  uuid REFERENCES auth.users(id),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_type)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_read ON public.user_roles;
CREATE POLICY user_roles_read ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
```

---

## 5. Register Hub properties — **makes `/properties` non-empty**

After the theme fix in Chunk 1, the `/properties` table will be readable
but still empty until we register properties. You can do this through the UI
(`/properties` → Add) once Chunk 1 is deployed. SQL template for bulk registering:

```sql
INSERT INTO public.hub_properties (name, slug, url, property_type, preset, enabled_modules)
VALUES
  ('Pandotic',      'pandotic',     'https://pandotic.com',     'site', 'marketing',  ARRAY['content','seo']),
  ('Pandotic Hub',  'pandotic-hub', 'https://hub.pandotic.com', 'app',  'dashboard',  ARRAY['fleet','team-hub']),
  ('HomeDoc',       'homedoc',      'https://homedoc.app',      'app',  'product',    ARRAY['admin'])
ON CONFLICT (slug) DO NOTHING;
```

Adjust the list to whatever we actually operate today. After this runs,
`/properties` will show rows.

---

## 6. Marketing-ops brand seed — deferred

Per `MARKETING_OPS_ROADMAP.md` Phase 1, `hub_brand_voice_briefs` and
`hub_brand_assets` need seed rows keyed to properties before
`/marketing-ops/brands/*` has anything to show. No seed file exists yet;
this will be authored in Chunk 2 once the brand list is confirmed.

---

## 7. Known issues not addressed by this runbook

| Issue | Deferred to |
|---|---|
| 5 migration numbering collisions (00106, 00110, 00111, 00120, 00121) | Chunk 2 — requires `supabase migration repair` based on live `schema_migrations` state |
| Missing `seed-brands.sql` for marketing-ops | Chunk 2 |
| `@pandotic/skill-library` has no `dist/` → `/api/skills/*` will 500 | Chunk 3 |
| `@universal-cms/admin-core` / `admin-ui` still imported by 8 files | Chunk 4 |
| `.changeset/` only versions `@pandotic/universal-cms`, not the other 5 publishable packages | Chunk 4 |

---

## Verification after running blocks 1–5

```sql
-- Founders linked
SELECT COUNT(*) AS linked_founders
  FROM public.users WHERE auth_user_id IS NOT NULL;   -- expect: 4

-- Team hub seed landed
SELECT COUNT(*) AS seed_issues FROM issues WHERE source = 'manual';   -- expect: 4
SELECT COUNT(*) AS seed_todos  FROM todos  WHERE source = 'manual';   -- expect: 5

-- Feature flags table exists + readable
SELECT to_regclass('public.feature_flags') IS NOT NULL AS exists;     -- expect: t

-- Properties registered
SELECT COUNT(*) AS property_count FROM public.hub_properties;         -- expect: > 0
```
