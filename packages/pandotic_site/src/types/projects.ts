// Supabase-ready data model for projects.
// These interfaces map 1:1 to future `projects` and `project_sections` tables.
// When the admin interface is built, swap the file-based data layer to Supabase
// client calls — no component changes needed.

// --- Database-aligned types ---

export interface Project {
  id: string; // UUID in Supabase, slug for now
  slug: string;
  name: string;
  client: string;
  tagline: string;
  status: "draft" | "published";
  category: string; // e.g. "green-buildings", "education", "proptech"
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
  has_detail_page: boolean; // true if content folder exists
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
  content: string; // markdown body
  sort_order: number;
}

// --- Parsed, structured types for rendering ---

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

// Full project with all content, ready to render
export interface ProjectWithContent extends Project {
  productPage: ParsedProductPage;
  caseStudy: ParsedCaseStudy;
  features: ParsedFeature[];
  proofPoints: ParsedProofPoint[];
  techDifferentiators: ParsedTechDifferentiator[];
  blurbs: ParsedBlurbs;
  portfolio: ParsedPortfolio;
}
