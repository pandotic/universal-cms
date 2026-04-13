/**
 * Seed script: reads pandotic-content-output/ folders and outputs SQL INSERT statements.
 *
 * Usage:
 *   npx tsx scripts/seed-projects.ts > seed.sql
 *
 * Or with Supabase client (when credentials are available):
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-projects.ts --direct
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "pandotic-content-output");

const SECTION_FILES: Record<string, string> = {
  "product-page": "product-page.md",
  "case-study": "case-study.md",
  features: "features.md",
  portfolio: "portfolio.md",
  blurbs: "blurbs.md",
  "proof-points": "proof-points.md",
  "tech-differentiators": "tech-differentiators.md",
};

interface MetadataYaml {
  project_name: string;
  slug: string;
  client: string;
  status: string;
  has_live_demo: boolean;
  demo_url: string | null;
  live_url: string | null;
  own_site_url: string | null;
  repo_url: string | null;
  hero_screenshot: string;
  video_long_id: string;
  video_short_id: string;
  tags: string[];
  sections_included: string[];
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function inferCategory(tags: string[]): string {
  if (tags.some((t) => t.includes("proptech") || t.includes("home-management")))
    return "proptech";
  if (tags.some((t) => t.includes("education") || t.includes("curriculum")))
    return "education";
  if (
    tags.some(
      (t) =>
        t.includes("energy") ||
        t.includes("building") ||
        t.includes("electrification"),
    )
  )
    return "green-buildings";
  return "other";
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error("Content directory not found:", CONTENT_DIR);
    process.exit(1);
  }

  const slugs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);

  if (slugs.length === 0) {
    console.error("No project folders found in", CONTENT_DIR);
    process.exit(1);
  }

  const statements: string[] = [];
  statements.push("-- Auto-generated seed data from pandotic-content-output/");
  statements.push(`-- Generated: ${new Date().toISOString()}`);
  statements.push("");
  statements.push("BEGIN;");
  statements.push("");

  for (const slug of slugs) {
    const metaPath = path.join(CONTENT_DIR, slug, "metadata.yaml");
    if (!fs.existsSync(metaPath)) {
      console.error(`Skipping ${slug}: no metadata.yaml`);
      continue;
    }

    const meta = yaml.load(
      fs.readFileSync(metaPath, "utf-8"),
    ) as MetadataYaml;

    // Read product-page.md for tagline
    const productPagePath = path.join(CONTENT_DIR, slug, "product-page.md");
    let tagline = meta.project_name;
    if (fs.existsSync(productPagePath)) {
      const { data } = matter(fs.readFileSync(productPagePath, "utf-8"));
      if (data.tagline) tagline = data.tagline;
    }

    const category = inferCategory(meta.tags || []);
    const tagsArray = (meta.tags || [])
      .map((t: string) => `'${escapeSQL(t)}'`)
      .join(",");

    statements.push(`-- Project: ${meta.project_name}`);
    statements.push(`INSERT INTO projects (
  slug, name, client, tagline, status, category,
  has_live_demo, demo_url, live_url, own_site_url, repo_url,
  hero_screenshot, video_long_id, video_short_id,
  tags, sort_order
) VALUES (
  '${escapeSQL(slug)}',
  '${escapeSQL(meta.project_name)}',
  '${escapeSQL(meta.client || "")}',
  '${escapeSQL(tagline)}',
  '${escapeSQL(meta.status || "draft")}',
  '${escapeSQL(category)}',
  ${meta.has_live_demo || false},
  ${meta.demo_url ? `'${escapeSQL(meta.demo_url)}'` : "NULL"},
  ${meta.live_url ? `'${escapeSQL(meta.live_url)}'` : "NULL"},
  ${meta.own_site_url ? `'${escapeSQL(meta.own_site_url)}'` : "NULL"},
  ${meta.repo_url ? `'${escapeSQL(meta.repo_url)}'` : "NULL"},
  ${meta.hero_screenshot ? `'${escapeSQL(meta.hero_screenshot)}'` : "NULL"},
  ${meta.video_long_id ? `'${escapeSQL(meta.video_long_id)}'` : "NULL"},
  ${meta.video_short_id ? `'${escapeSQL(meta.video_short_id)}'` : "NULL"},
  ARRAY[${tagsArray}]::TEXT[],
  0
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  client = EXCLUDED.client,
  tagline = EXCLUDED.tagline,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  has_live_demo = EXCLUDED.has_live_demo,
  demo_url = EXCLUDED.demo_url,
  live_url = EXCLUDED.live_url,
  own_site_url = EXCLUDED.own_site_url,
  repo_url = EXCLUDED.repo_url,
  hero_screenshot = EXCLUDED.hero_screenshot,
  video_long_id = EXCLUDED.video_long_id,
  video_short_id = EXCLUDED.video_short_id,
  tags = EXCLUDED.tags;
`);

    // Insert sections
    let sortOrder = 0;
    for (const [sectionType, filename] of Object.entries(SECTION_FILES)) {
      const filePath = path.join(CONTENT_DIR, slug, filename);
      if (!fs.existsSync(filePath)) continue;

      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);

      statements.push(`INSERT INTO project_sections (
  project_id, section_type, title, content, sort_order
) VALUES (
  (SELECT id FROM projects WHERE slug = '${escapeSQL(slug)}'),
  '${escapeSQL(sectionType)}',
  '${escapeSQL((data.title as string) || "")}',
  '${escapeSQL(content)}',
  ${sortOrder}
) ON CONFLICT (project_id, section_type) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  sort_order = EXCLUDED.sort_order;
`);
      sortOrder++;
    }

    statements.push("");
  }

  // Also seed legacy projects
  statements.push("-- Legacy projects (no content folders yet)");
  const legacyProjects = [
    {
      slug: "usgbc-smart-building",
      name: "USGBC-CA Smart Building Assistant",
      client: "USGBC-CA",
      tagline: "AI Building Performance Chatbot",
      category: "green-buildings",
      tags: ["ai-chatbot", "building-codes", "energy-efficiency", "usgbc"],
    },
    {
      slug: "home-energy-planner",
      name: "HomeEnergyPlanner",
      client: "internal",
      tagline: "Your Home Energy Operating System",
      category: "green-buildings",
      own_site_url: "https://www.HomeEnergyPlanner.com",
      tags: ["energy", "rebates", "homeowner", "electrification"],
    },
    {
      slug: "fireshield",
      name: "FireShield Home Defense",
      client: "internal",
      tagline: "AI driven Fire Safety Analyzer",
      category: "green-buildings",
      tags: ["wildfire", "risk-assessment", "ai", "geospatial"],
    },
    {
      slug: "bdc-contractor-hub",
      name: "BDC Colorado AI Contractor Assistant",
      client: "BDC Colorado",
      tagline: "AI-powered Contractor Hub",
      category: "green-buildings",
      tags: ["ai-chatbot", "contractors", "clean-energy", "colorado"],
    },
    {
      slug: "robin",
      name: "ROBIN Curriculum Engine",
      client: "ROBIN",
      tagline: "Customized curriculum at scale",
      category: "education",
      tags: ["education", "curriculum", "ai", "k-12"],
    },
  ];

  for (let i = 0; i < legacyProjects.length; i++) {
    const p = legacyProjects[i];
    const tagsArray = p.tags.map((t) => `'${escapeSQL(t)}'`).join(",");

    statements.push(`INSERT INTO projects (
  slug, name, client, tagline, status, category,
  has_live_demo, tags, sort_order
  ${"own_site_url" in p && p.own_site_url ? ", own_site_url" : ""}
) VALUES (
  '${escapeSQL(p.slug)}',
  '${escapeSQL(p.name)}',
  '${escapeSQL(p.client)}',
  '${escapeSQL(p.tagline)}',
  'published',
  '${escapeSQL(p.category)}',
  false,
  ARRAY[${tagsArray}]::TEXT[],
  ${i}
  ${"own_site_url" in p && p.own_site_url ? `, '${escapeSQL(p.own_site_url)}'` : ""}
) ON CONFLICT (slug) DO NOTHING;
`);
  }

  statements.push("COMMIT;");

  console.log(statements.join("\n"));
}

main();
