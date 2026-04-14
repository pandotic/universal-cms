// ─── Skill Upload ─────────────────────────────────────────────────────────
// Server-side logic for processing uploaded skill files (SKILL.md or zip).
// Parses frontmatter, writes files to the skill-library directory,
// and updates the skills-manifest.json.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import type { ManifestSkill } from "../types/index";
import { loadSkillsManifest, getPackageRoot, computeContentHash } from "./manifest-sync";

// ─── Frontmatter Parsing ─────────────────────────────────────────────────

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

/**
 * Parse YAML frontmatter from a SKILL.md string.
 * Uses simple line-by-line parsing to avoid extra dependencies.
 */
export function parseFrontmatter(markdown: string): Record<string, string | string[]> {
  const match = markdown.match(FRONTMATTER_RE);
  if (!match) return {};

  const yaml = match[1];
  const result: Record<string, string | string[]> = {};

  for (const line of yaml.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const rawValue = trimmed.slice(colonIdx + 1).trim();

    // Handle YAML arrays on a single line: [a, b, c]
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      result[key] = rawValue
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      result[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }

  return result;
}

// ─── Slugify ─────────────────────────────────────────────────────────────

/** Convert a name to a URL-safe slug */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── File Writing ────────────────────────────────────────────────────────

export interface ComponentFile {
  name: string;
  content: string;
}

/**
 * Write a SKILL.md and optional component files to the skill-library directory.
 */
export function writeSkillFiles(
  slug: string,
  skillMd: string,
  componentFiles?: ComponentFile[]
): void {
  const root = getPackageRoot();

  // Write SKILL.md
  const skillDir = resolve(root, "skills", slug);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(resolve(skillDir, "SKILL.md"), skillMd, "utf8");

  // Write component files if provided
  if (componentFiles?.length) {
    for (const file of componentFiles) {
      // Validate extension
      if (!/\.(jsx?|tsx?|css)$/.test(file.name)) continue;
      // Sanitize: no path traversal
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "");
      const compDir = resolve(root, "components", slug);
      mkdirSync(compDir, { recursive: true });
      writeFileSync(resolve(compDir, safeName), file.content, "utf8");
    }
  }
}

// ─── Manifest Update ─────────────────────────────────────────────────────

/**
 * Update skills-manifest.json with a new or updated skill entry.
 */
export function updateManifest(
  slug: string,
  frontmatter: Record<string, string | string[]>,
  componentIds?: string[]
): ManifestSkill {
  const root = getPackageRoot();
  const manifestPath = resolve(root, "skills-manifest.json");

  const manifest: ManifestSkill[] = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : [];

  const entry: ManifestSkill = {
    id: slug,
    name: (frontmatter.name as string) || slug,
    icon: (frontmatter.icon as string) || "FileText",
    category: (frontmatter.category as string) || "Developer Tools",
    description: (frontmatter.description as string) || "",
    triggers: Array.isArray(frontmatter.triggers)
      ? frontmatter.triggers
      : typeof frontmatter.triggers === "string"
        ? [frontmatter.triggers]
        : [],
    version: (frontmatter.version as string) || "1.0.0",
    author: (frontmatter.author as string) || "pandotic",
    path: `skills/${slug}`,
    ...(componentIds?.length ? { components: componentIds } : {}),
  };

  // Upsert: replace existing or append
  const existingIdx = manifest.findIndex((s) => s.id === slug);
  if (existingIdx >= 0) {
    manifest[existingIdx] = entry;
  } else {
    manifest.push(entry);
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return entry;
}

// ─── Upload Result ───────────────────────────────────────────────────────

export interface UploadedSkillResult {
  slug: string;
  name: string;
  version: string;
  description: string;
  category: string;
  isNew: boolean;
  contentHash: string;
}

// ─── Process Upload ──────────────────────────────────────────────────────

/**
 * Process an uploaded skill: parse frontmatter, write files, update manifest.
 */
export function processSkillUpload(
  skillMd: string,
  componentFiles?: ComponentFile[]
): UploadedSkillResult {
  const frontmatter = parseFrontmatter(skillMd);
  const name = frontmatter.name as string | undefined;

  if (!name) {
    throw new Error("SKILL.md must have a 'name' field in its frontmatter");
  }

  const description = frontmatter.description as string | undefined;
  if (!description) {
    throw new Error("SKILL.md must have a 'description' field in its frontmatter");
  }

  const slug = slugify(name);
  if (!slug) {
    throw new Error(`Could not generate a valid slug from name: "${name}"`);
  }

  // Sanitize slug: no path traversal
  if (slug.includes("..") || slug.startsWith("/")) {
    throw new Error(`Invalid slug: "${slug}"`);
  }

  // Check if this is a new skill or an update
  const manifest = loadSkillsManifest();
  const isNew = !manifest.some((s) => s.id === slug);

  // Write files
  const componentIds = componentFiles?.length ? [slug] : undefined;
  writeSkillFiles(slug, skillMd, componentFiles);
  updateManifest(slug, frontmatter, componentIds);

  const contentHash = computeContentHash(skillMd);

  return {
    slug,
    name,
    version: (frontmatter.version as string) || "1.0.0",
    description,
    category: (frontmatter.category as string) || "Developer Tools",
    isNew,
    contentHash,
  };
}
