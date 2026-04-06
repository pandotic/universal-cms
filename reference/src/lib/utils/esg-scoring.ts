import type {
  Pillar,
  ScoreLevel,
  AssessmentQuestion,
  CompanyProfile,
  PillarScore,
  SubcategoryScore,
  AssessmentResult,
  Recommendation,
} from "@/lib/types/assessment";
import recommendationsData from "@/data/esg-recommendations.json";

const PILLAR_WEIGHTS: Record<Pillar, number> = {
  environmental: 0.4,
  social: 0.3,
  governance: 0.3,
};

export function getGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "F";
}

export function getLevel(score: number): ScoreLevel {
  if (score >= 80) return "leading";
  if (score >= 60) return "strong";
  if (score >= 40) return "developing";
  if (score >= 20) return "beginning";
  return "minimal";
}

export function getLevelLabel(level: ScoreLevel): string {
  const labels: Record<ScoreLevel, string> = {
    leading: "Leading Practice",
    strong: "Strong Foundation",
    developing: "Developing",
    beginning: "Getting Started",
    minimal: "Early Stage",
  };
  return labels[level];
}

export function getPillarLabel(pillar: Pillar): string {
  const labels: Record<Pillar, string> = {
    environmental: "Environmental",
    social: "Social",
    governance: "Governance",
  };
  return labels[pillar];
}

export function getPillarColor(pillar: Pillar): string {
  const colors: Record<Pillar, string> = {
    environmental: "#0f766e",
    social: "#6d28d9",
    governance: "#334155",
  };
  return colors[pillar];
}

function computeSubcategoryScores(
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
): SubcategoryScore[] {
  const grouped = new Map<
    string,
    { pillar: Pillar; label: string; totalWeighted: number; maxWeighted: number }
  >();

  for (const q of questions) {
    const answer = answers[q.id];
    if (answer === undefined) continue;

    const existing = grouped.get(q.subcategory) ?? {
      pillar: q.pillar,
      label: q.subcategoryLabel,
      totalWeighted: 0,
      maxWeighted: 0,
    };

    existing.totalWeighted += answer * q.weight;
    existing.maxWeighted += 4 * q.weight; // max option value is 4
    grouped.set(q.subcategory, existing);
  }

  return Array.from(grouped.entries()).map(([subcategory, data]) => ({
    subcategory,
    subcategoryLabel: data.label,
    pillar: data.pillar,
    score: data.maxWeighted > 0 ? Math.round((data.totalWeighted / data.maxWeighted) * 100) : 0,
    rawScore: data.totalWeighted,
    maxPossible: data.maxWeighted,
  }));
}

function computePillarScores(subcategoryScores: SubcategoryScore[]): PillarScore[] {
  const pillars: Pillar[] = ["environmental", "social", "governance"];

  return pillars.map((pillar) => {
    const subs = subcategoryScores.filter((s) => s.pillar === pillar);
    const avgScore =
      subs.length > 0 ? Math.round(subs.reduce((sum, s) => sum + s.score, 0) / subs.length) : 0;

    return {
      pillar,
      score: avgScore,
      grade: getGrade(avgScore),
      level: getLevel(avgScore),
      subcategories: subs,
    };
  });
}

type RecommendationsMap = Record<
  string,
  Record<
    string,
    {
      title: string;
      description: string;
      actions: string[];
      relatedLinks?: { label: string; href: string }[];
    }
  >
>;

function getRecommendations(subcategoryScores: SubcategoryScore[]): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const sub of subcategoryScores) {
    const level = getLevel(sub.score);
    const categoryRecs = (recommendationsData as RecommendationsMap)[sub.subcategory];
    if (!categoryRecs) continue;

    const rec = categoryRecs[level];
    if (!rec) continue;

    recs.push({
      subcategory: sub.subcategory,
      subcategoryLabel: sub.subcategoryLabel,
      pillar: sub.pillar,
      level,
      title: rec.title,
      description: rec.description,
      actions: rec.actions,
      relatedLinks: rec.relatedLinks,
    });
  }

  // Sort: worst scores first so users see most impactful improvements
  return recs.sort((a, b) => {
    const levelOrder: Record<ScoreLevel, number> = {
      minimal: 0,
      beginning: 1,
      developing: 2,
      strong: 3,
      leading: 4,
    };
    return levelOrder[a.level] - levelOrder[b.level];
  });
}

export function calculateResults(
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
  companyProfile: CompanyProfile,
): AssessmentResult {
  const subcategoryScores = computeSubcategoryScores(questions, answers);
  const pillarScores = computePillarScores(subcategoryScores);

  const overall = Math.round(
    pillarScores.reduce((sum, p) => sum + p.score * PILLAR_WEIGHTS[p.pillar], 0),
  );

  const recommendations = getRecommendations(subcategoryScores);

  return {
    overall,
    overallGrade: getGrade(overall),
    overallLevel: getLevel(overall),
    pillars: pillarScores,
    recommendations,
    completedAt: new Date().toISOString(),
    companyProfile,
  };
}
