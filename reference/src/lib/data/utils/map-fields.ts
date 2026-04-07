/**
 * Field mapping utilities for converting between snake_case DB rows
 * and camelCase TypeScript types.
 *
 * JSONB columns (profile, seo, content, faqs) are stored as camelCase
 * so they need no transformation.
 */

import type { Entity } from "@/lib/types/entity";
import type { Framework } from "@/lib/types/framework";
import type { GlossaryTerm } from "@/lib/types/glossary";
import type { Category } from "@/lib/types/category";
import type { CategoryContent } from "@/lib/types/category-content";
import type {
  EntityCategoryRelationship,
  EntityFrameworkRelationship,
} from "@/lib/types/relationship";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function toEntity(row: any): Entity {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    description: row.description,
    longDescription: row.long_description ?? undefined,
    logo: row.logo ?? undefined,
    screenshot: row.screenshot ?? undefined,
    website: row.website,
    headquarters: row.headquarters ?? undefined,
    founded: row.founded ?? undefined,
    employeeRange: row.employee_range ?? undefined,
    categoryIds: row.category_ids ?? [],
    frameworkIds: row.framework_ids ?? [],
    tags: row.tags ?? [],
    featured: row.featured ?? false,
    tier: row.tier ?? undefined,
    seo: row.seo ?? undefined,
    profile: row.profile ?? undefined,
  };
}

export function fromEntity(entity: Partial<Entity> & { id: string }): Record<string, unknown> {
  const row: Record<string, unknown> = { id: entity.id };
  if (entity.slug !== undefined) row.slug = entity.slug;
  if (entity.name !== undefined) row.name = entity.name;
  if (entity.type !== undefined) row.type = entity.type;
  if (entity.description !== undefined) row.description = entity.description;
  if (entity.longDescription !== undefined) row.long_description = entity.longDescription;
  if (entity.logo !== undefined) row.logo = entity.logo;
  if (entity.screenshot !== undefined) row.screenshot = entity.screenshot;
  if (entity.website !== undefined) row.website = entity.website;
  if (entity.headquarters !== undefined) row.headquarters = entity.headquarters;
  if (entity.founded !== undefined) row.founded = entity.founded;
  if (entity.employeeRange !== undefined) row.employee_range = entity.employeeRange;
  if (entity.categoryIds !== undefined) row.category_ids = entity.categoryIds;
  if (entity.frameworkIds !== undefined) row.framework_ids = entity.frameworkIds;
  if (entity.tags !== undefined) row.tags = entity.tags;
  if (entity.featured !== undefined) row.featured = entity.featured;
  if (entity.tier !== undefined) row.tier = entity.tier;
  if (entity.seo !== undefined) row.seo = entity.seo;
  if (entity.profile !== undefined) row.profile = entity.profile;
  return row;
}

export function toFramework(row: any): Framework {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    fullName: row.full_name,
    acronym: row.acronym,
    governingBody: row.governing_body,
    type: row.type,
    status: row.status,
    region: row.region,
    year: row.year ?? undefined,
    description: row.description,
    longDescription: row.long_description,
    keyFeatures: row.key_features ?? [],
    applicability: row.applicability,
    relatedFrameworkIds: row.related_framework_ids ?? [],
    website: row.website,
    seo: row.seo,
    faqs: row.faqs ?? undefined,
    sortOrder: row.sort_order ?? 0,
  };
}

