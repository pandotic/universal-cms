import Fuse from "fuse.js";
import { Entity } from "@/lib/types/entity";
import { DirectoryFilters } from "@/lib/types/filters";
import { EntityCategoryRelationship } from "@/lib/types/relationship";
import { Category } from "@/lib/types/category";

export function filterEntities(
  entities: Entity[],
  filters: DirectoryFilters,
  relationships: EntityCategoryRelationship[],
  categories: Category[],
): Entity[] {
  let result = [...entities];

  // 1. Layer filter: resolve layers -> category IDs -> entity IDs
  if (filters.layers.length > 0) {
    const layerCategoryIds = categories
      .filter((c) => filters.layers.includes(c.layer))
      .map((c) => c.id);
    const entityIdsInLayers = new Set(
      relationships
        .filter((r) => layerCategoryIds.includes(r.categoryId))
        .map((r) => r.entityId),
    );
    result = result.filter((e) => entityIdsInLayers.has(e.id));
  }

  // 2. Category filter
  if (filters.categories.length > 0) {
    const entityIdsInCategories = new Set(
      relationships
        .filter((r) => filters.categories.includes(r.categoryId))
        .map((r) => r.entityId),
    );
    result = result.filter((e) => entityIdsInCategories.has(e.id));
  }

  // 3. Type filter
  if (filters.types.length > 0) {
    result = result.filter((e) => filters.types.includes(e.type));
  }

  // 4. Tag filter (OR logic: entity matches if it has ANY of the selected tags)
  if (filters.tags.length > 0) {
    result = result.filter((e) => filters.tags.some((t) => e.tags.includes(t)));
  }

  // 5. Free-text search via Fuse.js (applied last, on already-filtered set)
  if (filters.search.trim()) {
    const fuse = new Fuse(result, {
      keys: ["name", "description", "tags"],
      threshold: 0.3,
      ignoreLocation: true,
    });
    result = fuse.search(filters.search).map((r) => r.item);
  }

  // 6. Sort
  switch (filters.sort) {
    case "name-asc":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      result.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "featured":
    default:
      result.sort(
        (a, b) =>
          (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.name.localeCompare(b.name),
      );
      break;
  }

  return result;
}
