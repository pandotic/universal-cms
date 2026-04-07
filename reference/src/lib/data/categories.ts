import categoriesData from "@/data/categories.json";
import { Category, Layer } from "@/lib/types/category";
import { toCategory } from "./utils/map-fields";

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

export async function getAllCategories(): Promise<Category[]> {
  if (!sbReady()) return (categoriesData as Category[]).sort((a, b) => a.sortOrder - b.sortOrder);
  const sb = await getClient();
  const { data } = await sb.from("categories").select("*").order("sort_order");
  return (data ?? []).map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  if (!sbReady()) return (categoriesData as Category[]).find((c) => c.slug === slug);
  const sb = await getClient();
  const { data } = await sb.from("categories").select("*").eq("slug", slug).single();
  return data ? toCategory(data) : undefined;
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  if (!sbReady()) return (categoriesData as Category[]).find((c) => c.id === id);
  const sb = await getClient();
  const { data } = await sb.from("categories").select("*").eq("id", id).single();
  return data ? toCategory(data) : undefined;
}

export async function getCategoriesByLayer(layer: Layer): Promise<Category[]> {
  if (!sbReady()) return (categoriesData as Category[]).filter((c) => c.layer === layer);
  const sb = await getClient();
  const { data } = await sb.from("categories").select("*").eq("layer", layer).order("sort_order");
  return (data ?? []).map(toCategory);
}

export async function getCategorySlugs(): Promise<string[]> {
  if (!sbReady()) return (categoriesData as Category[]).map((c) => c.slug);
  const sb = await getClient();
  const { data } = await sb.from("categories").select("slug");
  return (data ?? []).map((r) => r.slug);
}

export async function getCategoriesGroupedByLayer(): Promise<Record<Layer, Category[]>> {
  const all = await getAllCategories();
  const groups = {} as Record<Layer, Category[]>;
  for (const layer of Object.values(Layer)) {
    groups[layer] = all.filter((c) => c.layer === layer);
  }
  return groups;
}
