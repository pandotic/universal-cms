import relationshipsData from "@/data/relationships.json";
import {
  RelationshipData,
  EntityCategoryRelationship,
  EntityFrameworkRelationship,
} from "@/lib/types/relationship";
import { getAllEntities } from "./entities";
import { getAllFrameworks } from "./frameworks";
import { Entity } from "@/lib/types/entity";
import { Framework } from "@/lib/types/framework";
import {
  toEntityCategoryRelationship,
  toEntityFrameworkRelationship,
} from "./utils/map-fields";

const jsonData = relationshipsData as RelationshipData;

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

export async function getAllEntityCategoryRelationships(): Promise<EntityCategoryRelationship[]> {
  if (!sbReady()) return jsonData.entityCategories;
  const sb = await getClient();
  const { data } = await sb.from("entity_categories").select("*");
  return (data ?? []).map(toEntityCategoryRelationship);
}

export async function getEntitiesForCategory(categoryId: string): Promise<Entity[]> {
  if (!sbReady()) {
    const entityIds = jsonData.entityCategories
      .filter((r) => r.categoryId === categoryId)
      .sort((a) => (a.role === "primary" ? -1 : 1))
      .map((r) => r.entityId);
    const allEntities = await getAllEntities();
    return entityIds
      .map((id) => allEntities.find((e) => e.id === id))
      .filter((e): e is Entity => e !== undefined);
  }

  const sb = await getClient();
  const { data: rels } = await sb
    .from("entity_categories")
    .select("entity_id, role")
    .eq("category_id", categoryId)
    .order("role");
  if (!rels || rels.length === 0) return [];

  const entityIds = rels.map((r) => r.entity_id);
  const { data: entities } = await sb
    .from("entities")
    .select("*")
    .in("id", entityIds)
    .eq("status", "published");

  const { toEntity } = await import("./utils/map-fields");
  const mapped = (entities ?? []).map(toEntity);
  // Preserve ordering: primary first
  return entityIds
    .map((id) => mapped.find((e) => e.id === id))
    .filter((e): e is Entity => e !== undefined);
}

export async function getCategoryIdsForEntity(entityId: string): Promise<string[]> {
  if (!sbReady())
    return jsonData.entityCategories
      .filter((r) => r.entityId === entityId)
      .map((r) => r.categoryId);
  const sb = await getClient();
  const { data } = await sb
    .from("entity_categories")
    .select("category_id")
    .eq("entity_id", entityId);
  return (data ?? []).map((r) => r.category_id);
}

export async function getEntitiesForFramework(frameworkId: string): Promise<Entity[]> {
  if (!sbReady()) {
    const entityIds = jsonData.entityFrameworks
      .filter((r) => r.frameworkId === frameworkId)
      .map((r) => r.entityId);
    const allEntities = await getAllEntities();
    return entityIds
      .map((id) => allEntities.find((e) => e.id === id))
      .filter((e): e is Entity => e !== undefined);
  }

  const sb = await getClient();
  const { data: rels } = await sb
    .from("entity_frameworks")
    .select("entity_id")
    .eq("framework_id", frameworkId);
  if (!rels || rels.length === 0) return [];

  const entityIds = rels.map((r) => r.entity_id);
  const { data: entities } = await sb
    .from("entities")
    .select("*")
    .in("id", entityIds)
    .eq("status", "published");

  const { toEntity } = await import("./utils/map-fields");
  return (entities ?? []).map(toEntity);
}

export async function getFrameworkIdsForEntity(entityId: string): Promise<string[]> {
  if (!sbReady())
    return jsonData.entityFrameworks
      .filter((r) => r.entityId === entityId)
      .map((r) => r.frameworkId);
  const sb = await getClient();
  const { data } = await sb
    .from("entity_frameworks")
    .select("framework_id")
    .eq("entity_id", entityId);
  return (data ?? []).map((r) => r.framework_id);
}

export async function getFrameworksForEntity(entityId: string): Promise<Framework[]> {
  const frameworkIds = await getFrameworkIdsForEntity(entityId);
  const allFrameworks = await getAllFrameworks();
  return frameworkIds
    .map((id) => allFrameworks.find((f) => f.id === id))
    .filter((f): f is Framework => f !== undefined);
}

export async function getEntitiesForCategoryWithRelated(categoryId: string): Promise<Entity[]> {
  return getEntitiesForCategory(categoryId);
}

export async function getFrameworksForCategory(categoryId: string): Promise<Framework[]> {
  const entities = await getEntitiesForCategory(categoryId);
  const frameworkIds = new Set<string>();
  for (const entity of entities) {
    const fwIds = await getFrameworkIdsForEntity(entity.id);
    for (const fwId of fwIds) {
      frameworkIds.add(fwId);
    }
  }
  const allFrameworks = await getAllFrameworks();
  return Array.from(frameworkIds)
    .map((id) => allFrameworks.find((f) => f.id === id))
    .filter((f): f is Framework => f !== undefined);
}

export async function getEntitiesByLayerForMap(): Promise<Record<string, Entity[]>> {
  const rels = await getAllEntityCategoryRelationships();
  const allEntities = await getAllEntities();
  const result: Record<string, Entity[]> = {};
  for (const rel of rels) {
    if (!result[rel.categoryId]) result[rel.categoryId] = [];
    const entity = allEntities.find((e) => e.id === rel.entityId);
    if (entity && !result[rel.categoryId].find((e) => e.id === entity.id)) {
      result[rel.categoryId].push(entity);
    }
  }
  return result;
}
