import type { UserProfile } from "@/lib/context/AuthContext";
import type { Entity } from "@/lib/types/entity";
import type { Framework } from "@/lib/types/framework";
import type { Category } from "@/lib/types/category";
import type { MatchResult } from "@/lib/types/matcher";
import type { PrimaryChallenge, OrgSize, OrgRegion, SolutionType, SpecificRequirement, MatchInput } from "@/lib/types/matcher";
import { runMatcher, type ScoringContext } from "@/lib/utils/match";

// ── Interest → Challenge mapping ─────────────────────────────────────────────

const INTEREST_TO_CHALLENGE: Record<string, PrimaryChallenge> = {
  reporting: "reporting",
  compliance: "reporting",
  "data-ratings": "ratings",
  consulting: "strategy",
  investing: "ratings",
  carbon: "carbon",
  "supply-chain": "supply-chain",
  other: "understand",
};

// ── Interest → Relevant category IDs ─────────────────────────────────────────

const INTEREST_CATEGORIES: Record<string, string[]> = {
  reporting: ["reporting-software", "standards-frameworks", "verification"],
  compliance: ["regulators", "standards-frameworks", "reporting-software"],
  "data-ratings": ["esg-data-ratings", "data-infrastructure"],
  consulting: ["consulting", "verification", "standards-frameworks"],
  investing: ["esg-data-ratings", "data-infrastructure", "standards-frameworks"],
  carbon: ["carbon-accounting", "standards-frameworks"],
  "supply-chain": ["supply-chain", "carbon-accounting", "verification"],
  other: [],
};

// ── Region → Framework mapping ───────────────────────────────────────────────

const REGION_FRAMEWORKS: Record<string, string[]> = {
  "Europe": ["esrs", "eu-taxonomy", "gri-standards", "tcfd"],
  "North America": ["sec-climate-rule", "issb-ifrs-s1-s2", "sasb-standards", "tcfd"],
  "Asia Pacific": ["issb-ifrs-s1-s2", "gri-standards", "tcfd"],
  "Global / Multi-region": ["gri-standards", "issb-ifrs-s1-s2", "tcfd", "cdp"],
  "Other": ["gri-standards", "issb-ifrs-s1-s2", "cdp"],
};

// ── Size mapping ─────────────────────────────────────────────────────────────

function profileSizeToMatcherSize(size?: string): OrgSize {
  switch (size) {
    case "startup":
    case "smb":
      return "smb";
    case "mid-market":
      return "mid-market";
    case "enterprise":
      return "enterprise";
    case "government":
    case "nonprofit":
      return "enterprise"; // closest fit
    default:
      return "mid-market";
  }
}

function profileRegionToMatcherRegion(region?: string): OrgRegion {
  switch (region) {
    case "North America":
      return "north-america";
    case "Europe":
      return "europe";
    case "Asia Pacific":
      return "asia-pacific";
    case "Global / Multi-region":
      return "global";
    default:
      return "global";
  }
}

