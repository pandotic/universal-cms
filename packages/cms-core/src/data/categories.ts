import type { SupabaseClient } from "@supabase/supabase-js";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  layer: string;
  sort_order: number;
  [key: string]: unknown;
}

export async function getAllCategories(client: SupabaseClient): Promise<Category[]> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(
  client: SupabaseClient,
  slug: string
): Promise<Category | undefined> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ?? undefined;
}

export async function getCategoryById(
  client: SupabaseClient,
  id: string
): Promise<Category | undefined> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ?? undefined;
}

export async function getCategoriesByLayer(
  client: SupabaseClient,
  layer: string
): Promise<Category[]> {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("layer", layer)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getCategorySlugs(client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client
    .from("categories")
    .select("slug");

  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}

export async function getCategoriesGroupedByLayer(
  client: SupabaseClient
): Promise<Record<string, Category[]>> {
  const all = await getAllCategories(client);
  const groups: Record<string, Category[]> = {};
  for (const cat of all) {
    if (!groups[cat.layer]) groups[cat.layer] = [];
    groups[cat.layer].push(cat);
  }
  return groups;
}
