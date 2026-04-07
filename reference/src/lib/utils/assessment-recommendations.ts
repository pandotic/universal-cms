import type { AssessmentResult, SmartRecommendation, Pillar } from "@/lib/types/assessment";
import type { Entity } from "@/lib/types/entity";
import type { Framework } from "@/lib/types/framework";
import type { Category } from "@/lib/types/category";
import type { EntityCategoryRelationship } from "@/lib/types/relationship";

// Maps each subcategory to relevant platform content
const SUBCATEGORY_MAP: Record<
  string,
  { categoryIds: string[]; frameworkSlugs: string[] }
> = {
  "carbon-emissions": {
    categoryIds: ["carbon-accounting"],
    frameworkSlugs: ["ghg-protocol", "sbti", "cdp"],
  },
  "energy-management": {
    categoryIds: ["carbon-accounting"],
    frameworkSlugs: ["ghg-protocol"],
  },
  "waste-circular-economy": {
    categoryIds: ["reporting-software"],
    frameworkSlugs: ["gri-standards"],
  },
  "water-resources": {
    categoryIds: ["reporting-software"],
    frameworkSlugs: ["cdp", "gri-standards"],
  },
  "environmental-policy": {
    categoryIds: ["standards-frameworks", "consulting"],
    frameworkSlugs: ["gri-standards"],
  },
  "labor-practices": {
    categoryIds: ["consulting"],
    frameworkSlugs: ["gri-standards"],
  },
  "diversity-equity-inclusion": {
    categoryIds: ["consulting"],
    frameworkSlugs: ["gri-standards"],
  },
  "supply-chain-responsibility": {
    categoryIds: ["supply-chain"],
    frameworkSlugs: ["gri-standards"],
  },
  "community-engagement": {
    categoryIds: ["consulting"],
    frameworkSlugs: ["gri-standards"],
  },
  "data-privacy": {
    categoryIds: ["data-infrastructure"],
    frameworkSlugs: [],
  },
  "board-structure": {
    categoryIds: ["consulting"],
    frameworkSlugs: [],
  },
  "ethics-compliance": {
    categoryIds: ["consulting"],
    frameworkSlugs: ["gri-standards"],
  },
  "executive-compensation": {
    categoryIds: ["consulting"],
    frameworkSlugs: [],
  },
  "shareholder-rights": {
    categoryIds: ["consulting"],
    frameworkSlugs: [],
  },
  "risk-management": {
    categoryIds: ["reporting-software", "esg-data-ratings"],
    frameworkSlugs: ["tcfd", "issb-ifrs-s1-s2"],
  },
};

interface SmartRecommendationsInput {
  result: AssessmentResult;
  entities: Entity[];
  frameworks: Framework[];
  categories: Category[];
  relationships: EntityCategoryRelationship[];
}

