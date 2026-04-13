import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";
import type { Project, ProjectWithContent } from "@pandotic/universal-cms/types/projects";
import {
  parseFeatures,
  parseProofPoints,
  parseTechDifferentiators,
  parseProductPage,
  parseCaseStudy,
  parseBlurbs,
  parsePortfolio,
} from "@pandotic/universal-cms/data/project-parsers";
import {
  getAllProjects as supabaseGetAllProjects,
  getProjectWithContent as supabaseGetProjectWithContent,
  getProjectBySlug as supabaseGetProjectBySlug,
} from "@pandotic/universal-cms/data/projects";
import {
  legacyProjects,
  legacyDescriptions,
} from "@/data/projects";
import { createClient } from "@/lib/supabase/client";

const CONTENT_DIR = path.join(process.cwd(), "pandotic-content-output");

const EXCLUDED_FILES = new Set([
  "screenshot-brief.md",
  "links.md",
  "video-script-long.md",
  "video-script-short.md",
]);

// ─── Supabase-aware data functions ──────────────────────────────────────────
// Each function tries Supabase first. If env vars aren't set or the query fails,
// it falls back to the existing filesystem reads. This lets the site work as a
// static export during development and seamlessly switch to CMS-managed content.

/**
 * Get all project slugs for static generation.
 */
export async function getContentFolderSlugs(): Promise<string[]> {
  const client = createClient();
  if (client) {
    try {
      const { data } = await client
        .from("projects")
        .select("slug")
        .eq("status", "published");
      if (data && data.length > 0) {
        return data.map((p: { slug: string }) => p.slug);
      }
    } catch {
      // Fall through to filesystem
    }
  }

  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
}

/**
 * Get a single project by slug.
 */
export async function getProject(slug: string): Promise<Project | null> {
  const client = createClient();
  if (client) {
    try {
      const project = await supabaseGetProjectBySlug(client, slug);
      if (project) return project;
    } catch {
      // Fall through
    }
  }

  if (hasContentFolder(slug)) {
    const meta = readMetadata(slug);
    return projectFromMetadata(slug, meta);
  }
  return legacyProjects.find((p) => p.slug === slug) || null;
}

/**
 * Get a project with all parsed content for the detail page.
 */
export async function getProjectWithContent(
  slug: string,
): Promise<ProjectWithContent | null> {
  const client = createClient();
  if (client) {
    try {
      const result = await supabaseGetProjectWithContent(client, slug);
      if (result) return result;
    } catch {
      // Fall through
    }
  }

  if (!hasContentFolder(slug)) return null;

  const meta = readMetadata(slug);
  const project = projectFromMetadata(slug, meta);

  const productPageMd = readMarkdown(slug, "product-page.md");
  const caseStudyMd = readMarkdown(slug, "case-study.md");
  const featuresMd = readMarkdown(slug, "features.md");
  const proofPointsMd = readMarkdown(slug, "proof-points.md");
  const techDiffMd = readMarkdown(slug, "tech-differentiators.md");
  const blurbsMd = readMarkdown(slug, "blurbs.md");
  const portfolioMd = readMarkdown(slug, "portfolio.md");

  return {
    ...project,
    productPage: parseProductPage(productPageMd?.content || ""),
    caseStudy: parseCaseStudy(caseStudyMd?.content || ""),
    features: parseFeatures(featuresMd?.content || ""),
    proofPoints: parseProofPoints(proofPointsMd?.content || ""),
    techDifferentiators: parseTechDifferentiators(techDiffMd?.content || ""),
    blurbs: parseBlurbs(blurbsMd?.content || ""),
    portfolio: parsePortfolio(portfolioMd?.content || ""),
  };
}

/**
 * Get all projects (CMS + filesystem + legacy), for the index page.
 */
export async function getAllProjects(): Promise<Project[]> {
  const client = createClient();
  if (client) {
    try {
      const projects = await supabaseGetAllProjects(client);
      if (projects.length > 0) {
        const dbSlugs = new Set(projects.map((p) => p.slug));
        const filteredLegacy = legacyProjects.filter((p) => !dbSlugs.has(p.slug));
        return [...projects, ...filteredLegacy].sort((a, b) => {
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          return a.sort_order - b.sort_order;
        });
      }
    } catch {
      // Fall through
    }
  }

  const contentProjects = getContentFolderSlugsSync().map((slug) => {
    const meta = readMetadata(slug);
    return projectFromMetadata(slug, meta);
  });

  const contentSlugs = new Set(contentProjects.map((p) => p.slug));
  const filteredLegacy = legacyProjects.filter((p) => !contentSlugs.has(p.slug));

  return [...contentProjects, ...filteredLegacy].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.sort_order - b.sort_order;
  });
}

/**
 * Get the description for a project (for index page cards).
 */
export async function getProjectDescription(slug: string): Promise<string> {
  const client = createClient();
  if (client) {
    try {
      const project = await supabaseGetProjectBySlug(client, slug);
      if (project) {
        const { data } = await client
          .from("project_sections")
          .select("content")
          .eq("project_id", project.id)
          .eq("section_type", "portfolio")
          .single();
        if (data) {
          const portfolio = parsePortfolio(data.content);
          return portfolio.summary;
        }
      }
    } catch {
      // Fall through
    }
  }

  if (hasContentFolder(slug)) {
    const portfolioMd = readMarkdown(slug, "portfolio.md");
    if (portfolioMd) {
      const portfolio = parsePortfolio(portfolioMd.content);
      return portfolio.summary;
    }
  }
  return legacyDescriptions[slug] || "";
}

// ─── Filesystem helpers (retained for fallback) ─────────────────────────────

function getContentFolderSlugsSync(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
}

function hasContentFolder(slug: string): boolean {
  return fs.existsSync(path.join(CONTENT_DIR, slug));
}

function readMetadata(slug: string): Record<string, unknown> {
  const metaPath = path.join(CONTENT_DIR, slug, "metadata.yaml");
  if (!fs.existsSync(metaPath)) return {};
  const raw = fs.readFileSync(metaPath, "utf-8");
  return (yaml.load(raw) as Record<string, unknown>) || {};
}

function readMarkdown(
  slug: string,
  filename: string,
): { frontmatter: Record<string, unknown>; content: string } | null {
  if (EXCLUDED_FILES.has(filename)) return null;
  const filePath = path.join(CONTENT_DIR, slug, filename);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data, content };
}

function projectFromMetadata(
  slug: string,
  meta: Record<string, unknown>,
): Project {
  const productPage = readMarkdown(slug, "product-page.md");
  const tagline =
    (productPage?.frontmatter?.tagline as string) ||
    (meta.project_name as string) ||
    "";

  return {
    id: slug,
    slug,
    name: (meta.project_name as string) || slug,
    client: (meta.client as string) || "",
    tagline,
    status: (meta.status as "draft" | "published") || "draft",
    category: inferCategory(meta.tags as string[]),
    has_live_demo: (meta.has_live_demo as boolean) || false,
    demo_url: (meta.demo_url as string) || null,
    live_url: (meta.live_url as string) || null,
    own_site_url: (meta.own_site_url as string) || null,
    repo_url: (meta.repo_url as string) || null,
    hero_screenshot: (meta.hero_screenshot as string) || null,
    video_long_id: (meta.video_long_id as string) || null,
    video_short_id: (meta.video_short_id as string) || null,
    tags: (meta.tags as string[]) || [],
    sort_order: 0,
    has_detail_page: true,
  };
}

function inferCategory(tags: string[] | undefined): string {
  if (!tags) return "other";
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