export function fromFramework(fw: Partial<Framework> & { id: string }): Record<string, unknown> {
  const row: Record<string, unknown> = { id: fw.id };
  if (fw.slug !== undefined) row.slug = fw.slug;
  if (fw.name !== undefined) row.name = fw.name;
  if (fw.fullName !== undefined) row.full_name = fw.fullName;
  if (fw.acronym !== undefined) row.acronym = fw.acronym;
  if (fw.governingBody !== undefined) row.governing_body = fw.governingBody;
  if (fw.type !== undefined) row.type = fw.type;
  if (fw.status !== undefined) row.status = fw.status;
  if (fw.region !== undefined) row.region = fw.region;
  if (fw.year !== undefined) row.year = fw.year;
  if (fw.description !== undefined) row.description = fw.description;
  if (fw.longDescription !== undefined) row.long_description = fw.longDescription;
  if (fw.keyFeatures !== undefined) row.key_features = fw.keyFeatures;
  if (fw.applicability !== undefined) row.applicability = fw.applicability;
  if (fw.relatedFrameworkIds !== undefined) row.related_framework_ids = fw.relatedFrameworkIds;
  if (fw.website !== undefined) row.website = fw.website;
  if (fw.seo !== undefined) row.seo = fw.seo;
  if (fw.faqs !== undefined) row.faqs = fw.faqs;
  if (fw.sortOrder !== undefined) row.sort_order = fw.sortOrder;
  return row;
}

export function toGlossaryTerm(row: any): GlossaryTerm {
  return {
    id: row.id,
    slug: row.slug,
    term: row.term,
    acronym: row.acronym ?? undefined,
    aliases: row.aliases ?? [],
    definition: row.definition,
    longDefinition: row.long_definition ?? undefined,
    relatedTermIds: row.related_term_ids ?? [],
    categoryIds: row.category_ids ?? [],
    frameworkIds: row.framework_ids ?? [],
    seo: row.seo ?? undefined,
  };
}

export function fromGlossaryTerm(t: Partial<GlossaryTerm> & { id: string }): Record<string, unknown> {
  const row: Record<string, unknown> = { id: t.id };
  if (t.slug !== undefined) row.slug = t.slug;
  if (t.term !== undefined) row.term = t.term;
  if (t.acronym !== undefined) row.acronym = t.acronym;
  if (t.aliases !== undefined) row.aliases = t.aliases;
  if (t.definition !== undefined) row.definition = t.definition;
  if (t.longDefinition !== undefined) row.long_definition = t.longDefinition;
  if (t.relatedTermIds !== undefined) row.related_term_ids = t.relatedTermIds;
  if (t.categoryIds !== undefined) row.category_ids = t.categoryIds;
  if (t.frameworkIds !== undefined) row.framework_ids = t.frameworkIds;
  if (t.seo !== undefined) row.seo = t.seo;
  return row;
}

export function toCategory(row: any): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    layer: row.layer,
    description: row.description,
    longDescription: row.long_description,
    icon: row.icon,
    entityCount: row.entity_count ?? 0,
    seo: row.seo,
    sortOrder: row.sort_order ?? 0,
  };
}

export function fromCategory(c: Partial<Category> & { id: string }): Record<string, unknown> {
  const row: Record<string, unknown> = { id: c.id };
  if (c.slug !== undefined) row.slug = c.slug;
  if (c.name !== undefined) row.name = c.name;
  if (c.shortName !== undefined) row.short_name = c.shortName;
  if (c.layer !== undefined) row.layer = c.layer;
  if (c.description !== undefined) row.description = c.description;
  if (c.longDescription !== undefined) row.long_description = c.longDescription;
  if (c.icon !== undefined) row.icon = c.icon;
  if (c.entityCount !== undefined) row.entity_count = c.entityCount;
  if (c.seo !== undefined) row.seo = c.seo;
  if (c.sortOrder !== undefined) row.sort_order = c.sortOrder;
  return row;
}

export function toCategoryContent(row: any): CategoryContent {
  return row.content as CategoryContent;
}

export function toEntityCategoryRelationship(row: any): EntityCategoryRelationship {
  return {
    entityId: row.entity_id,
    categoryId: row.category_id,
    role: row.role,
  };
}

export function toEntityFrameworkRelationship(row: any): EntityFrameworkRelationship {
  return {
    entityId: row.entity_id,
    frameworkId: row.framework_id,
    relationship: row.relationship,
  };
}