export function generateSmartRecommendations({
  result,
  entities,
  frameworks,
  categories,
  relationships,
}: SmartRecommendationsInput): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  const seenEntityIds = new Set<string>();
  const seenFrameworkSlugs = new Set<string>();

  // Get all subcategory scores, sorted worst first
  const subcategoryScores = result.pillars
    .flatMap((p) => p.subcategories)
    .sort((a, b) => a.score - b.score);

  // Build entity-to-category lookup
  const entityCategoryMap = new Map<string, Set<string>>();
  for (const rel of relationships) {
    if (!entityCategoryMap.has(rel.categoryId)) {
      entityCategoryMap.set(rel.categoryId, new Set());
    }
    entityCategoryMap.get(rel.categoryId)!.add(rel.entityId);
  }

  // Company size mapping for filtering
  const sizeToSegment: Record<string, string> = {
    micro: "smb",
    small: "smb",
    medium: "mid-market",
    large: "enterprise",
    enterprise: "enterprise",
  };
  const userSegment = sizeToSegment[result.companyProfile.size] || "mid-market";

  for (const sub of subcategoryScores) {
    // Only recommend for scores below 70% (developing or worse)
    if (sub.score >= 70) continue;

    const mapping = SUBCATEGORY_MAP[sub.subcategory];
    if (!mapping) continue;

    const reason =
      sub.score < 40
        ? `Critical gap: your ${sub.subcategoryLabel} score is ${sub.score}/100`
        : `Improvement area: your ${sub.subcategoryLabel} score is ${sub.score}/100`;

    // Add framework recommendations
    for (const fwSlug of mapping.frameworkSlugs) {
      if (seenFrameworkSlugs.has(fwSlug)) continue;
      const fw = frameworks.find((f) => f.slug === fwSlug);
      if (!fw) continue;

      seenFrameworkSlugs.add(fwSlug);
      recommendations.push({
        type: "framework",
        id: fw.id,
        slug: fw.slug,
        name: fw.name,
        description: fw.description?.slice(0, 150) + "..." || "",
        reason,
        pillar: sub.pillar,
        subcategory: sub.subcategory,
        score: sub.score,
        href: `/frameworks/${fw.slug}`,
      });
    }

    // Add entity recommendations from mapped categories
    for (const catId of mapping.categoryIds) {
      const entityIds = entityCategoryMap.get(catId);
      if (!entityIds) continue;

      for (const entityId of entityIds) {
        if (seenEntityIds.has(entityId)) continue;
        const entity = entities.find((e) => e.id === entityId);
        if (!entity) continue;

        // Prefer entities matching user's company size
        const segments = entity.profile?.targetMarket?.segments || [];
        const matchesSize = segments.length === 0 || segments.includes(userSegment as never);
        if (!matchesSize && segments.length > 0) continue;

        seenEntityIds.add(entityId);
        const cat = categories.find((c) => c.id === catId);

        recommendations.push({
          type: "entity",
          id: entity.id,
          slug: entity.slug,
          name: entity.name,
          description: entity.description.slice(0, 150) + "...",
          reason,
          pillar: sub.pillar,
          subcategory: sub.subcategory,
          score: sub.score,
          href: `/directory/${entity.slug}`,
        });

        // Limit entities per subcategory
        if (recommendations.filter((r) => r.type === "entity" && r.subcategory === sub.subcategory).length >= 3) {
          break;
        }
      }
    }

    // Add category recommendation
    for (const catId of mapping.categoryIds) {
      const cat = categories.find((c) => c.id === catId);
      if (!cat) continue;

      recommendations.push({
        type: "category",
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description?.slice(0, 150) + "..." || "",
        reason,
        pillar: sub.pillar,
        subcategory: sub.subcategory,
        score: sub.score,
        href: `/categories/${cat.slug}`,
      });
      break; // One category per subcategory
    }
  }

  // Sort: entities and frameworks for worst scores first, limit total
  return recommendations
    .sort((a, b) => {
      // Critical gaps first
      if (a.score !== b.score) return a.score - b.score;
      // Frameworks before entities before categories
      const typeOrder = { framework: 0, entity: 1, category: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    })
    .slice(0, 15); // Cap at 15 recommendations
}

export function encodeShareUrl(result: AssessmentResult): string {
  const params = new URLSearchParams();
  params.set("o", String(result.overall));
  params.set("e", String(result.pillars.find((p) => p.pillar === "environmental")?.score || 0));
  params.set("s", String(result.pillars.find((p) => p.pillar === "social")?.score || 0));
  params.set("g", String(result.pillars.find((p) => p.pillar === "governance")?.score || 0));
  params.set("gr", result.overallGrade);
  if (result.companyProfile.name) {
    params.set("n", result.companyProfile.name);
  }
  params.set("d", result.completedAt.split("T")[0]);
  params.set("ind", result.companyProfile.industry);
  params.set("sz", result.companyProfile.size);
  return `/score/share?${params.toString()}`;
}

export function decodeShareUrl(params: URLSearchParams): {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
  grade: string;
  companyName?: string;
  date: string;
  industry: string;
  size: string;
} | null {
  const o = params.get("o");
  const e = params.get("e");
  const s = params.get("s");
  const g = params.get("g");
  const gr = params.get("gr");
  const d = params.get("d");

  if (!o || !e || !s || !g || !gr || !d) return null;

  return {
    overall: parseInt(o, 10),
    environmental: parseInt(e, 10),
    social: parseInt(s, 10),
    governance: parseInt(g, 10),
    grade: gr,
    companyName: params.get("n") || undefined,
    date: d,
    industry: params.get("ind") || "",
    size: params.get("sz") || "",
  };
}
