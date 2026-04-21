#!/usr/bin/env tsx
/**
 * Regenerates AI_CONTEXT.md (auto sections only), llms.txt (full), and
 * llms-full.txt (full). Prose in AI_CONTEXT.md outside of AUTO markers is
 * preserved.
 *
 * Usage:
 *   pnpm ai-context          # rewrite files
 *   pnpm ai-context:check    # exit non-zero if files are stale (for CI)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");
const CMS_CORE = join(ROOT, "packages/cms-core");
const TEMPLATE = join(ROOT, "template");

const AI_CONTEXT = join(ROOT, "AI_CONTEXT.md");
const LLMS = join(ROOT, "llms.txt");
const LLMS_FULL = join(ROOT, "llms-full.txt");

const CHECK = process.argv.includes("--check");

// ─── Helpers ────────────────────────────────────────────────────────────────

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function listDir(path: string): string[] {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function replaceBlock(content: string, marker: string, body: string): string {
  const open = `<!-- AUTO:${marker} -->`;
  const close = `<!-- /AUTO:${marker} -->`;
  const re = new RegExp(
    `${open}[\\s\\S]*?${close}`,
    "m"
  );
  if (!re.test(content)) {
    throw new Error(
      `Missing AUTO marker pair for "${marker}" in AI_CONTEXT.md. ` +
        `Add \`${open}\` ... \`${close}\` around the section you want regenerated.`
    );
  }
  return content.replace(re, `${open}\n${body}\n${close}`);
}

// ─── Extractors ─────────────────────────────────────────────────────────────

/** Module catalog — parse CmsModuleName union + MODULE_MIGRATIONS comments from config.ts */
function extractModuleCatalog(): string {
  const src = read(join(CMS_CORE, "src/config.ts"));
  // Walk the CmsModuleName union, collecting each `// Section` comment + following modules.
  const start = src.indexOf("export type CmsModuleName =");
  const end = src.indexOf(";", start);
  const block = src.slice(start, end);
  const groups: { label: string; modules: string[] }[] = [];
  let current: { label: string; modules: string[] } | null = null;
  for (const raw of block.split("\n")) {
    const line = raw.trim();
    const comment = line.match(/^\/\/\s*(.+)$/);
    if (comment) {
      current = { label: comment[1].trim(), modules: [] };
      groups.push(current);
      continue;
    }
    const mod = line.match(/^\|\s*"([^"]+)"/);
    if (mod && current) current.modules.push(mod[1]);
  }
  const lines: string[] = [];
  for (const g of groups) {
    if (g.modules.length === 0) continue;
    lines.push(`- **${g.label}:** ${g.modules.map((m) => `\`${m}\``).join(", ")}`);
  }
  return lines.join("\n");
}

/** Data function signatures — group by file, extract `export async function` names. */
function extractDataFns(): string {
  const dataDir = join(CMS_CORE, "src/data");
  const pkg = JSON.parse(read(join(CMS_CORE, "package.json")));
  const exports = pkg.exports as Record<string, { development?: string }>;

  // Map file basename (without .ts) → subpath (e.g. "content-pages" → "/data/content")
  const fileToSubpath = new Map<string, string>();
  for (const [subpath, entry] of Object.entries(exports)) {
    if (!subpath.startsWith("./data/")) continue;
    const dev = entry.development;
    if (!dev) continue;
    const match = dev.match(/src\/data\/([^/]+)\.ts$/);
    if (match) fileToSubpath.set(match[1], subpath.slice(1)); // drop leading "."
  }

  const files = listDir(dataDir)
    .filter((f) => f.endsWith(".ts") && !f.startsWith("hub-") && f !== "index.ts")
    .sort();

  const sections: string[] = [];
  for (const file of files) {
    const base = file.replace(/\.ts$/, "");
    const subpath = fileToSubpath.get(base);
    if (!subpath) continue; // not exported
    const src = read(join(dataDir, file));
    const fns = [
      ...src.matchAll(/^export\s+async\s+function\s+(\w+)/gm),
      ...src.matchAll(/^export\s+function\s+(\w+)/gm),
    ]
      .map((m) => m[1])
      .filter((name, i, arr) => arr.indexOf(name) === i);
    if (fns.length === 0) continue;

    // Capture short string-union type aliases — they're the contextual notes
    // ("FormType = contact|lead|...") worth surfacing.
    const enums: string[] = [];
    for (const m of src.matchAll(
      /^export\s+type\s+(\w+)\s*=\s*((?:"[\w-]+"\s*\|\s*)*"[\w-]+")\s*;/gm
    )) {
      const values = [...m[2].matchAll(/"([\w-]+)"/g)].map((v) => v[1]);
      if (values.length > 1) enums.push(`\`${m[1]}\` = ${values.join("|")}`);
    }
    const enumLine = enums.length ? `\n${enums.join(". ")}.` : "";

    sections.push(
      `### \`${subpath}\`\n` +
        fns.map((f) => `\`${f}\``).join(", ") +
        "." +
        enumLine
    );
  }
  return sections.join("\n\n");
}

