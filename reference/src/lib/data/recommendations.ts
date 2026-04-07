import recommendationsData from "@/data/esg-recommendations.json";
import type { ScoreLevel } from "@/lib/types/assessment";

let _sbConfigured: boolean | null = null;
function sbReady(): boolean {
  if (_sbConfigured !== null) return _sbConfigured;
  _sbConfigured =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return _sbConfigured;
}

async function getClient() {
  const { getSupabaseAdmin } = await import("@/lib/supabase/server");
  return getSupabaseAdmin();
}

export interface RecommendationEntry {
  title: string;
  description: string;
  actions: string[];
  relatedLinks?: { label: string; href: string }[];
}

type RecommendationsMap = Record<string, Record<string, RecommendationEntry>>;

export async function getAllRecommendations(): Promise<RecommendationsMap> {
  if (!sbReady()) return recommendationsData as RecommendationsMap;

  const sb = await getClient();
  const { data } = await sb
    .from("esg_recommendations")
    .select("*");

  const map: RecommendationsMap = {};
  for (const row of data ?? []) {
    if (!map[row.subcategory]) map[row.subcategory] = {};
    map[row.subcategory][row.maturity_level] = {
      title: row.title,
      description: row.description,
      actions: row.actions as string[],
      relatedLinks: row.related_links as { label: string; href: string }[] | undefined,
    };
  }
  return map;
}

export async function getRecommendationFor(
  subcategory: string,
  level: ScoreLevel,
): Promise<RecommendationEntry | undefined> {
  if (!sbReady()) {
    const map = recommendationsData as RecommendationsMap;
    return map[subcategory]?.[level];
  }
  const sb = await getClient();
  const { data } = await sb
    .from("esg_recommendations")
    .select("*")
    .eq("subcategory", subcategory)
    .eq("maturity_level", level)
    .single();
  if (!data) return undefined;
  return {
    title: data.title,
    description: data.description,
    actions: data.actions as string[],
    relatedLinks: data.related_links as { label: string; href: string }[] | undefined,
  };
}
