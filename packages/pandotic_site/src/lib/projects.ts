import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "js-yaml";
import type { Project, ProjectWithContent } from "@/types/projects";
import {
  legacyProjects,
  legacyDescriptions,
} from "@/data/projects";
import {
  parseFeatures,
  parseProofPoints,
  parseTechDifferentiators,
  parseProductPage,
  parseCaseStudy,
  parseBlurbs,
  parsePortfolio,
} from "@/lib/markdown";

const CONTENT_DIR = path.join(process.cwd(), "pandotic-content-output");

// Files that should never be rendered publicly
const EXCLUDED_FILES = new Set([
  "screenshot-brief.md",
  "links.md",
  "video-script-long.md",
  "video-script-short.md",
]);

/**
 * Get all project slugs that have content folders.
 */
export function getContentFolderSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
}

/**
 * Check if a slug has a content folder.
 */
export function hasContentFolder(slug: string): boolean {
  return fs.existsSync(path.join(CONTENT_DIR, slug));
}

/**
 * Read and parse metadata.yaml for a project.
 */
function readMetadata(slug: string): Record<string, unknown> {
  const metaPath = path.join(CONTENT_DIR, slug, "metadata.yaml");
  if (!fs.existsSync(metaPath)) return {};
  const raw = fs.readFileSync(metaPath, "utf-8");
  return (yaml.load(raw) as Record<string, unknown>) || {};
}

/**
 * Read a markdown file and return frontmatter + body.
 */
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

/**
 * Build a Project object from a content folder's metadata.yaml.
 */
function projectFromMetadata(
  slug: string,
  meta: Record<string, unknown>,
): Project {
  // Also read product-page.md frontmatter for tagline
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

/**
 * Infer category from tags.
 */
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

/**
 * Get a single project by slug (metadata only, no parsed content).
 */
export function getProject(slug: string): Project | null {
  if (hasContentFolder(slug)) {
    const meta = readMetadata(slug);
    return projectFromMetadata(slug, meta);
  }

  const legacy = legacyProjects.find((p) => p.slug === slug);
  return legacy || null;
}

/**
 * Get a project with all parsed content for the detail page.
 * Only works for projects with content folders.
 */
export function getProjectWithContent(
  slug: string,
): ProjectWithContent | null {
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
 * Get all projects (content-folder + legacy), grouped for the index page.
 */
export function getAllProjects(): Project[] {
  const contentProjects = getContentFolderSlugs().map((slug) => {
    const meta = readMetadata(slug);
    return projectFromMetadata(slug, meta);
  });

  // Merge: content-folder projects take precedence over legacy entries with same slug
  const contentSlugs = new Set(contentProjects.map((p) => p.slug));
  const filteredLegacy = legacyProjects.filter(
    (p) => !contentSlugs.has(p.slug),
  );

  return [...contentProjects, ...filteredLegacy].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.sort_order - b.sort_order;
  });
}

/**
 * Get the description for a project (for index page cards).
 * Content-folder projects use the portfolio summary; legacy projects use hardcoded descriptions.
 */
export function getProjectDescription(slug: string): string {
  if (hasContentFolder(slug)) {
    const portfolioMd = readMarkdown(slug, "portfolio.md");
    if (portfolioMd) {
      const portfolio = parsePortfolio(portfolioMd.content);
      return portfolio.summary;
    }
  }
  return legacyDescriptions[slug] || "";
}