/** Migrations — parse each .sql file for the first `-- ` comment on line 1/2. */
function extractMigrations(): string {
  const dir = join(TEMPLATE, "supabase/migrations");
  const files = listDir(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const rows: string[] = [];
  for (const file of files) {
    const src = read(join(dir, file));
    // First non-empty comment line.
    const firstComment =
      src
        .split("\n")
        .find((l) => l.trim().startsWith("--") && !l.trim().match(/^--+$/)) ||
      "";
    const desc = firstComment
      .replace(/^--\s*/, "")
      .trim()
      .replace(/\|/g, "\\|");

    // Extract CREATE TABLE IF NOT EXISTS names.
    const tables = [
      ...src.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+([a-zA-Z0-9_]+)/g),
    ]
      .map((m) => m[1])
      .filter((t, i, arr) => arr.indexOf(t) === i);

    const slug = file.replace(/\.sql$/, "");
    const detail = tables.length
      ? `${desc ? desc + " — " : ""}${tables.map((t) => `\`${t}\``).join(", ")}`
      : desc || "(no tables)";
    rows.push(`| \`${slug}\` | ${detail} |`);
  }
  return [
    "| File | Description / Tables |",
    "|---|---|",
    ...rows,
  ].join("\n");
}

/** Admin pages in template — directories under template/src/app/admin. */
function extractAdminPages(): string {
  const dir = join(TEMPLATE, "src/app/admin");
  const entries = listDir(dir).sort();
  const rows: string[] = [];
  for (const name of entries) {
    const full = join(dir, name);
    try {
      if (!statSync(full).isDirectory()) continue;
    } catch {
      continue;
    }
    rows.push(`- \`/admin/${name}\``);
  }
  if (rows.length === 0) return "(no admin pages found)";
  return ["Pages shipped in the starter template:", "", ...rows].join("\n");
}

