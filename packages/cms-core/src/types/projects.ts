// ─── Project Portfolio Types ────────────────────────────────────────────────
// Universal types for project showcases across all Pandotic sites.
// Maps 1:1 to the `projects` and `project_sections` Supabase tables.

export interface Project {
  id: string;
  slug: string;
  name: string;
  client: string;
  tagline: string;
  status: "draft" | "published";
  category: string;
  has_live_demo: boolean;
  demo_url: string | null;
  live_url: string | null;
  own_site_url: string | null;
  repo_url: string | null;
  hero_screenshot: string | null;
  video_long_id: string | null;
  video_short_id: string | null;
  tags: string[];
  sort_order: number;
  has_detail_page: boolean;
  created_at?: string;
  updated_at?: string;
}

export type SectionType =
  | "product-page"
  | "case-study"
  | "features"
  | "portfolio"
  | "blurbs"
  | "proof-points"
  | "tech-differentiators";

export interface ProjectSection {
  id: string;
  project_id: string;
  section_type: SectionType;
  title: string;
  content: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Parsed content types for rendering ─────────────────────────────────────

export interface ParsedFeature {
  title: string;
  description: string;
  userBenefit: string;
  differentiation: string;
}

export interface ParsedProofPoint {
  index: number;
  statement: string;
}

export interface ParsedTechDifferentiator {
  title: string;
  body: string;
}

export interface ParsedCaseStudy {
  challenge: string;
  solution: string;
  keyFeatures: string[];
  businessImpact: string;
  pandoticRole: string;
}

export interface ParsedProductPage {
  headline: string;
  heroDescription: string;
  problemSection: string;
  howItWorks: { title: string; description: string }[];
  whyDifferent: string;
  whatWeBuilt: string[];
}

export interface ParsedBlurbs {
  short: string;
  medium: string;
  sales: string;
  taglines: string[];
}

export interface ParsedPortfolio {
  summary: string;
  bullets: string[];
}

export interface ProjectWithContent extends Project {
  productPage: ParsedProductPage;
  caseStudy: ParsedCaseStudy;
  features: ParsedFeature[];
  proofPoints: ParsedProofPoint[];
  techDifferentiators: ParsedTechDifferentiator[];
  blurbs: ParsedBlurbs;
  portfolio: ParsedPortfolio;
}
