#!/bin/bash
# SessionStart hook for Claude Code on the web.
#
# Runs `pnpm install --prefer-offline` so workspace tooling (vitest, tsc,
# tsup, and the supabase CLI) is on PATH via `pnpm exec` before the agent
# loop starts. Idempotent: on a warm cache this is a fast no-op.
#
# Local sessions skip this — they already have an editor-managed install.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[session-start] pnpm not on PATH; skipping install" >&2
  exit 0
fi

echo "[session-start] installing workspace deps (pnpm install --prefer-offline)…"
pnpm install --prefer-offline --silent

# Expose pnpm's .bin on PATH for the session so `supabase`, `tsup`, etc.
# can be invoked without the `pnpm exec` prefix.
if [ -n "${CLAUDE_ENV_FILE:-}" ] && [ -d node_modules/.bin ]; then
  echo "export PATH=\"$(pwd)/node_modules/.bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

if [ -x node_modules/.bin/supabase ]; then
  echo "[session-start] supabase CLI ready: $(node_modules/.bin/supabase --version)"
else
  echo "[session-start] WARNING: supabase CLI missing after install" >&2
fi
