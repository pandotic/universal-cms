import type { Entity } from "@/lib/types/entity";
import type {
  MatchInput,
  MatchResult,
  MatchReason,
  ResultCategory,
  PrimaryChallenge,
  SpecificRequirement,
} from "@/lib/types/matcher";

// ── Challenge → Category mapping ─────────────────────────────────────────────

const CHALLENGE_CATEGORIES: Record<PrimaryChallenge, string[]> = {
  reporting: ["reporting-software", "standards-frameworks"],
  carbon: ["carbon-accounting"],
  "supply-chain": ["supply-chain"],
  ratings: ["esg-data-ratings", "data-infrastructure"],
  assurance: ["verification"],
  strategy: ["consulting", "standards-frameworks"],
  understand: ["standards-frameworks", "regulators"],
};

// ── OrgSize → MarketSegment mapping ──────────────────────────────────────────

const SIZE_SEGMENT_MAP: Record<string, string> = {
  smb: "smb",
  "mid-market": "mid-market",
  enterprise: "enterprise",
  "financial-institution": "financial-institutions",
};

// ── Requirement matchers ─────────────────────────────────────────────────────

function checkRequirement(
  req: SpecificRequirement,
  entity: Entity,
  entityFrameworkIds: string[],
): boolean {
  const profile = entity.profile;
  switch (req) {
    case "scope-3":
      return (
        entity.tags.includes("scope-3") ||
        entity.categoryIds.includes("supply-chain") ||
        entity.categoryIds.includes("carbon-accounting") ||
        (profile?.useCases?.some((u) =>
          u.toLowerCase().includes("scope 3"),
        ) ?? false)
      );
    case "audit-ready":
      return (
        entity.tags.includes("assurance") ||
        entity.categoryIds.includes("verification") ||
        (profile?.useCases?.some(
          (u) =>
            u.toLowerCase().includes("audit") ||
            u.toLowerCase().includes("assurance"),
        ) ?? false)
      );
    case "multi-framework":
      return entityFrameworkIds.length >= 3;
    case "financial-services":
      return (
        entity.tags.includes("financial-services") ||
        (profile?.industries?.some((i) =>
          i.toLowerCase().includes("financial"),
        ) ?? false) ||
        (profile?.targetMarket?.segments?.includes("financial-institutions") ??
          false)
      );
    case "sap-integration":
      return (
        profile?.integrations?.some(
          (i) => i.toLowerCase().includes("sap") || i.toLowerCase().includes("erp"),
        ) ?? false
      );
    case "mid-market-pricing":
      return (
        profile?.pricingModel === "subscription" ||
        profile?.pricingModel === "freemium" ||
        (profile?.targetMarket?.segments?.includes("mid-market") ?? false) ||
        (profile?.targetMarket?.segments?.includes("smb") ?? false)
      );
    default:
      return false;
  }
}

// ── Scoring engine ───────────────────────────────────────────────────────────

export interface ScoringContext {
  entityFrameworkIds: Record<string, string[]>;
  entityCategoryRoles: Record<string, Record<string, "primary" | "secondary">>;
}