/** API handlers under template/src/app/api/admin. */
function extractAdminApi(): string {
  const dir = join(TEMPLATE, "src/app/api/admin");
  const names = listDir(dir)
    .filter((n) => {
      try {
        return statSync(join(dir, n)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
  if (names.length === 0) return "(no admin API routes found)";
  return (
    "Matching handlers in `template/src/app/api/admin/`: " +
    names.map((n) => `\`${n}\``).join(", ") +
    "."
  );
}

/** Component barrel exports from each component subfolder's index.ts. */
function extractComponents(group: "admin" | "ui" | "theme" | "tracking" | "projects"): string {
  const path = join(CMS_CORE, "src/components", group, "index.ts");
  if (!isFile(path)) return "(missing)";
  const src = read(path);
  const names = new Set<string>();
  for (const m of src.matchAll(/export\s+\{([^}]+)\}/g)) {
    for (const raw of m[1].split(",")) {
      const id = raw.trim().split(/\s+as\s+/i).pop()!;
      if (id && !id.startsWith("type")) names.add(id);
    }
  }
  for (const m of src.matchAll(/export\s+\{\s*default\s+as\s+(\w+)\s*\}/g)) {
    names.add(m[1]);
  }
  return [...names].map((n) => `\`${n}\``).join(", ") + ".";
}

// ─── Drift checks ───────────────────────────────────────────────────────────

function warnIfUndocumentedSubpaths(context: string): string[] {
  const warnings: string[] = [];
  const pkg = JSON.parse(read(join(CMS_CORE, "package.json")));
  const exports = Object.keys(pkg.exports).filter((k) => k !== ".");
  for (const sub of exports) {
    // Match by basename (last segment). The doc uses shorthand like
    // `hub-*` so full-path substring matching isn't sufficient.
    const basename = sub.split("/").pop() ?? sub;
    if (basename.length < 3) continue;
    if (!context.includes(basename)) {
      warnings.push(`Subpath not mentioned in AI_CONTEXT.md: ${sub}`);
    }
  }
  return warnings;
}

// ─── llms.txt / llms-full.txt ───────────────────────────────────────────────

function buildLlmsIndex(): string {
  return `# @pandotic/universal-cms

> Universal CMS for Next.js 16 + Supabase sites. ESM-only npm package with
> subpath exports for config, types, data functions (client-injection
> pattern), middleware, UI primitives, admin shell, and AI helpers. Ships
> an idempotent migration set and a working starter template.

Scope of this file: the consumable package + app admin. Hub / Fleet /
Team Hub dashboards are excluded, except for the backend tables they
expose via the package's data subpaths.

Regenerate with \`pnpm ai-context\`.

## Quickstart

- [AI_CONTEXT.md](./AI_CONTEXT.md): Condensed one-file spec — paste into any AI chat session.
- [packages/cms-core/README.md](./packages/cms-core/README.md): Install, env vars, subpath examples.
- [PUBLISHING.md](./PUBLISHING.md): GitHub Packages publish flow.
- [UPGRADE.md](./UPGRADE.md): Semver + upgrade checklist.
- [template/src/cms.config.ts](./template/src/cms.config.ts): Starter \`CmsConfig\`.
- [template/src/middleware.ts](./template/src/middleware.ts): Drop-in Supabase SSR auth.

## Package surface

- [packages/cms-core/package.json](./packages/cms-core/package.json): Canonical subpath export list.
- [packages/cms-core/src/config.ts](./packages/cms-core/src/config.ts): \`CmsConfig\`, \`modulePresets\`, \`MODULE_MIGRATIONS\`, \`getRequiredMigrations\`.
- [packages/cms-core/src/types/index.ts](./packages/cms-core/src/types/index.ts): Shared domain types.
- [packages/cms-core/src/types/admin.ts](./packages/cms-core/src/types/admin.ts): Platform admin types.
- [packages/cms-core/src/middleware/auth.ts](./packages/cms-core/src/middleware/auth.ts): \`requireAdmin\`, \`apiError\`.
- [packages/cms-core/src/security/index.ts](./packages/cms-core/src/security/index.ts): Rate limiters, env validators, CSP headers.
- [packages/cms-core/src/ai/index.ts](./packages/cms-core/src/ai/index.ts): Anthropic tool-use helpers for admin chat.

## Database

- [template/supabase/migrations/](./template/supabase/migrations/): Idempotent SQL migrations.

## Template

- [template/](./template/): Next.js 16 App Router starter. Copy as-is for a new site.
- [template/src/app/admin/](./template/src/app/admin/): Admin pages.
- [template/src/app/api/admin/](./template/src/app/api/admin/): Admin API handlers.

## Optional

- [packages/cms-core/src/cli/setup-admin.ts](./packages/cms-core/src/cli/setup-admin.ts): Interactive wizard to scaffold admin into an existing Next.js project.
- [packages/cms-core/src/promptkit/](./packages/cms-core/src/promptkit/): Experimental AI model + skill registry.
`;
}

function buildLlmsFull(aiContext: string): string {
  const inlineFiles: [string, string][] = [
    ["packages/cms-core/src/config.ts", "ts"],
    ["packages/cms-core/src/types/index.ts", "ts"],
    ["packages/cms-core/src/types/admin.ts", "ts"],
    ["packages/cms-core/src/middleware/auth.ts", "ts"],
    ["template/src/cms.config.ts", "ts"],
    ["template/src/middleware.ts", "ts"],
  ];
  const parts: string[] = [
    "# @pandotic/universal-cms — Full AI Context",
    "",
    "> Deep context bundle. Inline sources for the most-referenced files.",
    "> Regenerated by `pnpm ai-context`. Do not edit by hand.",
    "",
    "---",
    "",
    "# 1. Condensed spec (AI_CONTEXT.md)",
    "",
    aiContext,
  ];
  for (let i = 0; i < inlineFiles.length; i++) {
    const [rel, lang] = inlineFiles[i];
    parts.push("", "---", "", `# ${i + 2}. Source: ${rel}`, "", "```" + lang);
    parts.push(read(join(ROOT, rel)).trimEnd());
    parts.push("```");
  }
  return parts.join("\n") + "\n";
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const original = read(AI_CONTEXT);
  let next = original;

  next = replaceBlock(next, "MODULE_CATALOG", extractModuleCatalog());
  next = replaceBlock(next, "DATA_FNS", extractDataFns());
  next = replaceBlock(next, "MIGRATIONS", extractMigrations());
  next = replaceBlock(
    next,
    "ADMIN_SURFACE",
    [extractAdminPages(), "", extractAdminApi()].join("\n")
  );
  // extractComponents() is available if component sections ever drift — wire it
  // up by adding <!-- AUTO:COMPONENTS_* --> markers in §6 and a replaceBlock
  // call here.

  const llmsIndex = buildLlmsIndex();
  const llmsFull = buildLlmsFull(next);

  const targets: { path: string; expected: string; original: string }[] = [
    { path: AI_CONTEXT, expected: next, original },
    { path: LLMS, expected: llmsIndex, original: read(LLMS) },
    { path: LLMS_FULL, expected: llmsFull, original: read(LLMS_FULL) },
  ];

  const drifted = targets.filter((t) => t.expected !== t.original);

  // Surface warnings (non-fatal).
  const warnings = warnIfUndocumentedSubpaths(next);
  for (const w of warnings) console.warn(`⚠️  ${w}`);

  if (CHECK) {
    if (drifted.length === 0) {
      console.log("✓ AI context files are in sync.");
      process.exit(0);
    }
    console.error("✗ AI context files are stale. Run `pnpm ai-context` to regenerate:");
    for (const t of drifted) console.error(`   - ${relative(ROOT, t.path)}`);
    process.exit(1);
  }

  for (const t of drifted) {
    writeFileSync(t.path, t.expected);
    console.log(`updated ${relative(ROOT, t.path)}`);
  }
  if (drifted.length === 0) console.log("no changes.");
}

main();
