import entitiesData from "@/data/entities.json";
import { Entity, EntityType } from "@/lib/types/entity";
import { toEntity } from "./utils/map-fields";

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

export async function getAllEntities(): Promise<Entity[]> {
  if (!sbReady()) return entitiesData as Entity[];
  const sb = await getClient();
  const { data } = await sb
    .from("entities")
    .select("*")
    .eq("status", "published")
    .order("sort_order");
  return (data ?? []).map(toEntity);
}

export async function getEntityBySlug(slug: string): Promise<Entity | undefined> {
  if (!sbReady()) return (entitiesData as Entity[]).find((e) => e.slug === slug);
  const sb = await getClient();
  const { data } = await sb
    .from("entities")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data ? toEntity(data) : undefined;
}

export async function getEntityById(id: string): Promise<Entity | undefined> {
  if (!sbReady()) return (entitiesData as Entity[]).find((e) => e.id === id);
  const sb = await getClient();
  const { data } = await sb
    .from("entities")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();
  return data ? toEntity(data) : undefined;
}

export async function getFeaturedEntities(): Promise<Entity[]> {
  if (!sbReady()) return (entitiesData as Entity[]).filter((e) => e.featured);
  const sb = await getClient();
  const { data } = await sb
    .from("entities")
    .select("*")
    .eq("featured", true)
    .eq("status", "published")
    .order("sort_order");
  return (data ?? []).map(toEntity);
}

export async function getEntitiesByType(type: EntityType): Promise<Entity[]> {
  if (!sbReady()) return (entitiesData as Entity[]).filter((e) => e.type === type);
  const sb = await getClient();
  const { data } = await sb
    .from("entities")
    .select("*")
    .eq("type", type)
    .eq("status", "published")
    .order("sort_order");
  return (data ?? []).map(toEntity);
}

export async function getEntitiesByCategory(categoryId: string): Promise<Entity[]> {
  if (!sbReady())
    return (entitiesData as Entity[]).filter((e) => e.categoryIds.includes(categoryId));
  const sb = await getClient();
  const { data } = await sb
    .from("entities")
    .select("*")
    .contains("category_ids", [categoryId])
    .eq("status", "published")
    .order("sort_order");
  return (data ?? []).map(toEntity);
}

export async function getAllEntitySlugs(): Promise<string[]> {
  if (!sbReady()) return (entitiesData as Entity[]).map((e) => e.slug);
  const sb = await getClient();
  const { data } = await sb
    .from("entities")
    .select("slug")
    .eq("status", "published");
  return (data ?? []).map((r) => r.slug);
}

export async function getAllTags(): Promise<string[]> {
  const entities = await getAllEntities();
  const tags = new Set<string>();
  for (const entity of entities) {
    for (const tag of entity.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}
