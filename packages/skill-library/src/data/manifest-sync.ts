// ─── Manifest Sync ────────────────────────────────────────────────────────
// Bridges flat-file skill definitions (SKILL.md + manifests) with the
// Supabase database. Reads manifests, computes content hashes, and
// upserts into hub_skills + hub_skill_versions tables.

import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ManifestSkill, ManifestKnowledgebase, SkillScope } from "../types/index";

// ─── File Loading ─────────────────────────────────────────────────────────

export function getPackageRoot(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // Walk up from dist/ or src/ to package root
  let dir = dirname(thisFile);
  while (dir !== "/" && !existsSync(resolve(dir, "skills-manifest.json"))) {
    dir = dirname(dir);
  }
  return dir;
}

export function loadSkillsManifest(): ManifestSkill[] {
  const root = getPackageRoot();
  const filePath = resolve(root, "skills-manifest.json");
  if (!existsSync(filePath)) return [];
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function loadKBManifest(): ManifestKnowledgebase[] {
  const root = getPackageRoot();
  const filePath = resolve(root, "knowledgebases-manifest.json");
  if (!existsSync(filePath)) return [];
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function getSkillContent(skillId: string): string | null {
  const root = getPackageRoot();
  const filePath = resolve(root, "skills", skillId, "SKILL.md");
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf8");
}

export function getKBContent(kbId: string): string | null {
  const root = getPackageRoot();
  const filePath = resolve(root, "knowledgebases", kbId, "KB.md");
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf8");
}

export function getComponentFiles(componentId: string): { name: string; content: string }[] {
  const root = getPackageRoot();
  const dir = resolve(root, "components", componentId);
  if (!existsSync(dir)) return [];

  const { readdirSync } = require("fs") as typeof import("fs");
  return readdirSync(dir)
    .filter((f: string) => /\.(jsx?|tsx?|css)$/.test(f))
    .map((f: string) => ({
      name: f,
      content: readFileSync(resolve(dir, f), "utf8"),
    }));
}

// ─── Hashing ──────────────────────────────────────────────────────────────

export function computeContentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

// ─── Category Mapping ─────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  Documents: "documents",
  "AI & Automation": "ai_automation",
  "Developer Tools": "developer_tools",
  "UI Components": "ui_components",
  Mechanical: "knowledge_base",
  Electrical: "knowledge_base",
  Plumbing: "knowledge_base",
  General: "automation",
};

function mapCategory(category: string): string {
  return CATEGORY_MAP[category] ?? "automation";
}

function inferScope(skill: ManifestSkill): SkillScope {
  // Marketing/fleet skills stay in the hub
  if (skill.scope) return skill.scope;
  // Site-level skills get deployed to repos
  return "site";
}

// ─── Sync to Database ─────────────────────────────────────────────────────

export async function syncManifestToDb(client: SupabaseClient): Promise<{
  created: number;
  updated: number;
  unchanged: number;
}> {
  const manifest = loadSkillsManifest();
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const entry of manifest) {
    // Skip the template entry
    if (entry.id === "_template" || entry.id === "template") continue;

    const content = getSkillContent(entry.id);
    const contentHash = content ? computeContentHash(content) : "";
    const scope = inferScope(entry);

    // Check if skill already exists in DB
    const { data: existing } = await client
      .from("hub_skills")
      .select("id, version")
      .eq("manifest_id", entry.id)
      .maybeSingle();

    if (existing) {
      // Check if content changed
      const { data: latestVersion } = await client
        .from("hub_skill_versions")
        .select("content_hash")
        .eq("skill_id", existing.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestVersion?.content_hash === contentHash) {
        unchanged++;
        continue;
      }

      // Content changed — update skill and create version record
      const newVersion = entry.version || bumpPatch(existing.version);
      await client
        .from("hub_skills")
        .update({
          name: entry.name,
          description: entry.description,
          version: newVersion,
          tags: entry.triggers ?? [],
          content_path: `skills/${entry.id}/SKILL.md`,
          component_ids: entry.components ?? [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      await client.from("hub_skill_versions").insert({
        skill_id: existing.id,
        version: newVersion,
        content_hash: contentHash,
        changelog: `Content updated from manifest sync`,
      });

      updated++;
    } else {
      // Create new skill
      const { data: newSkill, error } = await client
        .from("hub_skills")
        .insert({
          name: entry.name,
          slug: entry.id,
          description: entry.description,
          platform: "claude_code",
          category: mapCategory(entry.category),
          execution_mode: "manual",
          scope,
          status: "active",
          version: entry.version || "1.0.0",
          tags: entry.triggers ?? [],
          content_path: `skills/${entry.id}/SKILL.md`,
          component_ids: entry.components ?? [],
          manifest_id: entry.id,
          default_config: {},
        })
        .select("id")
        .single();

      if (error) throw error;

      // Create initial version record
      await client.from("hub_skill_versions").insert({
        skill_id: newSkill.id,
        version: entry.version || "1.0.0",
        content_hash: contentHash,
        changelog: "Initial version",
      });

      created++;
    }
  }

  return { created, updated, unchanged };
}

function bumpPatch(version: string): string {
  const parts = version.split(".");
  if (parts.length !== 3) return "1.0.1";
  const patch = parseInt(parts[2], 10);
  return `${parts[0]}.${parts[1]}.${isNaN(patch) ? 1 : patch + 1}`;
}
