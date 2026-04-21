import type {
  ParsedFeature,
  ParsedProofPoint,
  ParsedTechDifferentiator,
  ParsedCaseStudy,
  ParsedProductPage,
  ParsedBlurbs,
  ParsedPortfolio,
} from "../types/projects.js";

/**
 * Parse features.md content into structured feature objects.
 * Format: sections separated by `---`, each with ## title and bold-labeled paragraphs.
 */
export function parseFeatures(content: string): ParsedFeature[] {
  const sections = content.split(/\n---\n/).filter((s) => s.trim());
  const features: ParsedFeature[] = [];

  for (const section of sections) {
    const titleMatch = section.match(/^##\s+\d+\.\s+(.+)$/m);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const description = extractBoldSection(section, "What it does:");
    const userBenefit =
      extractBoldSection(section, "User impact:") ||
      extractBoldSection(section, "Why it matters to users:");
    const differentiation = extractBoldSection(section, "Differentiation:");

    features.push({ title, description, userBenefit, differentiation });
  }

  return features;
}

/**
 * Parse proof-points.md content into numbered statements.
 * Format: numbered list with **bold** statements.
 */
export function parseProofPoints(content: string): ParsedProofPoint[] {
  const points: ParsedProofPoint[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/);
    if (match) {
      const index = parseInt(match[1], 10);
      const statement = (match[2] + (match[3] ? " " + match[3] : "")).trim();
      points.push({ index, statement });
    }
  }

  return points;
}

/**
 * Parse tech-differentiators.md into titled sections.
 * Format: ## numbered title followed by body paragraphs.
 */
export function parseTechDifferentiators(
  content: string,
): ParsedTechDifferentiator[] {
  const sections = content.split(/(?=^## \d+\.)/m).filter((s) => s.trim());
  const differentiators: ParsedTechDifferentiator[] = [];

  for (const section of sections) {
    const titleMatch = section.match(/^##\s+\d+\.\s+(.+)$/m);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const body = section
      .replace(/^##\s+.+$/m, "")
      .trim()
      .split("\n")
      .filter((l) => l.trim())
      .join("\n\n");

    differentiators.push({ title, body });
  }

  return differentiators;
}

/**
 * Parse product-page.md into structured page sections.
 */
export function parseProductPage(content: string): ParsedProductPage {
  const withoutMainTitle = content.replace(/^#\s+.+$/m, "").trim();

  const majorSections = withoutMainTitle
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const heroSection = majorSections[0] || "";
  const headline = extractFirstHeading(content) || "";
  const heroDescription = heroSection
    .replace(/^#\s+.+$/m, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .trim()
    .split("\n")
    .filter((l) => l.trim())
    .join(" ");

  const problemSection = findSection(majorSections, "The Problem") || "";
  const howItWorksRaw = findSection(majorSections, "How It Works") || "";
  const howItWorks = parseHowItWorks(howItWorksRaw);
  const whyDifferent = findSection(majorSections, "Why It") || "";

  const whatWeBuiltRaw = findSection(majorSections, "What We Built") || "";
  const whatWeBuilt = whatWeBuiltRaw
    .split("\n")
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => l.replace(/^-\s+/, "").trim());

  return {
    headline,
    heroDescription,
    problemSection,
    howItWorks,
    whyDifferent,
    whatWeBuilt,
  };
}

/**
 * Parse case-study.md into structured highlights.
 */
export function parseCaseStudy(content: string): ParsedCaseStudy {
  const challenge = extractH3Section(content, "The Challenge") || "";
  const solution = extractH3Section(content, "The Solution") || "";

  const keyFeaturesRaw = extractH3Section(content, "Key Features") || "";
  const keyFeatures = keyFeaturesRaw
    .split(/\n\d+\.\s+/)
    .filter((s) => s.trim())
    .map((s) => {
      const boldMatch = s.match(/\*\*(.+?)\*\*/);
      return boldMatch ? boldMatch[1] : s.split("\n")[0].trim();
    })
    .filter(Boolean);

  const businessImpact = extractH3Section(content, "Business Impact") || "";
  const pandoticRole = extractH3Section(content, "Pandotic") || "";

  return { challenge, solution, keyFeatures, businessImpact, pandoticRole };
}

/**
 * Parse blurbs.md into categorized blurb texts and taglines.
 */
export function parseBlurbs(content: string): ParsedBlurbs {
  const short = extractH2Body(content, "Homepage Blurb") || "";
  const medium = extractH2Body(content, "Medium Portfolio Blurb") || "";
  const sales = extractH2Body(content, "Sales-Oriented Blurb") || "";

  const taglinesSection = extractH2Body(content, "Taglines") || "";
  const taglines = taglinesSection
    .split("\n")
    .filter((l) => l.match(/^\d+\.\s+\*\*/))
    .map((l) => {
      const match = l.match(/\*\*"(.+?)"\*\*/);
      return match ? match[1] : "";
    })
    .filter(Boolean);

  return { short, medium, sales, taglines };
}

/**
 * Parse portfolio.md into summary and bullet points.
 */
export function parsePortfolio(content: string): ParsedPortfolio {
  const body = content.replace(/^#\s+.+$/m, "").trim();
  const withoutSubtitle = body.replace(/^##\s+.+$/m, "").trim();

  const lines = withoutSubtitle.split("\n");
  const paragraphs: string[] = [];
  const bullets: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("- ")) {
      bullets.push(
        line
          .replace(/^-\s+/, "")
          .replace(/\*\*/g, "")
          .trim(),
      );
    } else if (line.trim()) {
      paragraphs.push(line.trim());
    }
  }

  return {
    summary: paragraphs.join(" "),
    bullets,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractBoldSection(text: string, label: string): string {
  const regex = new RegExp(`\\*\\*${escapeRegex(label)}\\*\\*\\s*(.+?)(?=\\*\\*|$)`, "s");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function extractFirstHeading(text: string): string {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function findSection(sections: string[], headingContains: string): string {
  for (const section of sections) {
    if (section.match(new RegExp(`^##\\s+.*${escapeRegex(headingContains)}`, "m"))) {
      return section.replace(/^##\s+.+$/m, "").trim();
    }
  }
  return "";
}

function parseHowItWorks(
  content: string,
): { title: string; description: string }[] {
  const items: { title: string; description: string }[] = [];
  const parts = content.split(/\n\*\*/).filter((s) => s.trim());

  for (const part of parts) {
    const titleMatch = part.match(/^(.+?)\*\*/);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const description = part
        .replace(/^.+?\*\*/, "")
        .trim()
        .split("\n")
        .filter((l) => l.trim())
        .join(" ");
      items.push({ title, description });
    }
  }

  return items;
}

function extractH3Section(text: string, headingContains: string): string {
  const regex = new RegExp(
    `###\\s+.*${escapeRegex(headingContains)}.*\\n([\\s\\S]*?)(?=###\\s|$)`,
    "m",
  );
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function extractH2Body(text: string, headingContains: string): string {
  const regex = new RegExp(
    `##\\s+.*${escapeRegex(headingContains)}.*\\n([\\s\\S]*?)(?=##\\s|$)`,
    "m",
  );
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
