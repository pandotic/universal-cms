import type { SupabaseClient } from "@supabase/supabase-js";

export type EntityType = string;

export interface Entity {
  id: string;
  slug: string;
  name: string;
  type: EntityType;
  status: string;
  featured: boolean;
  sort_order: number;
  category_ids: string[];
  tags: string[];
  [key: string]: unknown;
}

export async function getAllEntities(client: SupabaseClient): Promise<Entity[]> {
  const { data, error } = await client
    .from("entities")
    .select("*")
    .eq("status", "published")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getEntityBySlug(
  client: SupabaseClient,
  slug: string
): Promise<Entity | undefined> {
  const { data, error } = await client
    .from("entities")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ?? undefined;
}

export async function getEntityById(
  client: SupabaseClient,
  id: string
): Promise<Entity | undefined> {
  const { data, error } = await client
    .from("entities")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ?? undefined;
}

export async function getFeaturedEntities(client: SupabaseClient): Promise<Entity[]> {
  const { data, error } = await client
    .from("entities")
    .select("*")
    .eq("featured", true)
    .eq("status", "published")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getEntitiesByType(
  client: SupabaseClient,
  type: EntityType
): Promise<Entity[]> {
  const { data, error } = await client
    .from("entities")
    .select("*")
    .eq("type", type)
    .eq("status", "published")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getEntitiesByCategory(
  client: SupabaseClient,
  categoryId: string
): Promise<Entity[]> {
  const { data, error } = await client
    .from("entities")
    .select("*")
    .contains("category_ids", [categoryId])
    .eq("status", "published")
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function getAllEntitySlugs(client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client
    .from("entities")
    .select("slug")
    .eq("status", "published");

  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}

export async function getAllTags(client: SupabaseClient): Promise<string[]> {
  const entities = await getAllEntities(client);
  const tags = new Set<string>();
  for (const entity of entities) {
    for (const tag of entity.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}
