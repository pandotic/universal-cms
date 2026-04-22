#!/usr/bin/env bash
# Apply all hub migrations to a Postgres database in lexical order.
# Catches syntax errors, broken FK references, malformed RLS policies,
# duplicate identifiers, and most structural schema bugs.
#
# Usage:
#   PGURL=postgres://user:pass@host:5432/db ./scripts/validate-migrations.sh
#
# CI sets PGURL to the postgres service container.

set -euo pipefail

: "${PGURL:?PGURL must be set (postgres://user:pass@host:port/db)}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/packages/fleet-dashboard/supabase/migrations"

# Stub the Supabase-managed schema so migrations that reference
# auth.uid(), authenticated/anon roles, etc. apply cleanly against
# vanilla Postgres.
PREAMBLE=$(cat <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT '00000000-0000-0000-0000-000000000000'::uuid $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT 'service_role'::text $$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT 'ci@example.com'::text $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
  LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  CREATE ROLE authenticated;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE anon;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE service_role;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE supabase_admin;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Realtime publication that Supabase ships with by default. Several
-- migrations call `ALTER PUBLICATION supabase_realtime ADD TABLE …`.
CREATE PUBLICATION supabase_realtime;
SQL
)

# Migrations whose schema is referenced by earlier-numbered migrations
# (forward-reference bugs in the source ordering). Pre-apply these in
# the preamble; the lexical pass will then succeed because the actual
# CREATE TABLE bodies use IF NOT EXISTS, making re-runs idempotent.
PRE_APPLY=(
  "00102_hub_users.sql"     # 00100, 00101 RLS policies reference hub_users
  "00100_hub_properties.sql" # 00505 references hub_properties
  "00505_hub_skills.sql"    # 00107 FKs reference hub_skills
)

# Migrations that depend on data outside this repo (api_secrets, etc.)
# or have other unresolvable cold-apply issues. CI still catches
# regressions in every other migration.
SKIP_MIGRATIONS=(
  "00502_rbac_mapping.sql"             # refs hub_group_properties created elsewhere
  "00504_hub_api_key_assignments.sql"  # FK refs api_secrets (external schema)
  "00508_fix_hub_users_rls_recursion.sql" # depends on 00502 skip
)

is_skipped() {
  local n="$1"
  for s in "${SKIP_MIGRATIONS[@]}"; do
    [ "$s" = "$n" ] && return 0
  done
  return 1
}

is_pre_applied() {
  local n="$1"
  for p in "${PRE_APPLY[@]}"; do
    [ "$p" = "$n" ] && return 0
  done
  return 1
}

echo "[validate-migrations] applying preamble (auth schema stubs)…"
psql "$PGURL" -v ON_ERROR_STOP=1 -q -c "$PREAMBLE"

for pre in "${PRE_APPLY[@]}"; do
  echo "[validate-migrations] pre-applying $pre (forward-ref dependency)"
  psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$MIGRATIONS_DIR/$pre"
done

count=0
skipped=0
fail=0
failed_files=()
for f in "$MIGRATIONS_DIR"/*.sql; do
  name="$(basename "$f")"
  if is_pre_applied "$name"; then
    skipped=$((skipped + 1))
    continue
  fi
  if is_skipped "$name"; then
    echo "  ⊘ $name (known cold-apply issue, see SKIP_MIGRATIONS)"
    skipped=$((skipped + 1))
    continue
  fi
  if psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$f" 2>/tmp/mig_err; then
    count=$((count + 1))
  else
    fail=$((fail + 1))
    failed_files+=("$name")
    echo "  ✗ $name"
    sed 's/^/      /' /tmp/mig_err | head -3
  fi
done

echo ""
echo "[validate-migrations] applied $count, skipped $skipped (known issues), failed $fail"
if [ "$fail" -gt 0 ]; then
  echo "[validate-migrations] FAILED:"
  for f in "${failed_files[@]}"; do echo "  - $f"; done
  exit 1
fi
echo "[validate-migrations] OK"