export function scoreEntity(
  entity: Entity,
  input: MatchInput,
  ctx: ScoringContext,
): { score: number; reasons: MatchReason[] } {
  let score = 0;
  const reasons: MatchReason[] = [];

  const frameworkIds = ctx.entityFrameworkIds[entity.id] || [];
  const categoryRoles = ctx.entityCategoryRoles[entity.id] || {};

  // ── 1. Challenge → Category (max 30) ────────────────────────────────────

  const targetCategories = CHALLENGE_CATEGORIES[input.challenge] || [];
  let challengeScore = 0;

  for (const catId of targetCategories) {
    const role = categoryRoles[catId];
    if (role === "primary") {
      challengeScore = 30;
      reasons.push({ label: `Primary match for ${input.challenge}`, weight: "strong" });
      break;
    } else if (role === "secondary" && challengeScore < 15) {
      challengeScore = 15;
      reasons.push({ label: `Related to ${input.challenge}`, weight: "moderate" });
    }
  }
  score += challengeScore;

  // ── 2. Framework alignment (max 25) ─────────────────────────────────────

  if (input.frameworks.length > 0) {
    const perFramework = 25 / Math.max(input.frameworks.length, 1);
    let fwScore = 0;

    for (const fwId of input.frameworks) {
      if (frameworkIds.includes(fwId)) {
        fwScore += perFramework;
        reasons.push({ label: `Supports ${fwId}`, weight: "strong" });
      }
    }
    score += Math.min(fwScore, 25);
  }

  // ── 3. Target market fit (max 20) ───────────────────────────────────────

  const profile = entity.profile;
  const segments = profile?.targetMarket?.segments || [];
  const targetSegment = SIZE_SEGMENT_MAP[input.orgSize];

  if (targetSegment && segments.includes(targetSegment as import("@/lib/types/entity").MarketSegment)) {
    score += 12;
    reasons.push({ label: `Serves ${input.orgSize} organizations`, weight: "strong" });
  }

  // Region match
  if (input.orgRegion && profile?.regions) {
    const regionMatch =
      input.orgRegion === "global" ||
      profile.regions.some(
        (r) =>
          r.toLowerCase().includes(input.orgRegion.replace("-", " ")) ||
          r.toLowerCase() === "global",
      );
    if (regionMatch) {
      score += 8;
      reasons.push({ label: `Available in ${input.orgRegion}`, weight: "moderate" });
    }
  }

  // ── 4. Solution type (max 15) ───────────────────────────────────────────

  const solutionMatch = checkSolutionType(entity, input.solutionType);
  if (solutionMatch) {
    score += 15;
    reasons.push({ label: `Matches ${input.solutionType} preference`, weight: "moderate" });
  }

  // ── 5. Specific requirements (max 10) ───────────────────────────────────

  if (input.requirements.length > 0) {
    const perReq = 10 / input.requirements.length;
    for (const req of input.requirements) {
      if (checkRequirement(req, entity, frameworkIds)) {
        score += perReq;
        reasons.push({ label: `Meets: ${req}`, weight: "moderate" });
      }
    }
  }

  return { score: Math.round(Math.min(score, 100)), reasons };
}

function checkSolutionType(entity: Entity, solutionType: string): boolean {
  switch (solutionType) {
    case "software":
      return (
        entity.type === "vendor" ||
        (entity.profile?.deployment?.some((d) => d === "saas" || d === "api") ?? false)
      );
    case "consulting":
      return (
        entity.categoryIds.includes("consulting") ||
        entity.categoryIds.includes("verification")
      );
    case "both":
      return entity.type === "vendor" || entity.categoryIds.includes("consulting");
    case "standards-only":
      return (
        entity.type === "standard-body" ||
        entity.type === "regulator" ||
        entity.categoryIds.includes("standards-frameworks") ||
        entity.categoryIds.includes("regulators")
      );
    default:
      return true;
  }
}

// ── Categorize results ───────────────────────────────────────────────────────

function categorize(entity: Entity, score: number): ResultCategory {
  if (
    entity.type === "standard-body" ||
    entity.type === "regulator" ||
    entity.categoryIds.includes("standards-frameworks") ||
    entity.categoryIds.includes("regulators")
  ) {
    return "standards-to-follow";
  }
  if (entity.categoryIds.includes("consulting") || entity.categoryIds.includes("verification")) {
    return "consulting-partners";
  }
  if (score >= 60) return "recommended-tools";
  return "also-consider";
}

// ── Main entry point ─────────────────────────────────────────────────────────

export function runMatcher(
  entities: Entity[],
  input: MatchInput,
  ctx: ScoringContext,
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const entity of entities) {
    const { score, reasons } = scoreEntity(entity, input, ctx);

    if (score < 20) continue; // Too low relevance — hide

    const category = categorize(entity, score);

    results.push({
      entity,
      score,
      matchReasons: reasons,
      category,
    });
  }

  // Sort by score descending within each category
  results.sort((a, b) => b.score - a.score);

  return results;
}

// ── Category labels ──────────────────────────────────────────────────────────

export const RESULT_CATEGORY_LABELS: Record<ResultCategory, string> = {
  "recommended-tools": "Recommended Tools & Platforms",
  "standards-to-follow": "Standards & Frameworks to Follow",
  "consulting-partners": "Consulting & Assurance Partners",
  "also-consider": "Also Worth Considering",
};

export const RESULT_CATEGORY_ORDER: ResultCategory[] = [
  "recommended-tools",
  "standards-to-follow",
  "consulting-partners",
  "also-consider",
];
