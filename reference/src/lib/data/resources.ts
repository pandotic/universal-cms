import resourcesData from "@/data/esg-resources.json";

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

export interface Resource {
  name: string;
  description: string;
  type: string;
  cost: string;
  link: string;
  isInternal: boolean;
}

export interface ResourceCategory {
  id: string;
  title: string;
  description: string;
  resources: Resource[];
}

export interface ResourcesPageData {
  hero: { title: string; subtitle: string };
  categories: ResourceCategory[];
}

export async function getResourcesPageData(): Promise<ResourcesPageData> {
  if (!sbReady()) return resourcesData as ResourcesPageData;

  const sb = await getClient();

  // Get hero from site_settings
  const { data: heroSetting } = await sb
    .from("site_settings")
    .select("value")
    .eq("key", "resources_hero")
    .single();

  const hero = heroSetting?.value as { title: string; subtitle: string } ?? resourcesData.hero;

  // Get resources grouped by category
  const { data: rows } = await sb
    .from("esg_resources")
    .select("*")
    .eq("status", "published")
    .order("sort_order");

  if (!rows || rows.length === 0) return resourcesData as ResourcesPageData;

  // Group by category_slug
  const categoryMap = new Map<string, ResourceCategory>();
  for (const row of rows) {
    if (!categoryMap.has(row.category_slug)) {
      categoryMap.set(row.category_slug, {
        id: row.category_slug,
        title: row.category_title,
        description: row.category_description ?? "",
        resources: [],
      });
    }
    categoryMap.get(row.category_slug)!.resources.push({
      name: row.name,
      description: row.description ?? "",
      type: row.type ?? "",
      cost: row.cost ?? "",
      link: row.link,
      isInternal: row.is_internal ?? false,
    });
  }

  return {
    hero,
    categories: Array.from(categoryMap.values()),
  };
}