function profileSolutionToMatcherSolution(sol?: string): SolutionType {
  switch (sol) {
    case "software":
      return "software";
    case "consulting":
      return "consulting";
    case "both":
      return "both";
    case "learning":
      return "standards-only";
    default:
      return "both";
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getRecommendedEntities(
  profile: UserProfile,
  entities: Entity[],
  scoringContext: ScoringContext,
): MatchResult[] {
  const challenge = INTEREST_TO_CHALLENGE[profile.primaryInterest ?? "other"] ?? "understand";
  const input: MatchInput = {
    challenge,
    frameworks: profile.frameworksUsed ?? [],
    orgSize: profileSizeToMatcherSize(profile.companySize),
    orgRegion: profileRegionToMatcherRegion(profile.region),
    solutionType: profileSolutionToMatcherSolution(profile.solutionType),
    requirements: (profile.specificNeeds ?? []) as SpecificRequirement[],
  };
  return runMatcher(entities, input, scoringContext);
}

export function getRelevantFrameworks(
  profile: UserProfile,
  allFrameworks: Framework[],
): Framework[] {
  // If user selected frameworks, prioritize those
  if (profile.frameworksUsed && profile.frameworksUsed.length > 0) {
    const selected = allFrameworks.filter((f) => profile.frameworksUsed!.includes(f.id));
    // Add region-relevant ones not yet selected
    const regionFwIds = REGION_FRAMEWORKS[profile.region ?? ""] ?? [];
    const additional = allFrameworks.filter(
      (f) => regionFwIds.includes(f.id) && !profile.frameworksUsed!.includes(f.id),
    );
    return [...selected, ...additional].slice(0, 6);
  }

  // Otherwise use region-based defaults
  const regionFwIds = REGION_FRAMEWORKS[profile.region ?? "Global / Multi-region"] ?? REGION_FRAMEWORKS["Global / Multi-region"];
  return allFrameworks
    .filter((f) => regionFwIds.includes(f.id))
    .slice(0, 6);
}

export function getRelevantCategoryIds(profile: UserProfile): string[] {
  return INTEREST_CATEGORIES[profile.primaryInterest ?? "other"] ?? [];
}

export function isEntityRecommended(
  entity: Entity,
  profile: UserProfile,
): boolean {
  const relevantCategories = getRelevantCategoryIds(profile);
  return entity.categoryIds.some((catId) => relevantCategories.includes(catId));
}

export interface PersonalizedHeroContent {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

export function getPersonalizedHeroContent(profile: UserProfile): PersonalizedHeroContent {
  const name = profile.company ? ` for ${profile.company}` : "";

  switch (profile.primaryInterest) {
    case "reporting":
      return {
        title: `Your ESG Reporting Hub${name}`,
        subtitle: "Reporting software, standards, and frameworks tailored to your disclosure needs.",
        ctaLabel: "Find Reporting Software",
        ctaHref: "/find?challenge=reporting",
      };
    case "compliance":
      return {
        title: `Your Compliance Dashboard${name}`,
        subtitle: "Stay on top of regulatory requirements and mandatory disclosure frameworks.",
        ctaLabel: "View Regulations",
        ctaHref: "/categories/regulators",
      };
    case "carbon":
      return {
        title: `Your Carbon & Climate Hub${name}`,
        subtitle: "Carbon accounting tools, GHG Protocol resources, and emissions tracking platforms.",
        ctaLabel: "Explore Carbon Tools",
        ctaHref: "/find?challenge=carbon",
      };
    case "data-ratings":
      return {
        title: `Your ESG Data & Ratings Hub${name}`,
        subtitle: "Understand ESG ratings, data providers, and how to improve your scores.",
        ctaLabel: "Explore Data Providers",
        ctaHref: "/categories/esg-data-ratings",
      };
    case "supply-chain":
      return {
        title: `Your Supply Chain ESG Hub${name}`,
        subtitle: "Tools and standards for supply chain sustainability and Scope 3 emissions.",
        ctaLabel: "Explore Supply Chain Tools",
        ctaHref: "/find?challenge=supply-chain",
      };
    case "consulting":
      return {
        title: `Your Sustainability Strategy Hub${name}`,
        subtitle: "Consulting partners, assurance providers, and strategic frameworks.",
        ctaLabel: "Find Consulting Partners",
        ctaHref: "/find?challenge=strategy",
      };
    case "investing":
      return {
        title: `Your Sustainable Investing Hub${name}`,
        subtitle: "ESG data providers, ratings agencies, and investment-grade disclosure frameworks.",
        ctaLabel: "Explore Rating Agencies",
        ctaHref: "/categories/esg-data-ratings",
      };
    default:
      return {
        title: `Your ESG Hub${name}`,
        subtitle: "Explore the ESG ecosystem — standards, data, software, and services personalized for you.",
        ctaLabel: "Explore the Ecosystem",
        ctaHref: "/ecosystem",
      };
  }
}

/** Build a MatchInput from user profile for pre-filling the Finder */
export function profileToMatchInput(profile: UserProfile): Partial<MatchInput> {
  return {
    challenge: INTEREST_TO_CHALLENGE[profile.primaryInterest ?? ""] ?? undefined,
    frameworks: profile.frameworksUsed ?? [],
    orgSize: profile.companySize ? profileSizeToMatcherSize(profile.companySize) : undefined,
    orgRegion: profile.region ? profileRegionToMatcherRegion(profile.region) : undefined,
    solutionType: profile.solutionType ? profileSolutionToMatcherSolution(profile.solutionType) : undefined,
    requirements: (profile.specificNeeds ?? []) as SpecificRequirement[],
  };
}
